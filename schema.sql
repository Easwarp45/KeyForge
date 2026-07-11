-- =========================================================================
-- KeyForge PostgreSQL Database Migration Schema
-- Execute this script in your Supabase SQL Editor to set up your tables.
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Organizations
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  industry text,
  region text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Projects (Security isolation boundaries)
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  environment text not null check (environment in ('Dev', 'Staging', 'Prod')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. API Keys (Salted SHA-256 Hashed Storage)
create table if not exists api_keys (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  hashed_key text unique not null, -- SHA-256 Hash of the private key
  key_prefix text not null,        -- E.g., "sk_live_2f8a" (safe for logs & UI)
  scope text not null check (scope in ('Read', 'Read/Write', 'Write', 'Admin')),
  expiry timestamp with time zone,
  status text not null default 'Active' check (status in ('Active', 'Disabled', 'Revoked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for quick key validation queries
create index if not exists idx_api_keys_hash on api_keys(hashed_key);

-- 4. Team Members & Roles (RBAC)
create table if not exists team_members (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  email text not null,
  name text not null,
  role text not null check (role in ('Owner', 'Admin', 'Developer', 'Read Only')),
  status text not null default 'Invited' check (status in ('Active', 'Invited')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (org_id, email)
);

-- 5. Immutable Audit Logs
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  action text not null,
  category text not null,
  target text not null,
  actor_name text not null,
  actor_email text not null,
  ip_address text not null,
  location text not null,
  severity text not null default 'Success' check (severity in ('Success', 'Warning', 'Revocation')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger: Enforce Immutability of Audit Logs (Block updates & deletes)
create or replace function block_audit_mutations()
returns trigger as $$
begin
  raise exception 'Audit logs are read-only. Updates and deletions are forbidden by security rules.';
end;
$$ language plpgsql;

create or replace trigger trg_block_audit_mutations
before update or delete on audit_logs
for each row execute function block_audit_mutations();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
-- WHY: The server API uses the SERVICE_ROLE_KEY which bypasses RLS, and
-- manually scopes queries to auth.orgId. RLS provides defense-in-depth:
-- if any server query forgets the org_id filter, the DB enforces isolation.
-- =========================================================================

-- Organizations
alter table organizations enable row level security;

create policy "Users can view their own org"
  on organizations for select
  using (id in (select org_id from team_members where email = auth.email()));

-- Projects
alter table projects enable row level security;

create policy "Users can view projects in their org"
  on projects for select
  using (org_id in (select org_id from team_members where email = auth.email()));

create policy "Users can create projects in their org"
  on projects for insert
  with check (org_id in (select org_id from team_members where email = auth.email()));

create policy "Users can delete their org projects"
  on projects for delete
  using (org_id in (select org_id from team_members where email = auth.email()));

-- API Keys
alter table api_keys enable row level security;

create policy "Users can view keys in their org projects"
  on api_keys for select
  using (project_id in (
    select p.id from projects p
    join team_members tm on p.org_id = tm.org_id
    where tm.email = auth.email()
  ));

create policy "Users can manage their org keys"
  on api_keys for all
  using (project_id in (
    select p.id from projects p
    join team_members tm on p.org_id = tm.org_id
    where tm.email = auth.email()
  ));

-- Team Members
alter table team_members enable row level security;

create policy "Users can view members in their org"
  on team_members for select
  using (org_id in (select org_id from team_members where email = auth.email()));

create policy "Admins can manage team members"
  on team_members for all
  using (org_id in (
    select org_id from team_members
    where email = auth.email() and role in ('Owner', 'Admin')
  ));

-- Audit Logs (read-only for users; immutability enforced by trigger above)
alter table audit_logs enable row level security;

create policy "Users can view their org audit logs"
  on audit_logs for select
  using (org_id in (select org_id from team_members where email = auth.email()));

create policy "Service role inserts audit logs"
  on audit_logs for insert
  with check (true);

-- =========================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =========================================================================
-- WHY: Every API query filters by org_id, email, or project_id.
-- Without these indexes, queries do full table scans on every request.
-- =========================================================================

create index if not exists idx_projects_org_id on projects(org_id);
create index if not exists idx_team_members_org_id on team_members(org_id);
create index if not exists idx_team_members_email on team_members(email);
create index if not exists idx_api_keys_project_id on api_keys(project_id);
create index if not exists idx_audit_logs_org_created on audit_logs(org_id, created_at desc);
