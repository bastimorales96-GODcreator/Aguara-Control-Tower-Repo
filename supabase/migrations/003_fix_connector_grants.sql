-- ============================================================
-- Aguara — Fix connector table GRANTs
-- Run this in: Supabase Dashboard → SQL Editor
-- Depends on: 002_connector_accounts.sql
-- ============================================================
--
-- PROBLEM
-- -------
-- The tables created in 002 (connector_accounts, oauth_states,
-- oauth_discoveries, ad_metrics) were created WITHOUT table-level GRANTs
-- for the `authenticated` / `anon` Postgres roles. RLS was enabled and
-- policies were added, but Postgres checks GRANTs *before* RLS — so every
-- read/write from a user-authenticated Supabase client was rejected with:
--
--   42501  permission denied for table <name>
--
-- This is why Meta/Google OAuth fails with "Failed to initiate OAuth":
-- /api/auth/meta/connect inserts into oauth_states using the authenticated
-- client, and that INSERT is blocked. Shopify works because its callback
-- writes via the service_role client (which bypasses GRANTs + RLS).
--
-- store_connections (from 001) already has the correct GRANTs, which is why
-- it works fine.
--
-- FIX
-- ---
-- Grant the standard table privileges to anon/authenticated. RLS policies
-- from 002 remain in force and continue to scope WHICH rows each user can
-- touch (auth.uid() = user_id), so this does not loosen row-level security.
-- ============================================================

grant select, insert, update, delete on public.connector_accounts to anon, authenticated;
grant select, insert, update, delete on public.oauth_states       to anon, authenticated;
grant select, insert, update, delete on public.oauth_discoveries  to anon, authenticated;
grant select, insert, update, delete on public.ad_metrics         to anon, authenticated;

-- Sequences (in case any serial/identity columns are added later)
grant usage, select on all sequences in schema public to anon, authenticated;

-- ── OPTIONAL HARDENING (recommended) ─────────────────────────────────────────
-- The 002 policy on oauth_states is `using(true) with check(true)`, which lets
-- any authenticated user read every CSRF token. They are short-lived and random,
-- but you can scope them to the owner instead. Uncomment to apply:
--
-- drop policy if exists "Service role manages oauth_states" on public.oauth_states;
-- create policy "Users manage their own oauth_states"
--   on public.oauth_states
--   for all
--   using  (auth.uid() = user_id)
--   with check (auth.uid() = user_id);
