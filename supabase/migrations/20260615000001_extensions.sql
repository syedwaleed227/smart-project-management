-- =============================================================================
-- 0001  Extensions, helper schema, and shared trigger functions
-- =============================================================================
-- This is the foundation migration. It enables required Postgres extensions,
-- creates the private `app` schema that holds helper/SECURITY DEFINER functions
-- used by Row Level Security, and defines the shared `set_updated_at` trigger.
-- =============================================================================

create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists pg_trgm;        -- fuzzy / full-text search helpers
-- create extension if not exists vector;      -- enable later for AI semantic search (pgvector)

-- Private schema for helper functions. Not exposed via the auto-generated API.
create schema if not exists app;
revoke all on schema app from public, anon, authenticated;
grant usage on schema app to authenticated, service_role;

-- Keep updated_at fresh on every UPDATE.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
