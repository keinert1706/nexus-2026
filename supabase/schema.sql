-- Nexus 2026 · esquema de base de datos
-- Ejecuta este script completo en Supabase: panel del proyecto → SQL Editor → New query → pegar → Run

create table if not exists public.asistentes (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  email text not null,
  telefono text,
  confirmacion boolean not null,
  menu text,
  alergias text[] not null default '{}',
  alergias_otro text,
  created_at timestamptz not null default now(),
  constraint asistentes_email_unique unique (email)
);

-- Índices para que el dashboard cargue rápido incluso con cientos de filas
create index if not exists asistentes_created_at_idx on public.asistentes (created_at desc);
create index if not exists asistentes_confirmacion_idx on public.asistentes (confirmacion);

-- Seguridad: se activa RLS y NO se crea ninguna política pública.
-- Esto significa que la tabla es inaccesible con la "anon key" pública.
-- Todo el acceso (insertar RSVP, leer el dashboard) pasa por las Netlify Functions,
-- que usan la "service_role key" (secreta, nunca se expone al navegador).
alter table public.asistentes enable row level security;

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
    'menu_counts', (
      select coalesce(jsonb_object_agg(menu, cnt), '{}'::jsonb)
      from (
        select menu, count(*) as cnt
        from public.asistentes
        where confirmacion = true and menu is not null
        group by menu
      ) m
    ),
    'alergia_counts', (
      select coalesce(jsonb_object_agg(tag, cnt), '{}'::jsonb)
      from (
        select unnest(alergias) as tag, count(*) as cnt
        from public.asistentes
        where confirmacion = true
        group by tag
      ) a
    )
  );
$$;
