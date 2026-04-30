# Frontend Sync Report

Updated on 2026-04-30.

## Scope

- Frontend repo audited against sibling backend repo `../fmxevolution-go`
- Backend route registration in `internal/server/server.go` treated as authoritative
- Upstream Evolution Manager v2 used as the reference page surface, but not as proof of backend support

## Backend-Complete Surfaces Enabled In Frontend

- auth and tenant session flow
- dashboard metrics and instance listing
- instance CRUD entry points used by dashboard
- instance detail, QR, pairing, reconnect/logout, and status
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
- tenant-safe instance runtime state and runtime history observability on the dashboard
- tenant-safe history backfill recovery requests from the instance dashboard

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

- Dashboard now uses a stronger operator-health summary, instance prioritization, clearer sparse-data empty states, and more explicit confidence labels for backend-limited counters.
- Unsupported legacy deep links now land on explanatory placeholder pages instead of redirecting away without context.
- Chat routes now use a real list/detail conversation flow backed by tenant-safe chat list and message history data.
- Chat composer now refreshes or appends text, media, and audio sends safely inside the active thread while exposing partial-history caveats honestly.
- Active chat UX now includes grouped messages, clearer timestamps and delivery indicators, scroll-to-latest behavior, stronger unread/preview emphasis, faster-feeling thread filtering, and clearer in-thread caveats when history is partial.
- Heavy operator routes now lazy-load behind the same auth guards and layouts, including dashboard, broadcast, chat, instance dashboard, and AI settings.
- Sidebar navigation now exposes a single chat entrypoint for operators. The older legacy `Messages` embed path has been removed from normal navigation and gated behind an unsupported placeholder.
- Instance dashboard lifecycle controls now map directly to backend semantics: reconnect, pair, logout, and history backfill.
- Instance dashboard now refreshes status, QR, runtime state, and runtime history after reconnect, pairing, logout, and backfill actions so operators can see lifecycle truth in one place.
- Bridge-unavailable lifecycle and recovery failures are now normalized near the instance query layer so reconnect, pair, logout, runtime fetches, runtime history fetches, and history backfill tolerate both the current `500 internal_error` behavior and future `409 conflict` normalization.
- Runtime status and runtime history panels now keep their last successful data visible during failed refetches, while showing operator-facing warnings instead of implying auth or session loss.
- Reconnect, pairing, and history-backfill feedback now uses explicit bridge/runtime-unavailable wording, and backfill acceptance copy no longer implies the requested count equals imported rows.
- Broadcast now adds queue summary cards, clearer status/schedule/retry readability, inline validation feedback, and explicit reminders that delivery still depends on runtime/backend conditions.
- Broadcast adapters and UI now normalize optional recipient analytics fields so totals, sent, failed, pending, and progress can surface without another page rewrite once the backend returns them.
- Broadcast now uses the real backend detail flow on `GET /broadcast/:id` plus paginated recipient inspection on `GET /broadcast/:id/recipients`.
- Broadcast campaign inspection now exposes recipient totals, attempted, sent, failed, pending, and partial status when the backend returns them, along with filtered recipient rows, last error, attempt count, and attempt/result timestamps.
- Broadcast recipient inspection now uses clearer summary labels, partial-summary warning copy, row alignment, and pagination/filter context while still avoiding unsupported delivery/read states.
- Contacts, chat, and broadcast now use incremental list rendering for larger datasets instead of eagerly painting every row/card at once.
- Contacts and AI settings now expose clearer refresh/loading/disabled states for the backend-supported actions.
- Instance dashboard now has clearer timestamp framing, stronger lifecycle/operator guidance, and more readable runtime-history cards.
- Instance dashboard runtime history and bounded history recovery copy now wrap long backend details and explain disabled recovery states more plainly.
- Chat list/detail/composer polish tightened responsive sizing, failed-send status rendering, media/audio attachment chips, and send-in-progress feedback.
- Supported MVP pages now share more consistent operator-facing labels, page framing, badge usage, and honest empty-state language.
- API Keys, AI Settings, CRM, and Broadcast pages now better distinguish active MVP functionality from informational or backend-gated behavior.

### API / adapter alignment

- Shared API error handling now includes clearer `404` and `429` messages.
- Header logout now clears tenant/user/token state and React Query cache immediately, calls `POST /auth/logout` as a best-effort protected acknowledgement, and never lets backend logout failure block local session cleanup.
- Text-message delivery state stays aligned with the async backend contract introduced on the instance dashboard flow.
- Chat list, message history, and chat send adapters are centralized under `src/lib/queries/chat`.
- Chat list responses can now surface backend cache/staleness metadata (`cached`, `stale`, `source`, `refreshed_at`) without breaking search or thread navigation.
- Chat history now uses the registered tenant-safe `POST /instance/:id/messages/search` route directly and only sends backend-supported filters: remote JID, optional message ID, optional text query, optional limit, and optional cursor.
- Lifecycle/runtime/backfill bridge-unavailable interpretation is centralized under `src/lib/queries/instance/bridgeAvailability.ts`.
- Broadcast adapters now align with the backend DTOs for:
  - `recipient_total`
  - `recipient_attempted`
  - `recipient_sent`
  - `recipient_failed`
  - `recipient_pending`
  - `recipient_partial`
  - `recipient_analytics`
  - paginated `recipients` detail payloads
- Build output now uses focused manual vendor chunks so the largest production dependencies no longer collapse into one `~762 kB` shared JavaScript bundle

## Remaining Gaps

### Blocked by backend

- complete historical replay for older chat sessions that the bridge cannot return during backfill
- full inbound history completeness when runtime events were not captured
- complete media preview/download metadata for all stored messages
- Kafka surface
- integration CRUD parity for Chatwoot, OpenAI, Typebot, Dify, N8N, EvoAI, Evolution Bot, and Flowise
- richer aggregate analytics
- true broadcast delivery/read receipts beyond send-attempt outcome

### Blocked only by frontend

No backend-complete route is hard-blocked today.

Remaining frontend-only work is mostly presentational:

- richer charts and trends
- more operational actions on dashboard cards
- deeper QA across dense-data scenarios and long chat/broadcast/contact lists
- wider manual QA coverage for degraded bridge timing, including delayed QR/code publication after a reconnect or pair request
- deeper chart-specific optimization if `recharts` continues to dominate future builds
- tighter auditing of the new `vendor-misc` chunk if more cross-route dependencies accumulate there

## Verification

- `npm run type-check`
- `npm run build`

## Current Bundle Snapshot

- Previous issue addressed:
  - the old single `~762 kB` JavaScript chunk warning is gone after the vendor split
- Largest chunks in the current build:
  - `vendor-charts` at about `284.82 kB`
  - `vendor-misc` at about `259.22 kB`
  - `index` app chunk at about `188.12 kB`
  - `vendor-react` at about `157.08 kB`
  - `vendor-ui` at about `146.08 kB`
- Heaviest dependency families identified during this pass:
  - `recharts`
  - `lucide-react`
  - `react-dom`
  - `@radix-ui/*`
  - `axios`
  - `socket.io-client`
