-- Tabla de leads del formulario de contacto.
-- Pegalo en Supabase → SQL Editor → Run.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  whatsapp text not null,
  empresa text,
  rubro text,
  problema text,
  ahorro_estimado text,
  origen text
);

alter table public.leads enable row level security;

-- La web (rol anon) solo puede insertar; nadie anónimo puede leer.
drop policy if exists "web inserta leads" on public.leads;
create policy "web inserta leads" on public.leads
  for insert to anon with check (true);
