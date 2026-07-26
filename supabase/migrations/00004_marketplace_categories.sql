-- ================================================================
-- 00004 — MARKETPLACE CATEGORIES
-- Categorías jerárquicas para productos
-- ================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT DEFAULT '',
  icon            TEXT DEFAULT '',
  image_url       TEXT DEFAULT '',
  parent_id       UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  product_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_categories_slug ON public.marketplace_categories(slug);
CREATE INDEX idx_categories_parent ON public.marketplace_categories(parent_id);
CREATE INDEX idx_categories_active ON public.marketplace_categories(is_active);

-- RLS: cualquiera puede leer categorías activas
CREATE POLICY "categories_select_public" ON public.marketplace_categories
  FOR SELECT USING (is_active = true);

-- Solo admin puede modificar
CREATE POLICY "categories_insert_admin" ON public.marketplace_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "categories_update_admin" ON public.marketplace_categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "categories_delete_admin" ON public.marketplace_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Seed: categorías iniciales
INSERT INTO public.marketplace_categories (name, slug, description, icon, sort_order) VALUES
('Electrónica', 'electronica', 'Dispositivos, gadgets y accesorios tecnológicos', 'smartphone', 1),
('Hogar y Cocina', 'hogar-cocina', 'Electrodomésticos, muebles y utensilios', 'home', 2),
('Moda y Accesorios', 'moda-accesorios', 'Ropa, calzado, joyería y accesorios', 'shirt', 3),
('Belleza y Salud', 'belleza-salud', 'Cuidado personal, cosméticos y suplementos', 'heart', 4),
('Deportes y Aire Libre', 'deportes-aires-libre', 'Equipamiento deportivo y actividades al aire libre', 'dumbbell', 5),
('Juguetes y Niños', 'juguetes-ninos', 'Juguetes, ropa infantil y artículos para bebés', 'baby', 6),
('Automotriz', 'automotriz', 'Repuestos, accesorios y herramientas automotrices', 'car', 7),
('Mascotas', 'mascotas', 'Alimentos, accesorios y cuidado animal', 'dog', 8),
('Libros y Educación', 'libros-educacion', 'Libros, cursos y material educativo', 'book-open', 9),
('Arte y Artesanías', 'arte-artesanias', 'Obras de arte, decoración y productos artesanales', 'palette', 10),
('Alimentos y Bebidas', 'alimentos-bebidas', 'Comida, bebidas y productos gourmet', 'coffee', 11),
('Servicios Digitales', 'servicios-digitales', 'Software, diseños, consultoría y servicios online', 'monitor', 12),
('Envíos y Logística', 'envios-logistica', 'Servicios de envío y gestión logística', 'truck', 13),
('Otros', 'otros', 'Productos que no encajan en otras categorías', 'package', 14);
