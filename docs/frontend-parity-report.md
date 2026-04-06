# Frontend Parity Report

Audited on 2026-04-05.

Sources of truth used for this audit:

- local frontend code in `src/*`
- sibling backend repo at `../fmxevolution-go`
- upstream Evolution Manager v2 page surface and legacy feature set

This report measures parity against the upstream manager experience, but only counts parity as real when the current SaaS backend supports the route contract in a tenant-safe way. Backend `501 partial` routes are treated as intentionally unsupported, not as parity.

## Executive Summary

- Core SaaS management is close to parity for tenant-safe operations:
  - dashboard
  - instance list/detail
  - QR/pairing/status
  - webhook
  - websocket
  - rabbitmq
  - proxy
  - advanced settings
  - CRM contacts
  - tenant AI settings
- Product-visible legacy surfaces remain unavailable because the backend still returns `501 partial` or does not expose tenant-safe equivalents:
  - message history/search
  - Chatwoot
  - SQS
  - OpenAI resource CRUD
  - Typebot
  - Dify
  - N8N
  - EvoAI
  - Evolution Bot
  - Flowise
- Frontend parity work this pass focused on:
  - a chat readiness shell backed by the real chat-list route
  - honest route-level placeholders instead of silent redirects
  - stronger dashboard operational visibility using real backend-supported status data
  - stricter shared error handling for `404` and `429`

## Surface Matrix

| Surface | Upstream v2 | Current backend | Current frontend | Status | Notes |
|---|---|---|---|---|---|
| Dashboard | rich instance cards, counts, charts | `GET /dashboard/metrics` plus `GET /instance` implemented | live dashboard, instance list, new status overview chart, honest metric caveats | partial | Instance counts are real; non-instance counters are still backend-limited placeholders. |
| Instance list/detail | full list and instance dashboard | tenant-safe CRUD + detail/status/qr/settings implemented | enabled | near parity | Main operational flows are usable; edit-in-place and deeper analytics are still leaner than upstream. |
| QR / pairing / status | supported | connect, disconnect, status, qr/qrcode implemented | enabled | parity | Current UI handles QR image/text and pairing code flows. |
| Chat inbox | full inbox and thread browsing | chat list works, message history still `501 partial` | readiness shell enabled on chat routes | partial | The new shell uses real chat list data but keeps thread history honest until backend parity lands. |
| Chat search / message history | supported upstream | `POST /instance/:id/chats/search` works, `POST /instance/:id/messages/search` is still `501 partial` | chat list active, history still gated inside shell | blocked by backend | Architecture is prepared so real conversation view can activate with minimal code changes once history becomes truthful. |
| Text messaging | text send from chat and instance surfaces | `POST /instance/:id/messages/text` and status polling endpoint implemented | enabled on instance dashboard and chat shell composer | partial | Functional for text-only sending with async delivery feedback. |
| Media / audio messaging | upstream supports both | media/audio SaaS routes implemented | enabled in chat shell composer | partial | Sending is real, but full parity still needs message history and conversation rendering. |
| Webhook | supported | implemented | enabled | parity | Tenant-safe CRUD is live. |
| Websocket | supported | implemented | enabled | parity | Current page works and preserves `501` handling. |
| RabbitMQ | supported | implemented | enabled | parity | Current page works and preserves `501` handling. |
| SQS | supported upstream | explicit `501 partial` | guarded placeholder route | blocked by backend | UI surface preserved honestly; integration not backend-ready. |
| Kafka | supported upstream | no SaaS route | missing | blocked by backend | No current backend implementation or page route. |
| Proxy | supported | implemented | enabled | parity | Backend currently limits protocol support to `socks5`. |
| Chatwoot | supported upstream | explicit `501 partial` | guarded placeholder route | blocked by backend | Legacy page exists in repo but is not safe to revive. |
| OpenAI integration CRUD | supported upstream | explicit `501 partial` | guarded placeholder routes | blocked by backend | Tenant AI settings are live, but per-instance legacy OpenAI bot CRUD is not. |
| Typebot | supported upstream | explicit `501 partial` | guarded placeholder routes | blocked by backend | Same pattern as OpenAI resource CRUD. |
| Dify | supported upstream | explicit `501 partial` | guarded placeholder routes | blocked by backend | Same pattern as OpenAI resource CRUD. |
| N8N | supported upstream | explicit `501 partial` | guarded placeholder routes | blocked by backend | Same pattern as OpenAI resource CRUD. |
| EvoAI | supported upstream | explicit `501 partial` | guarded placeholder routes | blocked by backend | Same pattern as OpenAI resource CRUD. |
| Evolution Bot | supported upstream | explicit `501 partial` | guarded placeholder routes | blocked by backend | Same pattern as OpenAI resource CRUD. |
| Flowise | supported upstream | explicit `501 partial` | guarded placeholder routes | blocked by backend | Same pattern as OpenAI resource CRUD. |
| Contacts / CRM | upstream CRM-lite | contacts list/create/update/notes/tags implemented | enabled | partial | CRUD-lite works; delete, pipelines, and richer workflow states are still missing. |
| Metrics / charts | upstream richer reporting | only dashboard counts + instance list status are real | improved operational charting | partial | Message/contact/broadcast aggregates remain backend-limited. |
| Advanced settings | supported | implemented | enabled | parity | Ignore groups/status, reject call, read messages, always online all work. |

## Pages / Features Already At Parity

- `/manager/login`
- `/manager`
  - for tenant-safe instance listing and dashboard entry
- `/manager/instance/:instanceId/dashboard`
  - for QR, pairing, status, restart/logout/connectivity controls
- `/manager/instance/:instanceId/settings`
- `/manager/instance/:instanceId/webhook`
- `/manager/instance/:instanceId/websocket`
- `/manager/instance/:instanceId/rabbitmq`
- `/manager/instance/:instanceId/proxy`

## Pages / Features Partially Matched

- Dashboard metrics and charts
  - operationally useful now
  - still leaner than upstream because backend aggregate counters are placeholders
- CRM contacts
  - notes and tags work
  - deletion and pipeline workflows are missing
- Instance dashboard text messaging
  - async polling now reflects backend truth
  - still not a full chat/inbox experience
- Chat readiness shell
  - tenant-safe chat list is now live on `/manager/instance/:instanceId/chat`
  - text, media, and audio composers already use SaaS routes
  - message history stays backend-blocked until `messages/search` becomes truthful
- API keys
  - intentionally informational only because backend supports API-key auth but not API-key CRUD routes

## Pages / Features Missing

- Kafka configuration page
- tenant-safe chat inbox
- tenant-safe message history browser
- tenant-safe media/audio send UI
- upstream-style integration CRUD editors backed by real SaaS storage/runtime
- embed chat experience

## Pages Currently Gated

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

These routes now resolve to a shared unsupported placeholder with backend-accurate copy instead of silently redirecting users back to the dashboard.

Chat routes are no longer full placeholders. They now resolve to a readiness shell that:

- uses the tenant-safe chat list route
- keeps message history honest while it is still backend-partial
- exposes text, media, and audio composers through the supported SaaS routes

## Pages Blocked By Backend

- Message history
- SQS
- Chatwoot
- Kafka
- OpenAI resource CRUD
- Typebot
- Dify
- N8N
- EvoAI
- Evolution Bot
- Flowise
- Rich aggregate analytics for messages, contacts, and broadcasts

## Pages Blocked Only By Frontend

No backend-complete surface is fully blocked today.

Remaining frontend-only gaps are UX depth rather than route availability:

- richer charts and trend views on top of real backend metrics
- more in-place operational actions on dashboard cards
- clearer role-aware empty states on partial management surfaces

## Recommended Order To Close Remaining Parity Gaps

1. Backend-first: tenant-safe chat repository and search APIs
   - unlock inbox, thread view, search, and message history
2. Backend-first: tenant-safe media/audio send routes
   - unlock the biggest visible messaging gap versus upstream
3. Backend-first: decide which integration suites will be truly supported in SaaS
   - Chatwoot, SQS, OpenAI CRUD, Typebot, Dify, N8N, EvoAI, Evolution Bot, Flowise
4. Frontend-next: once chat APIs exist, revive inbox and thread pages from gated placeholder state
5. Frontend-next: once media/audio APIs exist, extend the current text composer into upstream-like send flows
6. Frontend-next: keep improving dashboard operational reporting
   - status trends
   - last sync timestamps
   - per-instance health summaries

## Audit Notes

- Backend route registration in `../fmxevolution-go/internal/server/server.go` was treated as authoritative.
- Backend `501 partial` responses are considered honest unsupported states, not feature parity.
- Legacy page components that still depend on instance-token or legacy manager contracts remain intentionally unrouted or placeholder-backed until the SaaS backend catches up.
