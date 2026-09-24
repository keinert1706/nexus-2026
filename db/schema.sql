-- Nexus 2026 · esquema de base de datos (Neon / Postgres)
-- Ejecuta este script en Neon: panel del proyecto → SQL Editor → pegar → Run
-- (Ya está aplicado en la base de datos actual; solo hace falta si creas una nueva.)

create table if not exists public.asistentes (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  email text not null,
  telefono text,
  cargo text,
  confirmacion boolean not null,
  created_at timestamptz not null default now(),
  constraint asistentes_email_unique unique (email)
);

-- Índices para que el dashboard cargue rápido incluso con cientos de filas
create index if not exists asistentes_created_at_idx on public.asistentes (created_at desc);
create index if not exists asistentes_confirmacion_idx on public.asistentes (confirmacion);

-- Seguridad: la base de datos no es accesible desde el navegador. Todo el acceso
-- (insertar RSVP, leer el dashboard) pasa por las Netlify Functions, que usan la
-- cadena de conexión DATABASE_URL (secreta, nunca se expone al navegador).

-- Función de estadísticas agregadas para el dashboard.
-- Corre 100% dentro de Postgres (rápida sin importar cuántas filas haya),
-- así el dashboard no necesita descargar todos los registros para calcular conteos.
create or replace function public.asistentes_stats()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'total_registros', (select count(*) from public.asistentes),
    'total_confirmados', (select count(*) from public.asistentes where confirmacion = true),
    'total_no_asisten', (select count(*) from public.asistentes where confirmacion = false),
    'cargo_counts', (
      select coalesce(jsonb_object_agg(cargo, cnt), '{}'::jsonb)
      from (
        select cargo, count(*) as cnt
        from public.asistentes
        where confirmacion = true and cargo is not null
        group by cargo
      ) c
    )
  );
$$;
