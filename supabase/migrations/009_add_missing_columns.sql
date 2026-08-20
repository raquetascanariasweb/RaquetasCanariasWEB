-- ═══════════════════════════════════════════════════════════════
-- SPORTBALIN — Migración incremental
-- Ejecutar ANTES del full schema si las tablas ya existen
-- Añade columnas nuevas de las migraciones 004-008 + multi-category
-- ═══════════════════════════════════════════════════════════════

-- 004: user_id nullable para pedidos de invitados
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 005: columnas nuevas en orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount_cents INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_amount_cents INTEGER DEFAULT 0;

-- 007: método de pago
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- multi-category: category_ids en products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_ids JSONB DEFAULT '[]'::jsonb;

-- Migrar category_id existente al array
UPDATE products 
SET category_ids = jsonb_build_array(category_id) 
WHERE category_id IS NOT NULL 
  AND (category_ids IS NULL OR category_ids = '[]'::jsonb);

-- Índices nuevos
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN (category_ids);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id);
