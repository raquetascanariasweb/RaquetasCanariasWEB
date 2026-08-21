-- ═══════════════════════════════════════════════════════════════
-- RAQUETAS CANARIAS — Migración 011: RLS completo y seguro
-- Habilita RLS en todas las tablas con policies correctas
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. ELIMINAR TODAS LAS POLICIES EXISTENTES
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$$;

-- ═══════════════════════════════════════════════════════════════
-- 2. HABILITAR RLS EN TODAS LAS TABLAS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_usages ENABLE ROW LEVEL SECURITY;
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
-- 3. TABLAS DE LECTURA PÚBLICA (catálogo)
-- anon puede SELECT, todo lo demás solo service role
-- ═══════════════════════════════════════════════════════════════

-- CATEGORIES
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (true);

-- PRODUCTS
CREATE POLICY "public_read_products" ON products
  FOR SELECT USING (true);

-- PRODUCT_VARIANTS
CREATE POLICY "public_read_product_variants" ON product_variants
  FOR SELECT USING (true);

-- FEATURED_PRODUCTS
CREATE POLICY "public_read_featured_products" ON featured_products
  FOR SELECT USING (true);

-- BANNERS
CREATE POLICY "public_read_banners" ON banners
  FOR SELECT USING (true);

-- HOMEPAGE_HERO
CREATE POLICY "public_read_homepage_hero" ON homepage_hero
  FOR SELECT USING (true);

-- EDITORIAL_BLOCKS
CREATE POLICY "public_read_editorial_blocks" ON editorial_blocks
  FOR SELECT USING (true);

-- LANDING_PAGES
CREATE POLICY "public_read_landing_pages" ON landing_pages
  FOR SELECT USING (true);

-- NAVIGATION_MENUS
CREATE POLICY "public_read_navigation_menus" ON navigation_menus
  FOR SELECT USING (true);

-- FOOTER_SETTINGS
CREATE POLICY "public_read_footer_settings" ON footer_settings
  FOR SELECT USING (true);

-- SEO_DEFAULTS
CREATE POLICY "public_read_seo_defaults" ON seo_defaults
  FOR SELECT USING (true);

-- PROMOTIONAL_SECTIONS
CREATE POLICY "public_read_promotional_sections" ON promotional_sections
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 4. TABLAS DE USUARIO (cart_items, user_favorites)
-- Usuarios autenticados gestionan sus propios datos
-- ═══════════════════════════════════════════════════════════════

-- CART_ITEMS
CREATE POLICY "user_read_own_cart" ON cart_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "user_insert_own_cart" ON cart_items
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_update_own_cart" ON cart_items
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_delete_own_cart" ON cart_items
  FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- USER_FAVORITES
CREATE POLICY "user_read_own_favorites" ON user_favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "user_insert_own_favorites" ON user_favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_delete_own_favorites" ON user_favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════
-- 5. NEWSLETTER: inserción pública
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "public_insert_newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- 6. STORAGE: policies para bucket media
-- ═══════════════════════════════════════════════════════════════

-- Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, '{"image/*","video/*"}')
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800, allowed_mime_types = '{"image/*","video/*"}';

-- Policies de storage.objects
CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "storage_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "storage_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media');

CREATE POLICY "storage_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media');

-- ═══════════════════════════════════════════════════════════════
-- 7. TABLAS ADMIN: sin policies públicas
-- Solo accesibles via service role (bypassa RLS)
-- orders, order_items, order_discounts, discounts, gift_cards,
-- gift_card_usages, settings, email_campaigns, email_logs
-- ═══════════════════════════════════════════════════════════════

-- No se crean policies para estas tablas.
-- El service role key bypassa RLS automáticamente.
-- El acceso anónimo queda DENEGADO por defecto.

-- ═══════════════════════════════════════════════════════════════
-- 8. VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════

-- Verificar que RLS está habilitado en todas las tablas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
