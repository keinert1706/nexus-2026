const { getSupabaseAdmin } = require('./_shared/supabaseAdmin');

const ALLOWED_ALLERGIES = ['gluten', 'lacteos', 'frutos_secos', 'vegetariano', 'vegano', 'ninguna'];
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

  if (typeof body.confirmacion !== 'boolean') {
    errors.confirmacion = 'Debes indicar si asistirás o no';
  }
  const confirmacion = body.confirmacion === true;

  let menu = null;
  let alergias = [];
  let alergiasOtro = null;

  if (confirmacion) {
    menu = typeof body.menu === 'string' ? body.menu.trim() : '';
    if (!menu || menu.length > 100) {
      errors.menu = 'Debes elegir una opción de menú';
    }

    if (Array.isArray(body.alergias)) {
      alergias = body.alergias
        .filter((tag) => typeof tag === 'string' && ALLOWED_ALLERGIES.includes(tag))
        .slice(0, ALLOWED_ALLERGIES.length);
    }

    alergiasOtro = typeof body.alergias_otro === 'string' ? body.alergias_otro.trim().slice(0, 300) || null : null;
  }

  if (Object.keys(errors).length > 0) {
    return respond(400, { error: 'Revisa los campos del formulario', fields: errors });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('asistentes')
    .insert({
      nombre_completo: nombreCompleto,
      email,
      telefono: telefono || null,
      confirmacion,
      menu,
      alergias,
      alergias_otro: alergiasOtro,
    })
    .select('id, nombre_completo, email, confirmacion, menu, created_at')
    .single();

  if (error) {
    // 23505 = violación de restricción única (email duplicado). Confiamos en la restricción
    // de la base de datos -en vez de "verificar antes de insertar"- para evitar la condición
    // de carrera de dos registros simultáneos con el mismo email (p. ej. pico de tráfico por WhatsApp).
    if (error.code === '23505') {
      return respond(409, { error: 'Este email ya está registrado. Si ya confirmaste tu asistencia, no necesitas volver a hacerlo.' });
    }

    console.error('Error insertando asistente:', error);
    return respond(500, { error: 'No pudimos guardar tu registro. Intenta de nuevo en unos segundos.' });
  }

  return respond(200, { ok: true, asistente: data });
};

function respond(statusCode, bodyObj) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(bodyObj) };
}
