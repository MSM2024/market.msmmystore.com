-- user_settings: persists per-user preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme         TEXT NOT NULL DEFAULT 'dark',
  accent        TEXT NOT NULL DEFAULT '#00D9FF',
  language      TEXT NOT NULL DEFAULT 'es',
  timezone      TEXT NOT NULL DEFAULT 'America/Mexico_City',
  notifications JSONB NOT NULL DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  privacy       JSONB NOT NULL DEFAULT '{"showProfile": true, "showActivity": false}'::jsonb,
  accessibility JSONB NOT NULL DEFAULT '{"reducedMotion": false, "largeText": false, "highContrast": false}'::jsonb,
  audio         JSONB NOT NULL DEFAULT '{"voiceEnabled": false, "autoPlay": true, "volume": 80}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_own" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_settings_upsert_own" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- auto-create default settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_settings_created ON auth.users;
CREATE TRIGGER on_auth_user_settings_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();
