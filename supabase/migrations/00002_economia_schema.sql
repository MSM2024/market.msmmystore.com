-- ================================================================
-- FASE 2.2 — ECONOMIA V1.0.9: Abundancia Origen
-- Hereda del Nodo frecuencia_origen
-- Toda operacion nace del nodo frecuencia_origen
-- ================================================================

-- 1. FREQUENCY ORIGIN NODES (Nudo Unico)
CREATE TABLE IF NOT EXISTS public.frequency_origin_nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_name   TEXT UNIQUE NOT NULL,
  checksum    TEXT NOT NULL,
  version     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed: Nudo Unico
INSERT INTO public.frequency_origin_nodes (node_name, checksum, version)
VALUES ('frecuencia_origen', 'FRECUENCIA_ORIGEN_109_MSM', '1.0.9')
ON CONFLICT (node_name) DO NOTHING;

-- 2. FREQUENCY CHANNELS
CREATE TABLE IF NOT EXISTS public.frequency_channels (
  id          TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL,
  prioridad   TEXT NOT NULL CHECK (prioridad IN ('alta', 'baja', 'emergencia')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.frequency_channels (id, nombre, prioridad) VALUES
  ('wifi_5_6', 'WiFi 5.6 GHz', 'alta'),
  ('lora_433', 'LoRa 433 MHz', 'baja'),
  ('ble_mesh', 'BLE Mesh', 'baja'),
  ('sat_gps', 'Satelite GPS', 'emergencia')
ON CONFLICT (id) DO NOTHING;

-- 3. GUARDIAN ACTIONS (audit trail para los 7 Guardianes)
CREATE TABLE IF NOT EXISTS public.guardian_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL,
  guardian_id   INT NOT NULL CHECK (guardian_id BETWEEN 1 AND 7),
  decision      TEXT NOT NULL, -- approved | blocked | escalated
  reason        TEXT DEFAULT '',
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.guardian_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardian_actions_insert" ON public.guardian_actions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "guardian_actions_select" ON public.guardian_actions
  FOR SELECT USING (true);

-- 4. FREQUENCY EVENTS (traza de eventos del ecosistema)
CREATE TABLE IF NOT EXISTS public.frequency_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node     TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  priority        TEXT NOT NULL,
  encrypted_payload JSONB DEFAULT '{}',
  guardian_id     INT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.frequency_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frequency_events_insert" ON public.frequency_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "frequency_events_select" ON public.frequency_events
  FOR SELECT USING (true);

-- 5. ECONOMIA OPERACIONES
CREATE TABLE IF NOT EXISTS public.economia_operaciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        TEXT UNIQUE NOT NULL, -- MSM-2026-0001
  node_id       UUID REFERENCES public.frequency_origin_nodes(id),
  cliente_id    TEXT,
  servicio      TEXT NOT NULL, -- envios_cuba | recargas | producto
  monto         NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  tasa          NUMERIC(12,6),
  tasa_fuente   TEXT,
  tasa_fecha    TIMESTAMPTZ,
  destino       TEXT,
  estado        TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | verificado | entregado | escalado
  prioridad     TEXT NOT NULL,
  channel_id    TEXT REFERENCES public.frequency_channels(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  synced_at     TIMESTAMPTZ
);

ALTER TABLE public.economia_operaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "economia_operaciones_insert" ON public.economia_operaciones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "economia_operaciones_select_own" ON public.economia_operaciones
  FOR SELECT USING (true);

-- 6. ECONOMIA CAJA
CREATE TABLE IF NOT EXISTS public.economia_caja (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operacion_id    UUID REFERENCES public.economia_operaciones(id),
  tipo            TEXT NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  monto           NUMERIC(12,2) NOT NULL,
  metodo          TEXT, -- zelle, cash, mlc, etc
  balance_antes   NUMERIC(12,2),
  balance_despues NUMERIC(12,2),
  firma           TEXT, -- Ed25519
  guardian_id     INT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.economia_caja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "economia_caja_insert" ON public.economia_caja
  FOR INSERT WITH CHECK (true);

CREATE POLICY "economia_caja_select" ON public.economia_caja
  FOR SELECT USING (true);

-- 7. ECONOMIA INVENTARIO
CREATE TABLE IF NOT EXISTS public.economia_inventario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto      TEXT NOT NULL,
  sku           TEXT UNIQUE,
  cantidad      INT NOT NULL CHECK (cantidad >= 0),
  costo         NUMERIC(12,2),
  precio        NUMERIC(12,2),
  ubicacion     TEXT, -- Port Saint Lucie | Cuba | nodo_id
  last_audit    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.economia_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "economia_inventario_insert" ON public.economia_inventario
  FOR INSERT WITH CHECK (true);

CREATE POLICY "economia_inventario_select" ON public.economia_inventario
  FOR SELECT USING (true);

CREATE POLICY "economia_inventario_update" ON public.economia_inventario
  FOR UPDATE USING (true) WITH CHECK (true);

-- 8. VISTA AUDITORIA ECONOMIA
CREATE OR REPLACE VIEW public.vista_auditoria_economia AS
SELECT
  o.codigo,
  o.servicio,
  o.monto,
  o.estado,
  c.tipo,
  c.balance_despues,
  c.created_at as caja_created_at,
  o.created_at as operacion_created_at,
  g.decision as guardian_decision
FROM public.economia_operaciones o
LEFT JOIN public.economia_caja c ON c.operacion_id = o.id
LEFT JOIN public.guardian_actions g ON g.event_id = o.id::text::uuid;
