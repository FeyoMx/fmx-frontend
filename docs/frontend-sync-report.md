# Frontend Sync Report

## Scope
- Frontend repository audited against the local sibling backend repository at `../fmxevolution-go`
- Backend code was treated as source of truth, with `internal/server/server.go` used to confirm route registration
- Backend docs were used only when they matched code or helped explain deprecated legacy routes

## Backend Endpoints Discovered

### Public
- `GET /healthz`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /tenant`

### Protected SaaS Routes
- `GET /auth/me`
- `POST /auth/logout`
- `GET /dashboard/metrics`
- `GET /tenant`
- `PATCH /tenant`
- `GET /ai/settings`
- `PUT /ai/settings`
- `GET /ai/instances/:instanceID`
- `PUT /ai/instances/:instanceID`
- `GET /instance/:id/websocket`
- `PUT /instance/:id/websocket`
- `GET /instance/:id/rabbitmq`
- `PUT /instance/:id/rabbitmq`
- `GET /instance/:id/proxy`
- `PUT /instance/:id/proxy`
- `GET /instance`
- `POST /instance`
- `GET /instance/:id`
- `PATCH /instance/:id`
- `DELETE /instance/:id`
- `GET /instance/id/:instanceID`
- `GET /instance/:id/settings`
- `PUT /instance/:id/settings`
- `GET /instance/:id/advanced-settings`
- `PUT /instance/:id/advanced-settings`
- `GET /instance/id/:instanceID/advanced-settings`
- `PUT /instance/id/:instanceID/advanced-settings`
- `POST /instance/:id/connect`
- `POST /instance/id/:instanceID/connect`
- `POST /instance/:id/disconnect`
- `POST /instance/id/:instanceID/disconnect`
- `GET /instance/:id/status`
- `GET /instance/id/:instanceID/status`
- `GET /instance/:id/qr`
- `GET /instance/:id/qrcode`
- `GET /instance/id/:instanceID/qr`
- `GET /instance/id/:instanceID/qrcode`
- `GET /contacts`
- `POST /contacts`
- `GET /contacts/:id`
- `PATCH /contacts/:id`
- `POST /contacts/:id/notes`
- `POST /contacts/:id/tags`
- `GET /broadcast`
- `POST /broadcast`
- `GET /broadcast/:id`
- `PATCH /broadcast/:id`
- `GET /webhook`
- `POST /webhook`
- `GET /webhook/:id`
- `PATCH /webhook/:id`
- `DELETE /webhook/:id`
- `POST /webhook/inbound`
- `POST /webhook/outbound`

## Frontend Endpoints Updated
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /tenant`
- `GET /dashboard/metrics`
- `GET /instance`
- `GET /instance/:id`
- `POST /instance`
- `GET /contacts`
- `POST /contacts`
- `GET /broadcast`
- `POST /broadcast`
- `GET /ai/settings`
- `PUT /ai/settings`
- `GET /ai/instances/:instanceID`
- `PUT /ai/instances/:instanceID`

## Mismatches Fixed

### Auth and Session
- Frontend API base URL now prefers `VITE_API_URL` and falls back to `VITE_API_BASE_URL`
- JWT bearer auth is attached through `apiGlobal`
- Refresh-token retry flow is centralized in the global axios client
- Logout now clears both current and legacy token storage keys
- Auth role types now include backend role `agent`
- Tenant context now hydrates from `/auth/me` and `/tenant`

### Response Shape Compatibility
- Instance list and instance detail calls are normalized into the existing UI `Instance` shape
- Dashboard metrics now map backend metric fields instead of assuming older SaaS counters
- CRM contacts are normalized from backend contact and tag shapes into UI-friendly rows
- Broadcast jobs are normalized from backend job fields into UI table rows
- AI settings now map the flat backend tenant settings payload and per-instance settings payload
- Instance stats now use explicit nullable `stats` fields instead of synthetic `_count` fallbacks

### Page-Level Sync
- Dashboard create-instance flow now sends backend-native aliases `name` and `engine_instance_id`
- CRM page now uses real `/contacts` endpoints and avoids unsupported delete behavior
- Broadcast page now uses real `/broadcast` endpoints and backend-compatible payload fields
- AI Settings page now uses `/ai/settings` and `/ai/instances/:instanceID`
- API Keys page no longer calls nonexistent `/apikey` endpoints and is now informational
- Login page surfaces backend error messages instead of generic failures
- Instance `websocket`, `rabbitmq`, and `proxy` pages now use the new tenant-scoped `/instance/:id/...` routes
- Enabled instance integration pages now treat backend `501 Not Implemented` responses as a shared "This feature is not available in the current backend yet" UI state instead of falling through to generic crash or auth handling

### Dead or Stale Integration Cleanup
- Removed unused `apiLegacy` axios client
- Removed unused legacy `verifyCreds` helper
- Removed unused stale `src/types/saas.types.ts`

## Remaining Mismatches Not Fixed

### Unsupported Instance And Integration Pages
These frontend areas are still unavailable because the backend either lacks the required tenant-safe route set or intentionally returns `501 partial` for the current instance-scoped replacement:
- Instance chat
- SQS
- Chatwoot
- OpenAI
- Typebot
- Dify
- N8N
- EvoAI
- Evolution Bot
- Flowise
- Embed chat
- Detailed backend work needed for these pages is documented in `docs/backend-gap-report-for-instance-ui.md`

### Gated Routes
These routes are now protected from broken navigation:
- Removed from instance sidebar/navigation:
  - `/manager/instance/:instanceId/sqs`
  - `/manager/instance/:instanceId/evoai`
  - `/manager/instance/:instanceId/n8n`
  - `/manager/instance/:instanceId/evolutionBot`
  - `/manager/instance/:instanceId/chatwoot`
  - `/manager/instance/:instanceId/typebot`
  - `/manager/instance/:instanceId/openai`
  - `/manager/instance/:instanceId/dify`
  - `/manager/instance/:instanceId/flowise`
- Redirected to the current instance dashboard so normal UI flows cannot remain on unsupported legacy screens:
  - `/manager/instance/:instanceId/chat`
  - `/manager/instance/:instanceId/chat/:remoteJid`
  - `/manager/instance/:instanceId/sqs`
  - `/manager/instance/:instanceId/chatwoot`
  - `/manager/instance/:instanceId/openai`
  - `/manager/instance/:instanceId/openai/:botId`
  - `/manager/instance/:instanceId/typebot`
  - `/manager/instance/:instanceId/typebot/:typebotId`
  - `/manager/instance/:instanceId/dify`
  - `/manager/instance/:instanceId/dify/:difyId`
  - `/manager/instance/:instanceId/n8n`
  - `/manager/instance/:instanceId/n8n/:n8nId`
  - `/manager/instance/:instanceId/evoai`
  - `/manager/instance/:instanceId/evoai/:evoaiId`
  - `/manager/instance/:instanceId/evolutionBot`
  - `/manager/instance/:instanceId/evolutionBot/:evolutionBotId`
  - `/manager/instance/:instanceId/flowise`
  - `/manager/instance/:instanceId/flowise/:flowiseId`
- Redirected to a safe page instead of rendering legacy UI:
  - `/manager/embed-chat`
  - `/manager/embed-chat/:remoteJid`

### API Contract Gaps
- Backend accepts tenant API keys for authentication, but does not expose `/apikey` CRUD routes
- Backend CRM contract does not expose contact deletion
- Backend CRM contract does not expose pipeline-stage management
- Backend broadcast contract does not expose legacy UI metrics like `successCount` and `failureCount`
- Backend dashboard metrics are leaner than the older UI assumptions
- Backend instance list/detail payloads do not expose contact, chat, or message counts, so the dashboards now show `N/A` instead of synthetic zero values
- Backend instance detail may omit runtime token data when no runtime snapshot is available, so token display is now treated as optional in the UI
- Backend chat search, media send, audio send, and SQS still return structured `501` partial responses and must remain unavailable in the UI
- Backend `chatwoot`, `openai`, `typebot`, `dify`, `n8n`, `evoai`, `evolutionBot`, and `flowise` routes are registered but intentionally return `501` partial responses

## Pages Fully Synced
- `/manager/login`
- `/manager`
- `/manager/contacts`
- `/manager/broadcast`
- `/manager/ai-settings`
- `/manager/api-keys`
- `/manager/instance/:instanceId/proxy`
- `/manager/instance/:instanceId/websocket`
- `/manager/instance/:instanceId/rabbitmq`
- `/manager/instance/:instanceId/webhook`
- `/manager/instance/:instanceId/settings`

## Pages Partially Synced
- `/manager/instance/:instanceId/dashboard`
  - Instance payload is normalized to the current backend contract, but the backend still does not provide per-instance contact/chat/message counts
- `/manager/instance/:instanceId/*`
  - Unsupported legacy integration pages no longer appear in sidebar navigation and now redirect back to the instance dashboard
  - `SQS` remains intentionally hidden because the backend route exists but returns `501 partial`

## Blockers and Assumptions
- The backend route registry in `../fmxevolution-go/internal/server/server.go` was treated as authoritative
- Backend docs identify many legacy `/service/*` routes as stale for the current `cmd/api`
- Unsupported instance integration routes were intentionally kept as guarded placeholders so existing deep links do not fail silently
- The production build could not be completed in this environment because Vite hit a local `spawn EPERM` while loading `vite.config.ts`

## Verification
- `npx tsc -b` passed after the sync changes
- Full `npm run build` remains blocked by the local Vite `spawn EPERM` issue rather than a TypeScript failure
