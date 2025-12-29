
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Inventory Table
create table public.inventory (
  id uuid default uuid_generate_v4() primary key,
  part text not null,
  deskripsi text,
  harga_dpp numeric default 0,
  ppn numeric default 0,
  total_harga numeric default 0,
  satuan text default 'pcs',
  available_qty integer default 0,
  qty_baik integer default 0,
  qty_rusak integer default 0,
  qty_real integer generated always as (qty_baik + qty_rusak) stored,
  lokasi text,
  return_to_factory text default 'NO',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users Table (if using custom table instead of Auth metadata)
-- Note: It is recommended to use Supabase Auth and link to a profiles table.
-- This table mirrors your previous definition.
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  users text, -- username?
  nik text,
  nama_teknisi text,
  role text default 'Viewer',
  permissions jsonb,
  photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table public.inventory enable row level security;
alter table public.users enable row level security;

-- Policy: Public Read (Adjust as needed)
create policy "Enable read access for all users" on public.inventory for select using (true);
create policy "Enable read access for all users" on public.users for select using (true);

-- Policy: Authenticated Insert/Update
create policy "Enable insert for authenticated users only" on public.inventory for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.inventory for update using (auth.role() = 'authenticated');

