-- ============================================================
-- Aguara — MercadoLibre OAuth support
-- Run this in: Supabase Dashboard → SQL Editor
-- Depends on: 001_initial_schema.sql, 002_connector_accounts.sql
-- ============================================================
--
-- MercadoLibre uses OAuth 2.0 with PKCE and short-lived (6h) access tokens
-- plus refresh tokens. We need to:
--   1. Persist the PKCE code_verifier between connect and callback (oauth_states).
--   2. Store the refresh_token + token expiry on the store connection so the
--      dashboard can refresh the access token when it expires.
-- These columns are nullable and only used by MercadoLibre, so they don't
-- affect the existing Shopify/Tiendanube connections.
-- ============================================================

alter table public.oauth_states
  add column if not exists code_verifier text;

alter table public.store_connections
  add column if not exists refresh_token text;

alter table public.store_connections
  add column if not exists token_expires_at timestamptz;
