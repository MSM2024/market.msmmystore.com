# BLOQUEOS EXTERNOS

## 🔴 BLOQUEOS QUE IMPIDEN FUNCIONALIDAD

| # | Bloqueo | Afecta | Solución | Dependencia externa |
|---|---------|--------|----------|---------------------|
| 1 | **SUPABASE_SERVICE_ROLE_KEY no configurada** | Seeds, RLS desde servidor, operaciones admin | Obtener de Supabase Dashboard → Settings → API → service_role key | Dueño del proyecto Supabase |
| 2 | **Stripe Price IDs placeholder** (`price_TU-PRICE-PRO`) | Checkout de membresías no funcional | Crear productos y precios en Stripe Dashboard | Stripe Dashboard |
| 3 | **Stripe Webhook Secret vacío** | Webhooks no firmados → activación de membresías falla | Configurar endpoint en Stripe + copiar signing secret | Stripe Dashboard |

## 🟡 BLOQUEOS DE SEGURIDAD

| # | Bloqueo | Riesgo | Solución |
|---|---------|--------|----------|
| 4 | **Gemini API key expuesta** (`AQ.Ab8RN6Jc7...`) | Visible en historial de chat. Cualquiera con acceso al repo puede usarla. | Rotar key en Google AI Studio. Eliminar de .env.local. Agregar a .gitignore si no está. |
| 5 | **localStorage como almacén de auth** | Sesión no portátil entre dispositivos. Posible XSS. | Migrar a Supabase session management. |

## 🟡 BLOQUEOS DE INFRAESTRUCTURA

| # | Bloqueo | Afecta | Solución |
|---|---------|--------|----------|
| 6 | **ELIANA independiente sin migraciones Supabase** | Tablas `eliana_tasks`, `eliana_memories` no versionadas. Schema no reproducible. | Crear migraciones SQL |
| 7 | **ELIANA independiente env placeholders** | GEMINI_API_KEY, SUPABASE keys sin valor real | Copiar valores del proyecto ZAFIRO |
| 8 | **Dominio eliana.msmmystore.com en proyecto incorrecto** | ELIANA independiente no recibe tráfico | Mover dominio de proyecto Vercel zafiro → msm-eliana |
| 9 | **Middleware ELIANA puede no estar activo** | proxy.ts no se llama middleware.ts → auth no protegida | Renombrar a middleware.ts o configurar correctamente |

## ℹ️ NOTAS

- El proyecto Supabase `vcfevlpoqwnsvkwfoprv` es compartido entre ZAFIRO, ELIANA y potencialmente otras apps
- Stripe está en Test Mode — no hay riesgo financiero real
- El service_role key permite bypassear RLS — debe protegerse estrictamente
- La Gemini API key expuesta debe rotarse ANTES de hacer el repositorio público
