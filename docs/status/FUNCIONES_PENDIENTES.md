# FUNCIONES PENDIENTES

Por orden de prioridad según el plan de terminación:

## Prioridad CRÍTICA (bloquean el funcionamiento)

1. **Migrar auth a Supabase-only** — Eliminar localStorage fallback en `auth.ts` y `profile.ts`
2. **Configurar service_role key** — Necesaria para seeds y RLS desde servidor
3. **Configurar Stripe price IDs reales** — Para checkout funcional
4. **Configurar Stripe webhook secret** — Para activación de membresías
5. **Resolver OWNER_SUPERADMIN de Don Miguel** — Cuenta real con LIFETIME_UNLIMITED

## Prioridad ALTA (funcionalidad principal)

6. **EntitlementService server-side** — Verificar membresías desde servidor, no solo UI
7. **Migrar Settings a Supabase** — Que `/settings` persista realmente
8. **Migrar Profile a Supabase** — Que `/profile-page` persista realmente
9. **Context handoff production-ready** — Usar `sso_tickets` tabla en lugar de Map en memoria
10. **Rate limiting server-side** — En todas las API routes

## Prioridad MEDIA (módulos planificados)

11. **Documentos y Firmas** — Sistema completo con SHA-256
12. **Double-Entry Ledger** — Convertir economía actual a ledger real
13. **Inventa** — Sistema de innovación
14. **Cultura** — Sistema de inteligencia cultural
15. **Solver Link** — Sistema de problemas/soluciones

## Prioridad BAJA (mejoras)

16. **ELIANA independiente funcional** — Migraciones, env reales, dominio, build
17. **MFA** — Autenticación multifactor
18. **Pruebas automatizadas** — Tests para módulos críticos
19. **Server Components** — Para datos sensibles
20. **Audit panel** — Interfaz para consultar logs de auditoría
21. **PWA icons** — Iconos para manifest
22. **Rotar Gemini API key** — La actual está expuesta en chat
