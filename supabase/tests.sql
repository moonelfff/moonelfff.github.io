create table if not exists public.psychological_tests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  version integer not null default 1,
  schema_json jsonb not null default '{}'::jsonb,
  scoring_json jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_psychological_tests_updated_at on public.psychological_tests;
create trigger trg_psychological_tests_updated_at
before update on public.psychological_tests
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.psychological_tests to service_role;