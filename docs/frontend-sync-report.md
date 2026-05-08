# Frontend Sync Report

Updated on 2026-05-08.

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
  - informational-only and hidden from normal sidebar navigation
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
- Dashboard now keeps the shell stable through empty, partial, metrics-only, and instance-list error states with skeleton cards, retryable warnings, disabled refresh while fetching, and last-known metric visibility.
- Unsupported legacy deep links now land on explanatory placeholder pages instead of redirecting away without context.
- Chat routes now use a real list/detail conversation flow backed by tenant-safe chat list and message history data.
- Chat history now preserves decoded selected JIDs through navigation and sends history search with `where.key.remoteJid` plus remote/chat JID aliases so stored `@s.whatsapp.net` and `@g.us` threads are not missed.
- Chat history adapters now accept both legacy message envelopes and sparse database-style aliases such as `message_id`, `remote_jid`, `chat_jid`, `body`, `created_at`, `direction`, and `message_type`.
- Chat history adapters now preserve visible message bodies from additional backend aliases (`text`, `body`, `message`, `content`, `caption`, `message_text`, and `text_message`) and keep media/audio records visible with explicit partial-history placeholders when no text is present.
- Chat composer now refreshes or appends text, media, and audio sends safely inside the active thread while exposing partial-history caveats honestly.
- Active chat UX now includes grouped messages, clearer timestamps and delivery indicators, scroll-to-latest behavior, stronger unread/preview emphasis, faster-feeling thread filtering, and clearer in-thread caveats when history is partial.
- Active chat message rendering now uses a flex-owned scroll pane with unclipped bubbles, preserved multiline whitespace, safe URL/JID wrapping, wrapped metadata, and a composer that no longer competes with the last messages for visibility.
- Active chat conversation panels now keep header, message timeline, and composer in one bounded flex card; only the message timeline scrolls, and the embedded composer footer remains visible without overlaying bubbles, timestamps, media placeholders, or optimistic messages.
- Instance route layout now provides a proper `min-h-0`/`flex-1` height chain for chat, so the chat shell can keep desktop conversations viewport-bound while allowing stacked mobile layouts enough height for visible, scrollable messages.
- Chat shell height is now explicitly bounded to `calc(100vh - 56px)`, matching the app header, so the conversation panel and its message scroller do not depend on fragile inherited `h-full` calculations.
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
- Broadcast now handles empty queues, large campaigns, partial analytics, recipient endpoint errors, and shrinking backend totals with skeleton table rows, retryable warnings, disabled duplicate actions, and pagination clamping.
- Contacts, chat, and broadcast now use incremental list rendering for larger datasets instead of eagerly painting every row/card at once.
- Contacts and AI settings now expose clearer refresh/loading/disabled states for the backend-supported actions.
- AI Settings now normalizes first-use `404 ai settings not found` responses into editable disabled defaults, with `IA aún no configurada` and status labels for `Sin configurar`, `Desactivada`, `Activa`, and `Error de configuración`.
- Contacts now preserves a stable table layout on cold load, exposes retryable fetch failures, prevents duplicate creates, disables dialog controls while submitting, and tolerates missing contact names/tags/phones more gracefully.
- Instance dashboard now has clearer timestamp framing, stronger lifecycle/operator guidance, and more readable runtime-history cards.
- Instance dashboard runtime history and bounded history recovery copy now wrap long backend details and explain disabled recovery states more plainly.
- Chat list/detail/composer polish tightened responsive sizing, failed-send status rendering, media/audio attachment chips, and send-in-progress feedback.
- Chat queries now keep previous thread/history data visible during slow refetches, chat-list errors are retryable, cold chat loads use skeleton cards, and failed text sends update the optimistic row instead of leaving stale queued duplicates.
- Dense-data hardening now protects supported MVP surfaces from narrow-width overflow caused by long contact fields, phone numbers, chat JIDs, broadcast errors, message IDs, media placeholders, pagination copy, and runtime/backfill detail strings.
- Shared loading behavior now avoids full-viewport nested spinners, reducing flicker and layout jumps in cards, dialogs, chat panes, runtime panels, and data tables.
- Supported MVP pages now share more consistent operator-facing labels, page framing, badge usage, and honest empty-state language.
- API Keys, AI Settings, CRM, and Broadcast pages now better distinguish active MVP functionality from informational or backend-gated behavior.
- Placeholder audit pass removed API Keys from the sidebar, rewrote guarded integration placeholders with short production copy, and replaced raw backend/501/legacy wording on normal operator paths with labels such as Disponible, En proceso, No disponible en esta versión, Requiere conexión activa, Historial parcial, and Última actualización.
- Dashboard, Instance Dashboard, Chat, Broadcast, Contacts, AI Settings, API Keys, UnsupportedInstanceFeature, Sidebar, and session/header-adjacent loading states were reviewed for user-visible placeholder or unsupported copy.
- Final visual consistency pass added shared operator surface primitives for stat tiles, empty states, action bars, and status badges, then applied them to dashboard, instance dashboard, chat, broadcast, contacts, AI settings, login, and supported connector/settings pages.
- Card radius/padding, responsive page-header actions, selected chat rows, message bubbles, runtime timeline rows, broadcast recipient rows, and connector form sections now follow a more consistent production MVP visual system without changing API behavior.

### API / adapter alignment

- Shared API error handling now includes clearer `404` and `429` messages.
- Header logout now clears tenant/user/token state and React Query cache immediately, calls `POST /auth/logout` as a best-effort protected acknowledgement, and never lets backend logout failure block local session cleanup.
- Text-message delivery state stays aligned with the async backend contract introduced on the instance dashboard flow.
- Chat list, message history, and chat send adapters are centralized under `src/lib/queries/chat`.
- Chat list responses can now surface backend cache/staleness metadata (`cached`, `stale`, `source`, `refreshed_at`) without breaking search or thread navigation.
- Chat history now attempts the ID-scoped search path first and falls back to the registered tenant-safe `POST /instance/:id/messages/search` route, sending remote JID, optional message ID, optional text query, optional limit, and optional cursor with compatibility aliases.
- Chat history normalization no longer drops or hides sparse messages just because optional text/media fields are missing; media type, mime type, captions, file names, and URLs are read from both nested message envelopes and top-level records.
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
- Instance, contact, broadcast job, and broadcast recipient adapters now provide defensive fallbacks for sparse or partially missing backend fields.
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
- deeper manual QA across real tenant dense-data scenarios and long chat/broadcast/contact lists
- wider manual QA coverage for degraded bridge timing, including delayed QR/code publication after a reconnect or pair request
- possible future virtualization if tenants grow from hundreds to many thousands of contacts, chat threads, or broadcast recipient rows
- deeper chart-specific optimization if `recharts` continues to dominate future builds
- tighter auditing of the new `vendor-misc` chunk if more cross-route dependencies accumulate there

## Verification

- `npm run type-check`
- `npm run build`
- Chat conversation rendering/layout was validated during the 2026-05-08 pass to ensure fetched non-empty histories render in the message pane instead of falling through to the empty state or being clipped by nested overflow.
- Chat conversation layout was revalidated during the 2026-05-08 overlap fix to ensure the composer stays outside the scroll region and the final message remains readable above it.
- Chat page scroll behavior was revalidated after restoring the route height chain so the message list is visible and scrollable instead of being clipped by parent containers.
- Browser data refresh was attempted with `npx update-browserslist-db@latest`, but the updater timed out after partially touching the lockfile. No package update was kept; the final build no longer emitted stale browser-data warnings in this workspace. If warnings recur, rerun the updater with reliable npm registry access.

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
