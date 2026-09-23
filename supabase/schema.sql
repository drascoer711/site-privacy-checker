-- Run this once in Supabase SQL Editor.
create table if not exists public.reports (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  report jsonb not null
);

create index if not exists reports_user_created_idx on public.reports(user_id, created_at desc);
alter table public.reports enable row level security;

-- API routes use SUPABASE_SERVICE_ROLE_KEY and enforce ownership server-side.
-- Do not expose that key in browser code.
