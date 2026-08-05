const { getSupabaseAdmin } = require('./_shared/supabaseAdmin');
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

  const supabase = getSupabaseAdmin();
  const action = event.queryStringParameters?.action || 'list';

  try {
    if (action === 'stats') {
      const { data, error } = await supabase.rpc('asistentes_stats');
      if (error) throw error;
      return respond(200, data);
    }

    if (action === 'export') {
      const { data, error, count } = await supabase
        .from('asistentes')
        .select('nombre_completo, email, telefono, confirmacion, menu, alergias, alergias_otro, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, MAX_EXPORT_ROWS - 1);
      if (error) throw error;
      if (count && count > MAX_EXPORT_ROWS) {
        console.warn(`Export truncado: ${count} filas totales, se devolvieron ${MAX_EXPORT_ROWS}.`);
      }
      return respond(200, { rows: data, truncated: !!(count && count > MAX_EXPORT_ROWS) });
    }

    // action === 'list' (por defecto): tabla paginada
    const page = Math.max(1, parseInt(event.queryStringParameters?.page, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(event.queryStringParameters?.pageSize, 10) || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('asistentes')
      .select('id, nombre_completo, email, telefono, confirmacion, menu, alergias, alergias_otro, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return respond(200, {
      rows: data,
      page,
      pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
    });
  } catch (error) {
    console.error('Error en dashboard-data:', error);
    return respond(500, { error: 'No pudimos cargar los datos del dashboard.' });
  }
};

function respond(statusCode, bodyObj) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(bodyObj) };
}
