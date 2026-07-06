-- Run this in the Supabase SQL editor

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  description text,
  cost_price numeric(10,2) not null default 0,
  images text[] not null default '{}',
  category text,
  brand text,
  weight_kg numeric(8,3),
  stock integer not null default 0,
  source text not null default 'supplier' check (source in ('supplier', 'own')),
  supplier_url text,
  supplier_ref text unique,
  attributes jsonb not null default '{}',
  marketplace_prices jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- Indexes
create index if not exists products_name_idx on products using gin (to_tsvector('portuguese', name));
create index if not exists products_source_idx on products (source);
create index if not exists products_active_idx on products (active);
create index if not exists products_category_idx on products (category);
