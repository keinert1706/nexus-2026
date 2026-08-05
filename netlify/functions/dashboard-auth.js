const { signToken } = require('./_shared/auth');

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

  const password = typeof body.password === 'string' ? body.password : '';
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected) {
    console.error('Falta DASHBOARD_PASSWORD en Netlify.');
    return respond(500, { error: 'El dashboard no está configurado todavía.' });
  }

  if (password !== expected) {
    return respond(401, { error: 'Contraseña incorrecta' });
  }

  const token = signToken();
  return respond(200, { token });
};

function respond(statusCode, bodyObj) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(bodyObj) };
}
