-- ================================================================
-- 00015 — MARKETPLACE FEATURE FLAGS
-- Configuración del marketplace y feature flags
-- ================================================================

-- TABLA CONFIGURACIÓN DEL MARKETPLACE
CREATE TABLE IF NOT EXISTS public.marketplace_config (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL DEFAULT '{}',
  description     TEXT DEFAULT '',
  updated_by      UUID REFERENCES auth.users(id),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_config ENABLE ROW LEVEL SECURITY;

-- Solo admin puede leer/escribir config
CREATE POLICY "config_select_admin" ON public.marketplace_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "config_insert_admin" ON public.marketplace_config
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "config_update_admin" ON public.marketplace_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Seed: feature flags iniciales
INSERT INTO public.marketplace_config (key, value, description) VALUES
('MARKETPLACE_ENABLED', '{"value": true}', 'Habilitar/deshabilitar todo el marketplace'),
('AMAZON_PROVIDER_ENABLED', '{"value": false}', 'Conector Amazon API (pendiente autorización)'),
('WALMART_PROVIDER_ENABLED', '{"value": false}', 'Conector Walmart API (pendiente autorización)'),
('SAMS_PROVIDER_ENABLED', '{"value": false}', 'Conector Sam''s Club (pendiente autorización)'),
('HOME_DEPOT_PROVIDER_ENABLED', '{"value": false}', 'Conector Home Depot (pendiente autorización)'),
('SHEIN_PROVIDER_ENABLED', '{"value": false}', 'Conector SHEIN (pendiente autorización)'),
('CUBA_DELIVERY_ENABLED', '{"value": false}', 'Envíos a Cuba habilitados'),
('INTERNATIONAL_DELIVERY_ENABLED', '{"value": false}', 'Envíos internacionales habilitados'),
('DEFAULT_COMMISSION_RATE', '{"value": 10}', 'Tasa de comisión por defecto (%)'),
('MIN_SELLER_COMMISSION', '{"value": 5}', 'Comisión mínima del vendedor (%)'),
('MAX_SELLER_COMMISSION', '{"value": 50}', 'Comisión máxima del vendedor (%)'),
('SERVICE_FEE_RATE', '{"value": 2.5}', 'Cargo de servicio MSM (%)'),
('AUTO_APPROVE_PRODUCTS', '{"value": false}', 'Aprobar productos automáticamente'),
('AUTO_APPROVE_STORES', '{"value": false}', 'Aprobar tiendas automáticamente'),
('MIN_PRODUCT_PRICE', '{"value": 0.01}', 'Precio mínimo de producto'),
('MAX_PRODUCT_PRICE', '{"value": 999999.99}', 'Precio máximo de producto'),
('MAX_IMAGES_PER_PRODUCT', '{"value": 10}', 'Máximo de imágenes por producto'),
('MAX_PRODUCT_VARIANTS', '{"value": 50}', 'Máximo de variantes por producto'),
('ALLOW_PRICE_MANUAL_OVERRIDE', '{"value": true}', 'Permitir precio manual por encima del calculado'),
('ENABLE_COUPONS', '{"value": true}', 'Habilitar cupones de descuento'),
('ENABLE_REVIEWS', '{"value": true}', 'Habilitar reseñas de productos'),
('ENABLE_FAVORITES', '{"value": true}', 'Habilitar lista de favoritos'),
('ENABLE_DISPUTES', '{"value": true}', 'Habilitar sistema de disputas'),
('SELLER_CAN_REPLY_REVIEWS', '{"value": true}', 'Permitir que vendedores respondan reviews'),
('DISPUTE_SELLER_DEADLINE_HOURS', '{"value": 72}', 'Horas para que el vendedor responda a una disputa'),
('ORDER_AUTO_COMPLETE_DAYS', '{"value": 14}', 'Días para auto-completar pedido entregado'),
('PAYMENT_UNDER_REVIEW_HOURS', '{"value": 24}', 'Horas que un pago puede estar en revisión'),
('LOW_STOCK_THRESHOLD_DEFAULT', '{"value": 5}', 'Umbral de stock bajo por defecto');
