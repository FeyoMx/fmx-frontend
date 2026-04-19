# Frontend Product Readiness

Updated on 2026-04-19.

## Summary

The frontend is product-usable for the tenant-safe SaaS workflows that the current backend truly supports:

- login and tenant session handling
- dashboard and instance list
- instance detail, QR, pairing, and status
- advanced settings
- webhook, websocket, rabbitmq, and proxy
- CRM contacts
- broadcast jobs
- tenant AI settings
- text outbound messaging with backend-truth async delivery polling
- active chat conversation routes with real list/detail history plus media/audio/text composer wiring

It is not yet a full replacement for the upstream Evolution Manager v2 experience because several legacy chat and integration surfaces still rely on backend `501 partial` routes or have no tenant-safe SaaS implementation yet.

## What Is Ready Now

### Core tenant-safe flow

- JWT auth, refresh, and tenant hydration
- tenant-aware routing and instance scoping
- shared backend error parsing for `401`, `403`, `404`, `429`, `501`, and generic validation/server failures
- centralized instance bridge-unavailable interpretation for reconnect, pair, logout, runtime state/history, and history backfill

### Main product surfaces

- `/manager`
  - upgraded operator dashboard hero with clearer healthy / needs-attention / disconnected summaries
  - instance list now prioritizes items needing attention and uses stronger empty/filter states
  - status overview chart stays tied to real instance statuses
  - aggregate counters remain explicitly labeled as backend-limited or snapshot-only
  - clearer operator messaging about what is trustworthy now versus still sparse
- `/manager/contacts`
  - consistent header, support caveat, and cleaner empty/filter states
- `/manager/broadcast`
  - queue summary cards for queued, processing, completed, and failed jobs
  - clearer status badges, schedule copy, retry visibility, and queue-history readability
  - inline validation feedback plus explicit runtime-dependency messaging
  - recipient analytics UI contract prepared so totals, sent, failed, pending, and progress can surface as soon as the backend returns them
  - honest placeholder copy when analytics are not yet reported
- `/manager/ai-settings`
  - clearer tenant-default versus per-instance operator guidance
  - now safe to lazy-load without changing route behavior or auth handling
- `/manager/api-keys`
  - informational by design
  - explicitly marked as an informational-only surface

### Instance operations

- `/manager/instance/:instanceId/dashboard`
  - polished lifecycle/status hero with clearer timestamps and operator guidance
  - now lazy-loaded so the heaviest runtime/QR/action surface no longer ships in the initial bundle
  - status and QR handling
  - pairing code flow
  - refresh / reconnect / logout controls aligned to the tenant-safe backend contract
  - runtime observability panel with current runtime state, last observed status, and recent lifecycle history
  - graceful operator warnings when the live runtime bridge is unavailable, without redirecting to login or framing the issue as auth/session loss
  - guarded history backfill recovery action for chat JIDs with stored anchors
  - clear accepted-versus-failed backfill feedback that treats requested count as request scope only
  - text-only outbound send flow
  - async status polling against `status_endpoint`
- `/manager/instance/:instanceId/settings`
- `/manager/instance/:instanceId/webhook`
- `/manager/instance/:instanceId/websocket`
- `/manager/instance/:instanceId/rabbitmq`
- `/manager/instance/:instanceId/proxy`
- `/manager/instance/:instanceId/chat`
  - real tenant-safe chat list
  - real conversation detail route on `/manager/instance/:instanceId/chat/:remoteJid`
  - normalized history loaded from `POST /instance/:id/messages/search`
  - grouped conversation timeline with clearer timestamps, delivery indicators, and scroll-to-latest behavior
  - faster-feeling thread filtering via deferred search updates
  - stronger unread/preview emphasis when the backend exposes them
  - text, media, and audio composers already pointed at SaaS routes, with clearer send feedback
  - honest empty/error states when persisted history is missing or partial
  - incremental thread rendering keeps larger chat lists responsive without pretending full virtualization is necessary yet

## What Is Only Partial

### Dashboard analytics

- instance totals and status distribution are reliable
- message, contact, and broadcast aggregate counters are still backend placeholders or backend-limited summaries

### CRM

- contacts, tags, and notes work
- no delete flow
- no pipeline/workflow management
- large filtered datasets now render incrementally so the contact table stays lighter on larger tenants

### Text messaging

- works from the instance dashboard
- reflects true async delivery state now
- still does not provide the upstream inbox/thread experience

### Chat conversations

- thread list is backed by the current tenant-safe backend route
- conversation history is active and rendered from the tenant-safe backend route
- outbound text, media, and audio actions refresh or append safely inside the active thread
- composer exposes clearer in-flight feedback plus attachment chips for media/audio sends
- remaining limits are backend-driven:
- history backfill is now operator-exposed as a guarded recovery action, but it is still bridge-dependent and not a guaranteed replay
- bridge-unavailable failures are now handled gracefully whether the backend reports them as the current `500 internal_error` or a future `409 conflict`
- inbound history completeness depends on runtime event capture
- media history may be partial when preview/download metadata is missing

### MVP polish pass

- supported operator pages now use more consistent labels, spacing, empty-state language, and status framing
- runtime, history, and chat surfaces now read as one coherent operator workflow instead of separate feature islands
- unsupported legacy surfaces remain de-emphasized and out of primary navigation
- operators now enter chat only through the tenant-safe instance chat flow; the old embed chat/messages path is no longer part of normal navigation
- instance lifecycle wording now matches backend semantics directly: reconnect, pair, logout, and history backfill
- dashboard, broadcast, chat, and instance detail pages now distinguish reliable operational status from sparse analytics more clearly
- heavy operator routes now lazy-load safely under the existing auth guards and layouts
- contact, chat, and broadcast list rendering now favors incremental display over full eager rendering for large tenant datasets

## What Is Intentionally Gated

These routes now show a guarded unsupported placeholder instead of silently redirecting:

- SQS
- Chatwoot
- OpenAI resource CRUD
- Typebot
- Dify
- N8N
- EvoAI
- Evolution Bot
- Flowise
- embed chat

Legacy embed chat routes are intentionally gated too:

- `/manager/embed-chat`
- `/manager/embed-chat/:remoteJid`

Chat inbox routes are no longer hard placeholders. They now resolve to a real conversation experience that stays honest about history completeness limits.

This keeps old bookmarks and upstream page surface references from breaking while still being honest about backend reality.

## Backend-Driven Blockers

- tenant-safe support for Chatwoot, SQS, and legacy AI/integration CRUD suites
- richer aggregate metrics for messages, contacts, and broadcasts
- rich per-recipient broadcast analytics data
- Kafka support

## Readiness Assessment

- Suitable now for:
  - internal tenant operations
  - operational instance management
  - quick triage of healthy, degraded, and disconnected instance posture from the main dashboard
  - connection troubleshooting
  - runtime state and lifecycle event inspection from the instance dashboard
  - honest bridge-unavailable handling for lifecycle actions and bounded chat-history recovery requests
  - connector configuration for webhook/websocket/rabbitmq/proxy
  - CRM-lite usage
  - text/media/audio outbound dispatch from supported instance surfaces
  - tenant-safe chat list/detail conversation handling on supported instance chat routes
  - demoable MVP walkthroughs across the currently supported operator surfaces
  - lighter first-load behavior for the heaviest operator surfaces through route-level lazy loading
- Not yet suitable for:
  - full upstream-manager parity
  - chat parity for older sessions that were never captured by the runtime
  - guaranteed bridge recovery after a failed reconnect, pair, logout, or history backfill request
  - legacy integration management parity
  - full analytics-grade broadcast recipient reporting until the backend exposes it
