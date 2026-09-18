# MSM MY STORE

MVP de `msmmystore.com` como plataforma principal MSM MY STORE para conectar compradores de la diaspora cubana con vendedores VIP verificados dentro de Cuba. MSM controla la tecnologia, cobro, ordenes, ledger financiero, auditoria y confianza. El concepto MSM Marketplace queda como modulo operativo interno, no como nombre publico principal.

## Stack

- Next.js App Router con TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage y RLS
- Prisma para modelo, cliente tipado y seed
- Zod para validaciones
- Resend para correos transaccionales
- Cuenta publica para clientes y vendedores VIP con entrada visible desde perfiles y tienda oficial
- KYC cliente con titular de pago, documento, aceptacion antifraude y preparacion para app externa
- Riesgo por cliente, entrega bloqueada hasta pago aprobado, OTP y evidencia fuerte de entrega
- Modo ligero para internet lento en Cuba, imagenes responsivas y cache de assets publicos
- PWA preparada con manifest, icono MSM y service worker controlado por entorno
- Rediseño mobile first con header limpio, buscador, navegación inferior, cards premium y sistema de diseño reutilizable
- Modulo preparado para WhatsApp API
- Pagos manuales por pais, cuentas rotativas, comprobantes y revision economica
- Remesas MSM como modulo financiero separado de compras
- Billetera digital MSM preparada para saldo, reservas, credito interno y ledger
- Cambio seguro preparado sin publicar tasas ni cuentas privadas fuera de operaciones
- Cajeros MSM Digital como segunda fase: reservas de efectivo, QR temporal, liquidez por zona y futura red fisica
- Perfiles publicos y operativos de vendedores VIP por provincia y municipio
- Expansion multi-pais: Cuba completa y Estados Unidos preparado por estado/ciudad
- Tienda oficial MSM MY STORE LLC como perfil VIP principal
- Productos, servicios y remesas publicados por zona real
- Antifraude basico con alertas auditadas
- Onboarding vendedor VIP, acuerdo digital, soporte por orden, SLA y beta privada

## Variables

Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
RESEND_API_KEY=
MSM_COMMERCIAL_EMAIL=commercial@msmmystore.com
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
NEXT_PUBLIC_SITE_URL=http://localhost:3000
KYC_CUSTOMER_PROVIDER=manual_msm
KYC_CUSTOMER_APP_URL=
KYC_CUSTOMER_WEBHOOK_SECRET=
WHATSAPP_API_BASE_URL=
WHATSAPP_API_TOKEN=
BETA_MODE=true
NEXT_PUBLIC_PWA_ENABLED=false
```

No guardes claves privadas reales en el repositorio.

## Comandos

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## GitHub y Vercel

Para el primer push a GitHub en la laptop, crea un repo privado y abre `github-first-push.cmd`. El script te pedira la URL del repositorio y subira el proyecto sin incluir `.env.local`.

Despues conecta el repositorio en Vercel y configura las variables indicadas en `docs/vercel-deploy.md`.

Para conectar Supabase real y ejecutar las fases 1 a 4 en la laptop, abre `run-supabase-phases-1-4.cmd`. La guia esta en `docs/supabase-live-sync.md`.

Si el servidor local queda roto despues de una prueba o no abre `localhost:3000`, cierra la ventana del servidor con `Ctrl + C` y abre `reset-local.cmd`. Ese script limpia los archivos temporales de Next.js y arranca MSM MY STORE limpio. El comando `pnpm build` esta protegido: si detecta que `localhost:3000` esta encendido, se detiene para no romper el servidor local.

Si prefieres npm:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Flujo operativo

1. El comprador entra a `msmmystore.com`, filtra por pais, estado/provincia, ciudad/municipio, categoria, tienda y producto.
2. Puede crear cuenta en `/auth/signup` para guardar datos, subir comprobantes y seguir ordenes.
3. Completa KYC en `/account/kyc`: identidad, telefono, pais, documento, titular de pago y aceptacion contra contracargos falsos.
4. Ve el perfil del vendedor VIP o tienda oficial, ubicacion, garantia, reputacion, stock y tiempo de entrega.
5. Completa checkout con datos del receptor en Cuba y acepta politicas legales.
6. MSM registra orden, item, evento inicial, aceptacion legal y cuenta rotativa asignada.
7. Cliente sube comprobante y economia lo aprueba o rechaza.
8. Al aprobar, se registra pago, ledger y se activa la entrega VIP.
9. VIP confirma disponibilidad, prepara, marca ruta, entrega y sube evidencia.
10. Economia registra payout, comisiones, cierres y pagos al vendedor.
11. Admin revisa KYC, tiendas, productos, incidencias, reasignaciones y audit logs.
12. Don Miguel revisa metricas ejecutivas en `/dashboard/don-miguel`.

## Perfiles VIP y tienda oficial

Cada vendedor VIP tiene un perfil conectado a `stores`, con nombre comercial, propietario, compania, telefono, WhatsApp, correo, pais, provincia/estado, municipio/ciudad, zonas, categorias, productos, servicios, remesas, horario, capacidad diaria, garantia, estado, nivel y reputacion.

El seed crea una tienda oficial demo:

- MSM MY STORE.
- Propietario Miguel Soria Martinez.
- Compania MSM MY STORE LLC.
- Tipo `tienda_oficial`.
- Nivel `super_vip`.
- Santiago de Cuba, Segundo Frente, zona Mayari Arriba y Segundo Frente.

Los productos publicos solo aparecen si tienen tienda activa, vendedor, provincia, municipio y estado activo. Si falta algo, quedan como borrador.

## Rutas MVP

- `/`: portada comercial principal MSM MY STORE.
- `/products`: productos y servicios.
- `/remittances`: solicitud de remesa con metodo/cuenta MSM y trazabilidad.
- `/remittances/[remittanceId]/proof`: comprobante de remesa.
- `/marketplace`: compatibilidad; redirige a `/`.
- `/cart`: entrada al flujo MVP de compra por orden.
- `/checkout`: formulario del receptor y aceptacion legal.
- `/payment-methods`: metodos por pais sin cuentas exactas.
- `/exchange`: cambio seguro en modo demo operativo.
- `/wallet`: billetera digital MSM preparada para saldo, reservas y ledger.
- `/atm`: Cajeros MSM Digital, reservas de efectivo y QR temporal.
- `/quienes-somos`: vision publica de MSM MY STORE.
- `/orders`: seguimiento de ordenes.
- `/account/kyc`: validacion del cliente y metodo de pago.
- `/auth/signup`: crear cuenta de cliente o iniciar camino para vendedor VIP.
- `/auth/forgot-password`: recuperacion de contrasena por correo.
- `/dashboard`: workspace multitenant con menu por rol.
- `/reviews/new`: calificacion de vendedor VIP por cumplimiento, calidad y atencion.
- `/ordenes/[orderId]/comprobante`: carga de comprobante por orden, conservada por compatibilidad operativa.
- `/vendedores/solicitud`: onboarding vendedor VIP.
- `/vendedores-verificados`: perfiles VIP y tiendas activas.
- `/vendedores/[slug]`: perfil publico del vendedor VIP o tienda oficial.
- `/support`: tickets y reclamaciones por orden.
- `/how-it-works`, `/garantias-y-entregas`, `/verified-sellers`, `/preguntas-frecuentes`, `/terms`: paginas publicas de confianza.
- `/dashboard/vip`: panel vendedor VIP.
- `/dashboard/admin`: panel administrador.
- `/dashboard/economic`: panel economico.
- `/dashboard/don-miguel`: reportes ejecutivos.
- `/auth/login`: entrada base para Supabase Auth.
- `/signup`, `/registro`, `/crear-cuenta`, `/ia` y `/asistente`: redirecciones de compatibilidad.

## Puntos pendientes para produccion

- Configurar Supabase real, buckets privados y politicas Storage para evidencias/KYC.
- Conectar app externa de KYC cliente y revisar casos de riesgo antes de beta publica.
- Integrar pasarela de pago MSM y generacion final de factura PDF.
- Conectar billetera, cambio y Cajeros MSM Digital a Supabase con RLS, ledger y auditoria real.
- Implementar WhatsApp provider real cuando se seleccione proveedor.
- Convertir el flujo actual de compra por orden en carrito persistente multiproducto si la operacion lo requiere.
- Automatizar notificaciones por evento y reasignacion SLA.
- Convertir reserva de stock actual en reserva temporal con expiracion si el comprador no paga.
- Ejecutar revision legal local antes de publicar terminos finales.

Ver tambien:

- `docs/vip-profile.md`
- `docs/admin-store-management.md`
- `docs/products-by-zone.md`
- `docs/remittance-by-zone.md`
- `docs/functional-audit.md`
- `docs/global-market-expansion.md`
- `docs/customer-kyc-antifraud.md`
- `docs/delivery-risk-control.md`
- `docs/performance-cuba.md`
- `docs/future-ai.md`
- `docs/atm-vision.md`
- `docs/atm-digital-flow.md`
- `docs/atm-database.md`
- `docs/remittance-atm-integration.md`
- `docs/pwa.md`
- `docs/design-system.md`
- `docs/brand-guidelines.md`
- `docs/vercel-deploy.md`
- `docs/supabase-live-sync.md`
- `docs/github-sync.md`
- `docs/zones.md`
- `docs/remittance-flow.md`
