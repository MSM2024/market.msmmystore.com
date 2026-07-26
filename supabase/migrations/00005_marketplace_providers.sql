-- ================================================================
-- 00005 — MARKETPLACE PROVIDERS
-- Proveedores autorizados con feature flags
-- ================================================================

CREATE TYPE provider_type AS ENUM (
  'manual',
  'api',
  'affiliate',
  'dropship',
  'msm_inventory',
  'cuba_supplier'
);

CREATE TYPE provider_status AS ENUM (
  'inactive',
  'active',
  'suspended',
  'pending_review'
);

CREATE TABLE IF NOT EXISTS public.marketplace_providers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,
  description           TEXT DEFAULT '',
  logo_url              TEXT DEFAULT '',
  website_url           TEXT DEFAULT '',
  contact_email         TEXT DEFAULT '',
  contact_phone         TEXT DEFAULT '',
  
  -- Tipo de proveedor
  provider_type         provider_type NOT NULL DEFAULT 'manual',
  status                provider_status NOT NULL DEFAULT 'inactive',
  
  -- Capacidades
  api_enabled           BOOLEAN DEFAULT false,
  affiliate_enabled     BOOLEAN DEFAULT false,
  resale_enabled        BOOLEAN DEFAULT false,
  dropshipping_enabled  BOOLEAN DEFAULT false,
  
  -- Cobertura geográfica
  countries_supported   TEXT[] DEFAULT '{}',
  
  -- Credenciales (almacenadas en servidor, referenciadas aquí)
  credentials_ref       TEXT DEFAULT '',
  
  -- Comisión y márgenes
  default_commission    NUMERIC(5,2) DEFAULT 0,
  currency              TEXT DEFAULT 'USD',
  
  -- Métricas
  product_count         INTEGER DEFAULT 0,
  total_sales           INTEGER DEFAULT 0,
  average_rating        NUMERIC(3,2) DEFAULT 0,
  
  -- Configuración
  shipping_from_country TEXT DEFAULT '',
  estimated_delivery_days INTEGER DEFAULT 7,
  return_policy         TEXT DEFAULT '',
  
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_providers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_providers_slug ON public.marketplace_providers(slug);
CREATE INDEX idx_providers_status ON public.marketplace_providers(status);
CREATE INDEX idx_providers_type ON public.marketplace_providers(provider_type);

-- RLS: público puede leer proveedores activos
CREATE POLICY "providers_select_public" ON public.marketplace_providers
  FOR SELECT USING (status = 'active');

-- Admin puede todo
CREATE POLICY "providers_insert_admin" ON public.marketplace_providers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "providers_update_admin" ON public.marketplace_providers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "providers_delete_admin" ON public.marketplace_providers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Seed: proveedores iniciales (todos desactivados)
INSERT INTO public.marketplace_providers (name, slug, provider_type, status, description, api_enabled, affiliate_enabled, resale_enabled, dropshipping_enabled, countries_supported) VALUES
('Amazon', 'amazon', 'api', 'inactive', 'Amazon Associates — Programa de afiliados', true, true, false, false, '{"US","CA","MX","GB","DE","FR","ES","IT","JP"}'),
('Walmart', 'walmart', 'api', 'inactive', 'Walmart Marketplace — Vendedores autorizados', true, false, false, false, '{"US","MX","CA"}'),
('Sam''s Club', 'sams-club', 'affiliate', 'inactive', 'Sam''s Club — Enlaces de afiliado', false, true, false, false, '{"US","MX","CN","JP"}'),
('Home Depot', 'home-depot', 'affiliate', 'inactive', 'Home Depot — Afiliados', false, true, false, false, '{"US","CA","MX"}'),
('SHEIN', 'shein', 'api', 'inactive', 'SHEIN — Dropshipping directo', true, false, false, true, '{"US","CA","EU","GLOBAL"}'),
('Proveedor Manual', 'manual-supplier', 'manual', 'active', 'Proveedor ingresado manualmente por el vendedor', false, false, true, false, '{"GLOBAL"}'),
('Inventario MSM', 'msm-inventory', 'msm_inventory', 'active', 'Productos del inventario propio de MSM', false, false, true, false, '{"US","CU"}'),
('Proveedor Cuba', 'cuba-supplier', 'cuba_supplier', 'inactive', 'Proveedores autorizados para entrega en Cuba', false, false, true, false, '{"CU"}');
