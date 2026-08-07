create table if not exists public.tariffs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description_md text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tariff_packages (
  id uuid primary key default gen_random_uuid(),
  tariff_id uuid not null references public.tariffs(id) on delete cascade,
  title text not null,
  price_regular integer not null,
  price_discounted integer,
  currency text not null default '₽',
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

drop trigger if exists trg_tariffs_updated_at on public.tariffs;
create trigger trg_tariffs_updated_at
before update on public.tariffs
for each row execute function public.set_updated_at();

drop trigger if exists trg_tariff_packages_updated_at on public.tariff_packages;
create trigger trg_tariff_packages_updated_at
before update on public.tariff_packages
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.tariffs to service_role;
grant select, insert, update, delete on public.tariff_packages to service_role;
