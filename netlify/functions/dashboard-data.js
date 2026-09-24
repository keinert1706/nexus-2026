const { getSql } = require('./_shared/db');
const { verifyToken, tokenFromEvent } = require('./_shared/auth');

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const MAX_PAGE_SIZE = 100;
const MAX_EXPORT_ROWS = 5000; // límite de seguridad; con ~300 asistentes nunca se acerca a esto

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return respond(405, { error: 'Método no permitido' });
  }

  if (!verifyToken(tokenFromEvent(event))) {
    return respond(401, { error: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' });
  }

  const action = event.queryStringParameters?.action || 'list';

  try {
    const sql = getSql();

    if (action === 'stats') {
      const [{ stats }] = await sql`select asistentes_stats() as stats`;
      return respond(200, stats);
    }

    const [{ count }] = await sql`select count(*)::int as count from asistentes`;

    if (action === 'export') {
      const rows = await sql`
        select nombre_completo, email, telefono, cargo, confirmacion, created_at
        from asistentes
        order by created_at desc
        limit ${MAX_EXPORT_ROWS}
      `;
      if (count > MAX_EXPORT_ROWS) {
        console.warn(`Export truncado: ${count} filas totales, se devolvieron ${MAX_EXPORT_ROWS}.`);
      }
      return respond(200, { rows, truncated: count > MAX_EXPORT_ROWS });
    }

    // action === 'list' (por defecto): tabla paginada
    const page = Math.max(1, parseInt(event.queryStringParameters?.page, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(event.queryStringParameters?.pageSize, 10) || 25));
    const offset = (page - 1) * pageSize;

    const rows = await sql`
      select id, nombre_completo, email, telefono, cargo, confirmacion, created_at
      from asistentes
      order by created_at desc
      limit ${pageSize} offset ${offset}
    `;

    return respond(200, {
      rows,
      page,
      pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    });
  } catch (error) {
    console.error('Error en dashboard-data:', error);
    return respond(500, { error: 'No pudimos cargar los datos del dashboard.' });
  }
};

function respond(statusCode, bodyObj) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(bodyObj) };
}
