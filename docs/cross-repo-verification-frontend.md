# Cross-Repo Verification: Frontend-Led Audit

Updated on 2026-04-12.

## Scope

- Frontend repo audited from:
  - `README.md`
  - `CHANGELOG.md`
  - `docs/frontend-product-readiness.md`
  - `docs/frontend-sync-report.md`
  - `docs/frontend-backend-integration.md`
  - `src/routes/index.tsx`
- Backend repo source of truth:
  - sibling repo `../fmxevolution-go`
  - route registration in `internal/server/server.go`
  - supporting handlers and services under `internal/*`

This report prefers backend code over frontend docs whenever they disagree.

## Backend Capabilities Already Represented Correctly In The UI

- JWT tenant session flow is aligned.
  - Backend mounts `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `GET /tenant`.
  - Frontend login/session hydration and JWT refresh match this contract.

- Main dashboard is honest about its strongest current capability.
  - Backend `GET /dashboard/metrics` returns real instance totals and active/inactive counts.
  - Frontend dashboard uses those values and explicitly warns that message/contact/broadcast counters are sparse placeholders.

- Supported instance routes are represented correctly:
  - dashboard
  - advanced settings
  - webhook
  - websocket
  - rabbitmq
  - proxy
  - QR / pairing / status
  - runtime state
  - runtime history

- Tenant-safe chat shell is correctly aligned to mounted backend routes.
  - Backend mounts:
    - `POST /instance/:id/chats/search`
    - `POST /instance/:id/messages/search`
    - `POST /instance/:id/messages/media`
    - `POST /instance/:id/messages/audio`
    - `POST /instance/:id/messages/text`
  - Frontend surfaces chat list/detail plus text/media/audio send on `/manager/instance/:instanceId/chat` and `/manager/instance/:instanceId/chat/:remoteJid`.

- Broadcast jobs are represented honestly enough for MVP use.
  - Backend mounts:
    - `GET /broadcast`
    - `POST /broadcast`
    - `GET /broadcast/:id`
  - Frontend supports list/create and does not claim richer recipient analytics.

- AI settings page matches the backend’s actual SaaS AI surface.
  - Backend mounts:
    - `GET /ai/settings`
    - `PUT /ai/settings`
    - `GET /ai/instances/:instanceID`
    - `PUT /ai/instances/:instanceID`
  - Frontend uses tenant defaults plus per-instance toggles and keeps legacy bot CRUD gated.

- Gated integration pages are correctly kept out of the supported flow.
  - Backend still returns structured `501 partial` or unsupported-resource responses for:
    - SQS
    - Chatwoot
    - OpenAI resource CRUD
    - Typebot
    - Dify
    - N8N
    - EvoAI
    - Evolution Bot
    - Flowise
  - Frontend placeholders are truthful here.

## Backend Capabilities Not Yet Fully Surfaced In The UI

- History backfill is mounted in the backend but not surfaced in the frontend.
  - Backend mounts:
    - `POST /instance/:id/history/backfill`
    - `POST /instance/id/:instanceID/history/backfill`
  - Frontend has no operator action for requesting history backfill from the instance dashboard or chat view.
  - This is the clearest backend capability gap now that chat/history routes are already live.

- CRM backend capability exceeds current UI.
  - Backend mounts:
    - `GET /contacts/:id`
    - `PATCH /contacts/:id`
    - `POST /contacts/:id/notes`
    - `POST /contacts/:id/tags`
  - Frontend CRM page only lists and creates contacts.
  - Current UI copy says delete and pipeline-stage management are not exposed by the backend, but the stronger truth is:
    - delete is not present in backend routes
    - notes/tags/update are present in backend routes but not surfaced in the UI

- Broadcast detail is mounted but not surfaced.
  - Backend mounts `GET /broadcast/:id`.
  - Frontend only shows list/create, not detail inspection.

- Auth input flexibility exceeds the current login UI.
  - Backend login accepts aliases and tenant slug from body/query/header.
  - Frontend login hardcodes `tenant_slug: "fmx"` and does not let operators choose a tenant slug.
  - This is acceptable for a single-tenant deployment, but it does not fully surface the backend’s multi-tenant auth flexibility.

- Runtime-backed lifecycle support is richer than the current UI uses.
  - Backend exposes `connect`, `disconnect`, `reconnect`, `pair`, runtime status/history, and history backfill.
  - Frontend currently emphasizes restart/logout wording instead of the exact mounted lifecycle contract.

## UI Surfaces That Still Overpromise Relative To Backend Reality

- `README.md` overpromises relative to both current frontend routing and current backend truth.
  - It still advertises broad chatbot integrations and event integrations as if they are active product surfaces.
  - In reality, many of those routes are intentionally gated in the frontend because the backend still returns partial/unsupported responses.

- The instance dashboard lifecycle controls overpromise in code relative to the mounted backend contract.
  - Frontend query layer currently calls:
    - `POST /instance/id/:id/restart`
    - `POST /instance/id/:id/logout`
  - Backend mounts:
    - `POST /instance/id/:instanceID/reconnect`
    - `DELETE /instance/id/:instanceID/logout`
  - This is a real contract drift, not a docs-only issue.
  - The UI labels currently suggest a supported restart flow that is not mounted in `internal/server/server.go`.

- Some frontend docs still understate backend capability in chat/history.
  - The backend now mounts tenant-safe chat/history/media/audio routes and history backfill.
  - Any frontend wording that still implies those chat routes are backend-partial is stale.

## UI Surfaces That Should Stay Gated

- SQS
- Chatwoot
- OpenAI resource CRUD
- Typebot
- Dify
- N8N
- EvoAI
- Evolution Bot
- Flowise

These should remain gated because the backend handlers still intentionally return partial or unsupported-resource responses for the tenant-safe SaaS contract.

- Legacy embed chat should also stay gated.
  - The backend still exposes compatibility aliases for old `instanceName` chat/message flows:
    - `POST /chat/findChats/:instanceName`
    - `POST /chat/findMessages/:instanceName`
    - `POST /message/sendText/:instanceName`
    - `POST /message/sendMedia/:instanceName`
    - `POST /message/sendWhatsAppAudio/:instanceName`
  - Frontend was right to remove this from the primary operator flow.
  - Keeping it reachable only as a placeholder is the honest choice.

## Stale Docs Or Labels That Conflict With Backend Truth

- `README.md`
  - Still describes a much broader active product surface than the backend/frontend pair actually support today.
  - This is the most user-visible stale document.

- `docs/frontend-sync-report.md`
  - Still lists historical backfill as blocked by backend.
  - Backend now mounts history backfill endpoints.
  - The remaining truth is that backfill exists in the backend but is not surfaced in the frontend UI.

- `docs/frontend-backend-integration.md`
  - Better than before, but still frames missing older-session backfill entirely as a backend limitation.
  - Backend now exposes a backfill request capability; the frontend simply does not expose it yet.

- Instance dashboard labels
  - `Restart` is stale relative to the currently mounted backend routes.
  - `Disconnect` currently triggers logout semantics in the frontend query layer, while the backend distinguishes `disconnect`, `reconnect`, and `logout`.

- CRM page support copy
  - The page implies the backend only supports list/create.
  - Backend actually supports update, add note, and assign tags as well.

## Remaining Legacy Flows Still Reachable Or Present

- Legacy embed chat routes are still reachable as placeholders:
  - `/manager/embed-chat`
  - `/manager/embed-chat/:remoteJid`

- Legacy embed chat implementation still exists in the repo, although it is no longer the supported operator path:
  - `src/pages/instance/EmbedChat/*`
  - `src/pages/instance/EmbedChatMessage/*`
  - `src/contexts/EmbedInstanceContext.tsx`
  - `src/lib/queries/chat/findChats.ts`
  - `src/lib/queries/chat/findMessages.ts`
  - `src/lib/queries/chat/sendMessage.ts`

- Old chat UI modules also still exist in the repo outside the routed MVP shell:
  - `src/pages/instance/Chat/*`

These remaining files are not the main product mismatch by themselves, but they increase maintenance overhead and can confuse future work if left undocumented.

## Operator Confusion Risks Still Present

- Lifecycle buttons on the instance dashboard are the biggest current operator risk.
  - The UI presents `Restart` and `Disconnect`.
  - Backend truth is closer to:
    - reconnect
    - disconnect
    - logout
    - pair
  - The current frontend query layer is not aligned to the mounted backend methods for restart/logout.

- CRM under-represents what is available.
  - Operators may assume notes/tags/update are backend-missing when they are actually frontend-missing.

- README and high-level product language still sound closer to upstream parity than to the actual supported SaaS MVP.

## Top 3 UI Changes That Would Improve Alignment

1. Fix the instance lifecycle contract on the frontend.
   - Replace the current restart/logout API wiring with the mounted backend routes and truthful labels.
   - This is more urgent than additional polish because it affects live operator actions.

2. Add a controlled history-backfill action to the supported chat or instance dashboard flow.
   - Backend capability exists.
   - Frontend currently leaves operators without the one explicit remediation tool the backend provides for older chat history gaps.

3. Expand CRM to use the backend routes that already exist.
   - Surface at least:
     - update contact
     - add note
     - assign tags
   - This would materially improve alignment without depending on backend work.

## Overall Assessment

- The current frontend is broadly MVP-aligned with the backend on the supported SaaS surface:
  - auth
  - dashboard
  - instance operations
  - runtime observability
  - tenant-safe chat list/detail
  - outbound text/media/audio
  - contacts list/create
  - broadcast list/create
  - tenant AI settings

- It is not yet fully alignment-clean.
  - The biggest remaining mismatch is not gated integrations.
  - The biggest remaining mismatch is the instance dashboard lifecycle flow, where frontend API calls and labels no longer match the mounted backend contract.

- Product judgment:
  - Yes, the current product can still be considered MVP-aligned for the supported operator surface.
  - No, it is not yet contract-clean enough to call fully synchronized while the lifecycle drift and unsurfaced backfill capability remain unresolved.

## Recommended Next Coordinated Task

Coordinate a frontend/backend alignment pass for instance lifecycle and chat recovery:

1. frontend
   - replace stale restart/logout calls with mounted backend actions
   - relabel controls to match backend semantics
2. frontend
   - add a guarded history-backfill operator action using the mounted backend endpoint
3. docs
   - update README and frontend sync docs so they reflect backend truth rather than older parity assumptions
