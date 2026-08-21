-- ═══════════════════════════════════════════════════════════════
-- SPORTBALIN — Migración 010: RLS policies para escritura
-- Permite al service role y usuarios autenticados escribir datos
-- ═══════════════════════════════════════════════════════════════

-- Service role bypass (ya debería funcionar por defecto, pero por si acaso)
-- Las policies para service_role no son necesarias porque bypassa RLS,
-- pero necesitamos policies para authenticated users en tablas como
-- orders, cart_items, user_favorites, etc.

-- ORDERS: usuarios autenticados pueden crear sus propios pedidos
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

-- Para tablas de admin (settings, discounts, gift_cards, etc.)
-- el service role bypassa RLS automáticamente.
-- Si usas el cliente admin (SUPABASE_SERVICE_ROLE_KEY), no necesitas policies.
