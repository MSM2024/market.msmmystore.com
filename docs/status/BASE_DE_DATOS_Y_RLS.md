# BASE DE DATOS Y RLS

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Migraciones | 37 (00001-00036, 00038) |
| Tablas | ~81 |
| Tipos enum | ~40 |
| Políticas RLS | ~326 creadas (~150-170 activas) |
| Seeds inline | 8 migraciones con INSERT |

## Tablas por módulo

### Auth/Identity (10)
`profiles`, `audit_logs`, `referrals`, `rewards_log`, `user_roles`, `organizations`, `memberships`, `sso_tickets`, `app_sessions`, `login_events`

### Marketplace (23) — CONGELADO
`marketplace_categories`, `marketplace_providers`, `marketplace_stores`, `marketplace_store_members`, `marketplace_products`, `marketplace_product_variants`, `marketplace_product_images`, `marketplace_provider_products`, `marketplace_provider_prices`, `marketplace_provider_inventory`, `marketplace_carts`, `marketplace_cart_items`, `marketplace_orders`, `marketplace_order_items`, `marketplace_order_status_history`, `marketplace_payments`, `marketplace_refunds`, `marketplace_shipments`, `marketplace_tracking_events`, `marketplace_price_rules`, `marketplace_price_history`, `marketplace_coupons`, `marketplace_commissions`, `marketplace_reviews`, `marketplace_favorites`, `marketplace_disputes`, `marketplace_audit_logs`, `marketplace_config`

### Economy (7)
`frequency_origin_nodes`, `frequency_channels`, `guardian_actions`, `frequency_events`, `economia_operaciones`, `economia_caja`, `economia_inventario`

### Council/Consejo (21)
`council_user_roles`, `invisible_council_guides`, `invisible_council_sources`, `invisible_council_audio_files`, `invisible_council_transcripts`, `invisible_council_transcript_segments`, `invisible_council_teachings`, `invisible_council_sessions`, `invisible_council_session_guides`, `invisible_council_session_teachings`, `invisible_council_books`, `invisible_council_book_chapters`, `invisible_council_book_sections`, `invisible_council_goals`, `invisible_council_goal_updates`, `invisible_council_journal_entries`, `invisible_council_prayers`, `invisible_council_tags`, `invisible_council_content_tags`, `invisible_council_files`, `invisible_council_versions`, `invisible_council_permissions`, `invisible_council_ai_interactions`

### ELIANA (12)
`eliana_knowledge`, `eliana_channels`, `eliana_contacts`, `eliana_identities`, `eliana_conversations`, `eliana_messages`, `eliana_intakes`, `eliana_handoffs`, `eliana_actions`, `eliana_audit_logs`, `eliana_settings`, `eliana_feedback`

### User Settings (1)
`user_settings`

## RLS

- **Migración 00031**: 42 políticas para Council
- **Migración 00034**: 21 políticas para ELIANA
- **Migración 00035**: Refuerza ~55 políticas globales (drop & recreate)
- **Migración 00036**: ~20 políticas para unified identity

Patrón general:
- `SELECT` — usuario ve sus propios datos (por user_id o metadata)
- `INSERT` — usuario autenticado puede insertar (con auth.uid() propio)
- `UPDATE` — propietario o admin
- `DELETE` — propietario o OWNER_SUPERADMIN
- Admin/OWNER_SUPERADMIN tienen acceso global mediante funciones `is_admin_or_superadmin()` y `is_owner_superadmin()`
