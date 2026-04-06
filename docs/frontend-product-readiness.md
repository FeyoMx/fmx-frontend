# Frontend Product Readiness

Updated on 2026-04-06.

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

### Main product surfaces

- `/manager`
  - operational dashboard cards
  - instance list
  - new status overview chart based on real instance statuses
  - explicit notice that aggregate counters are still backend-limited
- `/manager/contacts`
- `/manager/broadcast`
- `/manager/ai-settings`
- `/manager/api-keys`
  - informational by design

### Instance operations

- `/manager/instance/:instanceId/dashboard`
  - status and QR handling
  - pairing code flow
  - refresh / restart / disconnect controls
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
  - text, media, and audio composers already pointed at SaaS routes
  - honest empty/error states when persisted history is missing or partial

## What Is Only Partial

### Dashboard analytics

- instance totals and status distribution are reliable
- message, contact, and broadcast aggregate counters are still backend placeholders or backend-limited summaries

### CRM

- contacts, tags, and notes work
- no delete flow
- no pipeline/workflow management

### Text messaging

- works from the instance dashboard
- reflects true async delivery state now
- still does not provide the upstream inbox/thread experience

### Chat conversations

- thread list is backed by the current tenant-safe backend route
- conversation history is active and rendered from the tenant-safe backend route
- outbound text, media, and audio actions refresh or append safely inside the active thread
- remaining limits are backend-driven:
- no historical backfill for older sessions
- inbound history completeness depends on runtime event capture
- media history may be partial when preview/download metadata is missing

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

Chat inbox routes are no longer hard placeholders. They now resolve to a real conversation experience that stays honest about history completeness limits.

This keeps old bookmarks and upstream page surface references from breaking while still being honest about backend reality.

## Backend-Driven Blockers

- tenant-safe support for Chatwoot, SQS, and legacy AI/integration CRUD suites
- richer aggregate metrics for messages, contacts, and broadcasts
- Kafka support

## Readiness Assessment

- Suitable now for:
  - internal tenant operations
  - operational instance management
  - connection troubleshooting
  - connector configuration for webhook/websocket/rabbitmq/proxy
  - CRM-lite usage
  - text/media/audio outbound dispatch from supported instance surfaces
  - tenant-safe chat list/detail conversation handling on supported instance chat routes
- Not yet suitable for:
  - full upstream-manager parity
  - chat parity for older sessions that were never captured by the runtime
  - legacy integration management parity
