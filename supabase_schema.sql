-- ==============================================================================
-- NAV — Navigate, Analyze, Validate
-- Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ==============================================================================

-- ── 1. App Configuration (Stores API keys & settings securely) ───────────────
create table if not exists app_config (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz default now()
);

-- ── 2. Sessions ──────────────────────────────────────────────────────────────
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  job_title   text not null,
  source_file text,
  created_at  timestamptz default now()
);

-- ── 3. Candidates ────────────────────────────────────────────────────────────
create table if not exists candidates (
  id           uuid primary key,
  session_id   uuid references sessions(id) on delete cascade,
  name         text not null,
  group_name   text,
  profile_json jsonb,
  created_at   timestamptz default now()
);

create index if not exists idx_candidates_session on candidates(session_id);

-- ── 4. Audit Trail ───────────────────────────────────────────────────────────
create table if not exists audit_trail (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references sessions(id) on delete cascade,
  candidate_name    text,
  candidate_id      uuid,
  requirement       text,
  insight           text,
  evidence          text,
  source_document   text,
  source_section    text,
  reason            text,
  validation_status text check (validation_status in ('VERIFIED','NEEDS_VALIDATION','MISSING','INFO')),
  agent             text,
  created_at        timestamptz default now()
);

create index if not exists idx_audit_session    on audit_trail(session_id);
create index if not exists idx_audit_candidate  on audit_trail(candidate_id);
create index if not exists idx_audit_status     on audit_trail(validation_status);
create index if not exists idx_audit_created    on audit_trail(created_at desc);

-- ── 5. Evaluation Reports ────────────────────────────────────────────────────
create table if not exists reports (
  id             text primary key,
  candidate_id   uuid,
  candidate_name text,
  job_title      text,
  report_json    jsonb,
  created_at     timestamptz default now()
);

-- ── 6. Row Level Security (RLS) ──────────────────────────────────────────────
alter table app_config   enable row level security;
alter table sessions     enable row level security;
alter table candidates   enable row level security;
alter table audit_trail  enable row level security;
alter table reports      enable row level security;

-- Demo / Hackathon access policies (allows client and backend to read/write)
create policy "Allow all access for demo" on app_config   for all using (true) with check (true);
create policy "Allow all access for demo" on sessions     for all using (true) with check (true);
create policy "Allow all access for demo" on candidates   for all using (true) with check (true);
create policy "Allow all access for demo" on audit_trail  for all using (true) with check (true);
create policy "Allow all access for demo" on reports      for all using (true) with check (true);
