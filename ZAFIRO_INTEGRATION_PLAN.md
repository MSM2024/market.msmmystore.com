# ZAFIRO INTEGRATION PLAN — Molécula Maestra

> Basado en: `ZAFIRO_MASTER_SUMMARY.md` + `ZAFIRO_OS_FUTURISTIC_VISION.md`
> Estrategia: Ejecutar FASE 0→5 sobre el código actual sin romper nada

---

## FASE 0: Protección y Preparación

```
├─ Commit initial snapshot (✅ done)
├─ Rama integration/msm-master-molecule (✅ branch exists)
├─ Build + lint baseline (0 errors, 150 warnings)
├─ No eliminar funcionalidades operativas
└─ No exponer secretos
```

## FASE 1: Correcciones Críticas (este sprint)

| # | Tarea | Archivos | Prioridad |
|---|-------|----------|-----------|
| 1.1 | Sanear XSS `dangerouslySetInnerHTML` | `profile-page/page.tsx`, `perfil/[username]/page.tsx` | 🔴 Crítica |
| 1.2 | Corregir `zafiro_eliana_analysis` persistencia | `eliana/analysis.ts` | 🔴 Crítica |
| 1.3 | Corregir bono de referido (100 PTS idempotente) | `referidos.ts`, `rewards.ts` | 🔴 Crítica |
| 1.4 | Hacer verify funcional | `auth/verify/page.tsx` | 🟡 Alta |
| 1.5 | Hacer memberships funcional | `memberships/page.tsx` | 🟡 Alta |
| 1.6 | Corregir 6 bugs de page.tsx | `page.tsx` | 🟡 Alta |
| 1.7 | Unificar sistemas de perfil | `settings/page.tsx`, `profile.ts` | 🟡 Alta |
| 1.8 | Corregir HTML entities rotas | `SponsorFloatingBar.tsx`, `SponsorDetailModal.tsx` | 🟢 Media |
| 1.9 | Corregir color picker proyectos | `profile-page/projects/page.tsx` | 🟢 Media |
| 1.10 | Eliminar imports sin uso | Múltiples archivos | 🟢 Media |

## FASE 2: Backend Real (siguiente sprint)

| # | Tarea | Prioridad |
|---|-------|-----------|
| 2.1 | Implementar Supabase Auth | 🔴 Crítica |
| 2.2 | Migrar modelo de datos a PostgreSQL | 🔴 Crítica |
| 2.3 | Crear middleware de protección server-side | 🔴 Crítica |
| 2.4 | Implementar RLS en todas las tablas | 🔴 Crítica |
| 2.5 | Proteger admin con roles verificados | 🔴 Crítica |
| 2.6 | Crear audit_logs para operaciones sensibles | 🟡 Alta |
| 2.7 | Rate limiting en endpoints críticos | 🟡 Alta |
| 2.8 | Migrar persistencia de localStorage a Supabase | 🔴 Crítica |

## FASE 3: Molécula Maestra (siguiente sprint)

| # | Tarea | Prioridad |
|---|-------|-----------|
| 3.1 | Crear modelo user_molecules SQL | 🔴 Crítica |
| 3.2 | Crear CRUD de moléculas por usuario | 🔴 Crítica |
| 3.3 | Migrar Don Miguel data a configurable | 🟡 Alta |
| 3.4 | Panel de conexiones con toggle visibilidad | 🟡 Alta |
| 3.5 | Privacidad: conexiones privadas fuera de vista pública | 🟡 Alta |
| 3.6 | Meta AI como molécula uso interno | 🟢 Media |
| 3.7 | Telegram como respaldo auxiliar | 🟢 Media |

## FASE 4-5: Refactor y Migración (futuro)

Implementación modular de page.tsx, hooks reutilizables, servicios tipados, migrador localStorage→Supabase.

---

## Ejecución Inmediata: FASE 1

Procedo a corregir los bugs en orden de prioridad.
