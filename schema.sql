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
