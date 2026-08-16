-- ═══════════════════════════════════════════════════════════════
-- SPORTBALIN — Migración 006: notificaciones por email
-- Sustituye el webhook por envío directo por correo electrónico.
--
-- Los ajustes de la tienda se guardan como JSON en la tabla `settings`
-- (clave 'notifications'). Esta migración elimina el campo webhook_url
-- y crea en su lugar notification_email (string nullable).
-- ═══════════════════════════════════════════════════════════════

-- 1. Migrar filas existentes: quitar webhook_url y añadir notification_email
UPDATE settings
SET value = (
  jsonb_set(
    (value::jsonb - 'webhook_url'),
    '{notification_email}',
    '""'::jsonb,
    true
  )
)
WHERE key = 'notifications'
  AND jsonb_typeof(value::jsonb) = 'object';

-- 2. Garantizar que siempre exista una fila de notificaciones válida
INSERT INTO settings (key, value)
SELECT 'notifications',
       '{"order_confirmed": true, "order_shipped": true, "order_delivered": true, "low_stock_alert": true, "new_subscriber": false, "notification_email": ""}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'notifications');
