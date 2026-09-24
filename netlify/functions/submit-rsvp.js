const { getSql } = require('./_shared/db');

const ALLOWED_CARGOS = ['gerente', 'asesor', 'administrador'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Método no permitido' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return respond(400, { error: 'Solicitud inválida' });
  }

  const errors = {};

  const nombreCompleto = typeof body.nombre_completo === 'string' ? body.nombre_completo.trim() : '';
  if (!nombreCompleto || nombreCompleto.length > 200) {
    errors.nombre_completo = 'Nombre completo requerido (máx. 200 caracteres)';
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 320 || !EMAIL_REGEX.test(email)) {
    errors.email = 'Email inválido';
  }

  const telefono = typeof body.telefono === 'string' ? body.telefono.trim().slice(0, 30) : null;

  const cargo = typeof body.cargo === 'string' ? body.cargo.trim() : '';
  if (!ALLOWED_CARGOS.includes(cargo)) {
    errors.cargo = 'Selecciona tu cargo';
  }

  if (typeof body.confirmacion !== 'boolean') {
    errors.confirmacion = 'Debes indicar si asistirás o no';
  }
  const confirmacion = body.confirmacion === true;

  if (Object.keys(errors).length > 0) {
    return respond(400, { error: 'Revisa los campos del formulario', fields: errors });
  }

  try {
    const sql = getSql();
    const [asistente] = await sql`
      insert into asistentes (nombre_completo, email, telefono, cargo, confirmacion)
      values (${nombreCompleto}, ${email}, ${telefono || null}, ${cargo}, ${confirmacion})
      returning id, nombre_completo, email, cargo, confirmacion, created_at
    `;
    return respond(200, { ok: true, asistente });
  } catch (error) {
    // 23505 = violación de restricción única (email duplicado). Confiamos en la restricción
    // de la base de datos -en vez de "verificar antes de insertar"- para evitar la condición
    // de carrera de dos registros simultáneos con el mismo email (p. ej. pico de tráfico por WhatsApp).
    if (error.code === '23505') {
      return respond(409, { error: 'Este email ya está registrado. Si ya confirmaste tu asistencia, no necesitas volver a hacerlo.' });
    }

    console.error('Error insertando asistente:', error);
    return respond(500, { error: 'No pudimos guardar tu registro. Intenta de nuevo en unos segundos.' });
  }
};

function respond(statusCode, bodyObj) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(bodyObj) };
}
