-- ============================================================
-- Aguara — Allow MercadoLibre (and Milonga) as store platforms
-- Run this in: Supabase Dashboard → SQL Editor
-- Depends on: 001_initial_schema.sql
-- ============================================================
--
-- store_connections.platform has a CHECK constraint that only allowed
-- 'shopify' | 'tiendanube', so inserting a MercadoLibre connection failed with:
--   23514: violates check constraint "store_connections_platform_check"
-- Widen it to include the new sales channels.
-- ============================================================

alter table public.store_connections
  drop constraint if exists store_connections_platform_check;

alter table public.store_connections
  add constraint store_connections_platform_check
  check (platform in ('shopify', 'tiendanube', 'mercadolibre', 'milonga'));
