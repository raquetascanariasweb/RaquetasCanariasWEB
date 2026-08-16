-- ═══════════════════════════════════════════════════════════════
-- SPORTBALIN — Migración 005: RLS + pedidos de invitados
-- ═══════════════════════════════════════════════════════════════

-- 1. ORDERS: email del cliente para recuperación de pedidos de invitados
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- 2. ORDERS: seguimiento de descuentos y gift cards aplicados en el checkout
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount_cents INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_amount_cents INTEGER DEFAULT 0;

-- 2. ACTIVAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- (el service role usado por el backend de la app hace bypass de RLS)

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS: SOLO LECTURA PÚBLICA PARA EL CATÁLOGO
-- (la ANON_KEY solo puede leer catálogo; cualquier escritura queda bloqueada)

CREATE POLICY "anon_read_categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_product_variants" ON product_variants FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_banners" ON banners FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_homepage_hero" ON homepage_hero FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_editorial_blocks" ON editorial_blocks FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_landing_pages" ON landing_pages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_navigation_menus" ON navigation_menus FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_footer_settings" ON footer_settings FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_seo_defaults" ON seo_defaults FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_featured_products" ON featured_products FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_promotional_sections" ON promotional_sections FOR SELECT TO anon USING (true);

-- 4. NINGUNA política para: orders, discounts, gift_cards, newsletter_subscribers,
--    settings, email_campaigns, email_logs, user_favorites, cart_items
--    → el acceso anónimo queda DENEGADO por defecto (solo service role / backend).
