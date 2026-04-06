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
  - a real chat conversation route backed by tenant-safe chat list and message history routes
  - honest route-level placeholders instead of silent redirects
  - stronger dashboard operational visibility using real backend-supported status data
  - stricter shared error handling for `404` and `429`

## Surface Matrix

| Surface | Upstream v2 | Current backend | Current frontend | Status | Notes |
|---|---|---|---|---|---|
| Dashboard | rich instance cards, counts, charts | `GET /dashboard/metrics` plus `GET /instance` implemented | live dashboard, instance list, new status overview chart, honest metric caveats | partial | Instance counts are real; non-instance counters are still backend-limited placeholders. |
| Instance list/detail | full list and instance dashboard | tenant-safe CRUD + detail/status/qr/settings implemented | enabled | near parity | Main operational flows are usable; edit-in-place and deeper analytics are still leaner than upstream. |
| QR / pairing / status | supported | connect, disconnect, status, qr/qrcode implemented | enabled | parity | Current UI handles QR image/text and pairing code flows. |
| Chat inbox | full inbox and thread browsing | `POST /instance/:id/chats/search` and `POST /instance/:id/messages/search` implemented | active list/detail conversation flow on chat routes | partial | Real thread browsing is live, but older sessions are not historically backfilled and inbound completeness depends on runtime capture. |
| Chat search / message history | supported upstream | `POST /instance/:id/chats/search` and `POST /instance/:id/messages/search` implemented | chat list and normalized history are active | partial | Thread rendering now includes grouping, timestamps, status, and media/audio handling, but partial backend payloads still limit historical completeness and some media metadata. |
| Text messaging | text send from chat and instance surfaces | `POST /instance/:id/messages/text` and status polling endpoint implemented | enabled on instance dashboard and active chat composer | partial | Functional with async delivery feedback and safe local refresh/append inside the active conversation. |
| Media / audio messaging | upstream supports both | media/audio SaaS routes implemented | enabled in the active chat composer | partial | Sending is real and thread rendering shows available metadata, but historical media previews depend on backend-provided URLs/fields. |
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
- Chat conversation route
  - tenant-safe chat list is live on `/manager/instance/:instanceId/chat`
  - `/manager/instance/:instanceId/chat/:remoteJid` now loads normalized message history from `POST /instance/:id/messages/search`
  - text, media, and audio composers refresh the active thread safely after send
  - chat list now surfaces preview and unread hints when the backend provides them
  - older sessions are not backfilled and inbound/media completeness still depends on captured runtime metadata
- API keys
  - intentionally informational only because backend supports API-key auth but not API-key CRUD routes

## Pages / Features Missing

- Kafka configuration page
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

Chat routes are no longer placeholders. They now resolve to a real conversation experience that:

- uses the tenant-safe chat list route
- uses the tenant-safe message history route as the thread source of truth
- exposes text, media, and audio composers through the supported SaaS routes
- stays honest about remaining gaps:
- no historical backfill for older sessions
- inbound history completeness depends on runtime event capture
- media history can still be partial when the backend omits preview/download metadata

## Pages Blocked By Backend

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

1. Backend-first: improve chat history persistence and backfill strategy
   - older sessions still do not retroactively appear
2. Backend-first: enrich inbound/media event capture and preview metadata
   - unlock more complete thread parity and media rendering
3. Backend-first: decide which integration suites will be truly supported in SaaS
   - Chatwoot, SQS, OpenAI CRUD, Typebot, Dify, N8N, EvoAI, Evolution Bot, Flowise
4. Frontend-next: keep improving dashboard operational reporting
   - status trends
   - last sync timestamps
   - per-instance health summaries

## Audit Notes

- Backend route registration in `../fmxevolution-go/internal/server/server.go` was treated as authoritative.
- Backend `501 partial` responses are considered honest unsupported states, not feature parity.
- Legacy page components that still depend on instance-token or legacy manager contracts remain intentionally unrouted or placeholder-backed until the SaaS backend catches up.
