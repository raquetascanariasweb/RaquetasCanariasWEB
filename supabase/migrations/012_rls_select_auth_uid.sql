-- ═══════════════════════════════════════════════════════════════
-- RAQUETAS CANARIAS — Migración 012: RLS con select auth.uid()
-- Usa (select auth.uid()) para mejor rendimiento
-- ═══════════════════════════════════════════════════════════════

-- 1. ELIMINAR POLICIES DE USUARIO EXISTENTES
DROP POLICY IF EXISTS "user_read_own_cart" ON cart_items;
DROP POLICY IF EXISTS "user_insert_own_cart" ON cart_items;
DROP POLICY IF EXISTS "user_update_own_cart" ON cart_items;
DROP POLICY IF EXISTS "user_delete_own_cart" ON cart_items;
DROP POLICY IF EXISTS "user_read_own_favorites" ON user_favorites;
DROP POLICY IF EXISTS "user_insert_own_favorites" ON user_favorites;
DROP POLICY IF EXISTS "user_delete_own_favorites" ON user_favorites;

-- 2. CART_ITEMS: policies con (select auth.uid())
CREATE POLICY "user_read_own_cart" ON cart_items
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "user_insert_own_cart" ON cart_items
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_update_own_cart" ON cart_items
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_delete_own_cart" ON cart_items
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- 3. USER_FAVORITES: policies con (select auth.uid())
CREATE POLICY "user_read_own_favorites" ON user_favorites
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "user_insert_own_favorites" ON user_favorites
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_delete_own_favorites" ON user_favorites
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- 4. ORDERS: policy para que usuarios vean sus pedidos
DROP POLICY IF EXISTS "user_read_own_orders" ON orders;
CREATE POLICY "user_read_own_orders" ON orders
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
