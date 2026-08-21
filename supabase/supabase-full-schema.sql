-- ═══════════════════════════════════════════════════════════════
-- SPORTBALIN — Full Schema (unified, ejecutar una sola vez)
-- Incluye: tablas base + migraciones 001-008 + multi-category
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- CLEANUP: eliminar tablas y funciones existentes
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS email_logs, email_campaigns, cart_items, user_favorites,
  promotional_sections, banners, featured_products, seo_defaults,
  footer_settings, navigation_menus, landing_pages, editorial_blocks,
  homepage_hero, settings, newsletter_subscribers, gift_cards,
  discounts, orders, product_variants, products, categories
CASCADE;

DROP FUNCTION IF EXISTS decrement_stock;

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  is_collection BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  materials TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  compare_at_price_cents INTEGER,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_ids JSONB DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  colors JSONB NOT NULL DEFAULT '[]',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  sku TEXT DEFAULT '',
  track_inventory BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  color_slug TEXT NOT NULL DEFAULT '',
  price_cents INTEGER,
  stock_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft','pending','paid','processing','shipped','delivered','cancelled','refunded')),
  total_cents INTEGER NOT NULL,
  payment_method TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  payment_verified_at TIMESTAMPTZ,
  items JSONB NOT NULL DEFAULT '[]',
  shipping_address JSONB,
  notes TEXT DEFAULT '',
  tracking_number TEXT DEFAULT '',
  shipping_carrier TEXT DEFAULT '',
  discount_code TEXT,
  discount_amount_cents INTEGER DEFAULT 0,
  gift_card_code TEXT,
  gift_card_amount_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. DISCOUNTS
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value INTEGER NOT NULL,
  min_purchase_cents INTEGER DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. GIFT CARDS
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  initial_balance_cents INTEGER NOT NULL,
  remaining_balance_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  recipient_email TEXT DEFAULT '',
  sender_email TEXT DEFAULT '',
  message TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT DEFAULT '',
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- 8. SETTINGS (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. HOMEPAGE HERO
CREATE TABLE IF NOT EXISTS homepage_hero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL DEFAULT '',
  subheadline TEXT,
  background_image TEXT,
  cta_text TEXT,
  cta_link TEXT,
  secondary_cta_text TEXT,
  secondary_cta_link TEXT,
  overlay_opacity REAL DEFAULT 0.5,
  title_color TEXT,
  subtitle_color TEXT,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. EDITORIAL BLOCKS
CREATE TABLE IF NOT EXISTS editorial_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('richtext','image','video','quote','divider','custom_html')),
  content JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. LANDING PAGES
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  blocks JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. NAVIGATION MENUS
CREATE TABLE IF NOT EXISTS navigation_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. FOOTER SETTINGS
CREATE TABLE IF NOT EXISTS footer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copyright_text TEXT,
  newsletter_text TEXT,
  columns JSONB NOT NULL DEFAULT '[]',
  social_links JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. SEO DEFAULTS
CREATE TABLE IF NOT EXISTS seo_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  og_image TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. FEATURED PRODUCTS
CREATE TABLE IF NOT EXISTS featured_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT,
  link_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  text_x INTEGER NOT NULL DEFAULT 50,
  text_y INTEGER NOT NULL DEFAULT 50,
  title_color TEXT,
  subtitle_color TEXT,
  video_url TEXT,
  video_start INTEGER,
  video_end INTEGER,
  height INTEGER DEFAULT 55,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 17. PROMOTIONAL SECTIONS
CREATE TABLE IF NOT EXISTS promotional_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  layout TEXT NOT NULL DEFAULT 'grid' CHECK (layout IN ('grid','carousel','banner','split')),
  background_color TEXT NOT NULL DEFAULT '#0a0a0a',
  text_color TEXT NOT NULL DEFAULT '#f5f2eb',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  product_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. EMAIL CAMPAIGNS
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL DEFAULT '',
  html_content TEXT NOT NULL DEFAULT '',
  plain_text TEXT DEFAULT '',
  sender_name TEXT DEFAULT 'Sportbalin',
  sender_email TEXT DEFAULT 'noreply@sportbalin.com',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 19. EMAIL LOGS
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent','failed','bounced','opened','clicked')),
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- 20. USER FAVORITES (wishlist)
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 21. CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN (category_ids);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(active);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON gift_cards(active);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_featured_products_order ON featured_products(sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_promotional_sections_order ON promotional_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_user_product_variant ON cart_items(user_id, product_id, size, color);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES: lectura pública para catálogo
-- (anon solo puede leer; escritura bloqueada excepto service role)
-- ═══════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES: escritura para usuarios autenticados
-- ═══════════════════════════════════════════════════════════════

-- ORDERS: usuarios autenticados pueden crear pedidos
CREATE POLICY "authenticated_insert_orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_select_own_orders" ON orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- CART_ITEMS: usuarios autenticados gestionan su propio carrito
CREATE POLICY "authenticated_manage_cart" ON cart_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- USER_FAVORITES: usuarios autenticados gestionan sus favoritos
CREATE POLICY "authenticated_manage_favorites" ON user_favorites
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- NEWSLETTER_SUBSCRIBERS: permitir inserción pública (suscripción)
CREATE POLICY "anon_insert_newsletter" ON newsletter_subscribers
  FOR INSERT TO anon
  WITH CHECK (true);

-- Tablas de admin (settings, discounts, gift_cards, etc.)
-- → el service role bypassa RLS automáticamente, no necesitan policies.

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Decremento atómico de stock (evita condiciones de carrera)
CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id UUID,
  p_size TEXT,
  p_color TEXT,
  p_quantity INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_track BOOLEAN;
  v_variant_id UUID;
  v_current INT;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN;
  END IF;

  -- Variante: hay talla o color
  IF p_size IS NOT NULL OR p_color IS NOT NULL THEN
    SELECT id, stock_quantity, track_inventory
    INTO v_variant_id, v_current, v_track
    FROM product_variants
    WHERE product_id = p_product_id
      AND size = COALESCE(p_size, '')
      AND color_slug = COALESCE(p_color, '')
    FOR UPDATE;

    IF FOUND AND COALESCE(v_track, false) THEN
      UPDATE product_variants
      SET stock_quantity = GREATEST(0, stock_quantity - p_quantity)
      WHERE id = v_variant_id;

      UPDATE products
      SET stock_quantity = COALESCE((
        SELECT SUM(stock_quantity)
        FROM product_variants
        WHERE product_id = p_product_id
      ), 0),
      in_stock = COALESCE((
        SELECT SUM(stock_quantity)
        FROM product_variants
        WHERE product_id = p_product_id
      ), 0) > 0
      WHERE id = p_product_id;
    END IF;
  ELSE
    -- Producto sin variantes
    SELECT stock_quantity, track_inventory
    INTO v_current, v_track
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF FOUND AND COALESCE(v_track, false) THEN
      UPDATE products
      SET stock_quantity = GREATEST(0, stock_quantity - p_quantity),
          in_stock = GREATEST(0, stock_quantity - p_quantity) > 0
      WHERE id = p_product_id;
    END IF;
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA: notificaciones por defecto
-- ═══════════════════════════════════════════════════════════════

INSERT INTO settings (key, value)
SELECT 'notifications',
       '{"order_confirmed": true, "order_shipped": true, "order_delivered": true, "low_stock_alert": true, "new_subscriber": false, "notification_email": ""}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'notifications');
