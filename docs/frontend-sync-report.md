# Frontend Sync Report

Updated on 2026-04-06.

## Scope

- Frontend repo audited against sibling backend repo `../fmxevolution-go`
- Backend route registration in `internal/server/server.go` treated as authoritative
- Upstream Evolution Manager v2 used as the reference page surface, but not as proof of backend support

## Backend-Complete Surfaces Enabled In Frontend

- auth and tenant session flow
- dashboard metrics and instance listing
- instance CRUD entry points used by dashboard
- instance detail, QR, pairing, connect/disconnect, and status
- advanced settings
- webhook
- websocket
- rabbitmq
- proxy
- CRM contacts
- broadcast jobs
- tenant AI settings
- text-only instance messaging with async status polling
- tenant-safe chat list and conversation history on supported instance chat routes
- tenant-safe media/audio send wiring inside the active conversation composer

## Backend-Partial Surfaces Kept Honest

The following routes exist in the backend but still return `501 partial` or otherwise remain unsupported in a tenant-safe SaaS contract:

- SQS
- Chatwoot
- OpenAI resource CRUD
- Typebot
- Dify
- N8N
- EvoAI
- Evolution Bot
- Flowise

Frontend handling after this sync:

- deep links no longer bounce silently to the dashboard
- guarded placeholders explain why the page is unavailable
- unsupported pages remain hidden from normal navigation

## Current Route Outcome By Area

### Fully active

- `/manager`
- `/manager/contacts`
- `/manager/broadcast`
- `/manager/ai-settings`
- `/manager/api-keys`
- `/manager/instance/:instanceId/dashboard`
- `/manager/instance/:instanceId/settings`
- `/manager/instance/:instanceId/webhook`
- `/manager/instance/:instanceId/websocket`
- `/manager/instance/:instanceId/rabbitmq`
- `/manager/instance/:instanceId/proxy`
- `/manager/instance/:instanceId/chat`
- `/manager/instance/:instanceId/chat/:remoteJid`
  - active as a real conversation route backed by message history search

### Guarded placeholders

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
- `/manager/embed-chat`
- `/manager/embed-chat/:remoteJid`

## Frontend Changes In This Sync

### Product-visible

- Dashboard now shows an operational status overview chart using real instance status data from the backend.
- Dashboard now explicitly warns when aggregate counters are backend-limited instead of implying those numbers are trustworthy.
- Unsupported legacy deep links now land on explanatory placeholder pages instead of redirecting away without context.
- Chat routes now use a real list/detail conversation flow backed by tenant-safe chat list and message history data.
- Chat composer now refreshes or appends text, media, and audio sends safely inside the active thread while exposing partial-history caveats honestly.
- Active chat UX now includes grouped messages, clearer timestamps and delivery indicators, scroll-to-latest behavior, and thread previews/unread hints when available from the backend.

### API / adapter alignment

- Shared API error handling now includes clearer `404` and `429` messages.
- Text-message delivery state stays aligned with the async backend contract introduced on the instance dashboard flow.
- Chat list, message history, and chat send adapters are centralized under `src/lib/queries/chat`.

## Remaining Gaps

### Blocked by backend

- historical backfill for older chat sessions
- full inbound history completeness when runtime events were not captured
- complete media preview/download metadata for all stored messages
- Kafka surface
- integration CRUD parity for Chatwoot, OpenAI, Typebot, Dify, N8N, EvoAI, Evolution Bot, and Flowise
- richer aggregate analytics

### Blocked only by frontend

No backend-complete route is hard-blocked today.

Remaining frontend-only work is mostly presentational:

- richer charts and trends
- more operational actions on dashboard cards
- polished empty states for sparse instance metrics

## Verification

- `npm run type-check`
