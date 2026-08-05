const crypto = require('crypto');

const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas de sesión en el dashboard

function getSecret() {
  const secret = process.env.DASHBOARD_PASSWORD;
  if (!secret) throw new Error('Falta la variable de entorno DASHBOARD_PASSWORD en Netlify.');
  return secret;
}

// Token simple firmado (HMAC): "<expiracion>.<firma>". No es JWT, no necesita dependencias
// extra, y como el secreto (la contraseña del dashboard) solo vive en el servidor, no se
// puede falsificar sin conocerla.
function signToken() {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = String(expires);
  const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;

  const [payload, hmac] = token.split('.');
  if (!payload || !hmac) return false;

  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  return Number(payload) > Date.now();
}

function tokenFromEvent(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}

module.exports = { signToken, verifyToken, tokenFromEvent };
