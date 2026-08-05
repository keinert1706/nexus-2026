const { createClient } = require('@supabase/supabase-js');

let client = null;

// Cliente con la service_role key: solo existe en el servidor (Netlify Functions),
// nunca se envía al navegador. Bypassa RLS a propósito, por eso la tabla no tiene
// políticas públicas: este es el único camino de acceso a los datos.
function getSupabaseAdmin() {
  if (client) return client;

  const url = process.env.SUPABASE2_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2 || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Faltan variables de entorno SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en Netlify.');
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

module.exports = { getSupabaseAdmin };
