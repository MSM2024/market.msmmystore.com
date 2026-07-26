-- ================================================================
-- 00009 — MARKETPLACE CART
-- Carrito de compras por usuario
-- ================================================================

-- TABLA CARRITO
CREATE TABLE IF NOT EXISTS public.marketplace_carts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Resumen del carrito
  item_count      INTEGER DEFAULT 0,
  subtotal        NUMERIC(10,2) DEFAULT 0,
  shipping_total  NUMERIC(10,2) DEFAULT 0,
  tax_total       NUMERIC(10,2) DEFAULT 0,
  discount_total  NUMERIC(10,2) DEFAULT 0,
  grand_total     NUMERIC(10,2) DEFAULT 0,
  currency        TEXT DEFAULT 'USD',
  
  -- Cupón aplicado
  coupon_code     TEXT DEFAULT '',
  coupon_discount NUMERIC(10,2) DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_carts ENABLE ROW LEVEL SECURITY;

-- TABLA ITEMS DEL CARRITO
CREATE TABLE IF NOT EXISTS public.marketplace_cart_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id         UUID REFERENCES public.marketplace_carts(id) ON DELETE CASCADE NOT NULL,
  product_id      UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  variant_id      UUID REFERENCES public.marketplace_product_variants(id) ON DELETE SET NULL,
  
  quantity        INTEGER NOT NULL DEFAULT 1,
  
  -- Precio al momento de agregar
  unit_price      NUMERIC(10,2) NOT NULL,
  total_price     NUMERIC(10,2) NOT NULL,
  
  -- Envío estimado por item
  shipping_cost   NUMERIC(10,2) DEFAULT 0,
  
  -- Notas del cliente
  notes           TEXT DEFAULT '',
  
  added_at        TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(cart_id, product_id, variant_id)
);

ALTER TABLE public.marketplace_cart_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_cart_items_cart ON public.marketplace_cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON public.marketplace_cart_items(product_id);

-- RLS CARRITO: solo el dueño puede ver/modificar su carrito
CREATE POLICY "carts_select_own" ON public.marketplace_carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "carts_insert_own" ON public.marketplace_carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "carts_update_own" ON public.marketplace_carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "carts_delete_own" ON public.marketplace_carts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS ITEMS DEL CARRITO
CREATE POLICY "cart_items_select_own" ON public.marketplace_cart_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marketplace_carts WHERE id = cart_id AND user_id = auth.uid())
  );

CREATE POLICY "cart_items_insert_own" ON public.marketplace_cart_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.marketplace_carts WHERE id = cart_id AND user_id = auth.uid())
  );

CREATE POLICY "cart_items_update_own" ON public.marketplace_cart_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.marketplace_carts WHERE id = cart_id AND user_id = auth.uid())
  );

CREATE POLICY "cart_items_delete_own" ON public.marketplace_cart_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.marketplace_carts WHERE id = cart_id AND user_id = auth.uid())
  );
