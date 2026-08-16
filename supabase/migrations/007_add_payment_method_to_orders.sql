-- ═══════════════════════════════════════════════════════════════
-- SPORTBALIN — Migración 007: método de pago en pedidos
-- Añade la columna payment_method para distinguir stripe / bizum.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
