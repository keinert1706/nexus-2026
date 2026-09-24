const { neon } = require('@neondatabase/serverless');

let sql = null;

// Conexión a Neon (Postgres). La cadena de conexión solo existe en el servidor
// (Netlify Functions), nunca se envía al navegador: este es el único camino de
// acceso a los datos. NETLIFY_DATABASE_URL es el nombre que usa la integración
// de Neon en Netlify; DATABASE_URL sirve si la configuras a mano.
function getSql() {
  if (sql) return sql;

  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) {
    throw new Error('Falta la variable de entorno DATABASE_URL en Netlify.');
  }

  sql = neon(url);
  return sql;
}

module.exports = { getSql };
