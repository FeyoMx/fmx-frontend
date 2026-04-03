# Frontend Product Readiness

## Summary

The current frontend is usable for the core tenant-safe SaaS flow: authentication, tenant-scoped dashboard access, contacts, broadcasts, AI settings, and the supported instance configuration pages. The product is not yet ready as a full replacement for the older manager UI because several legacy instance/integration areas are still gated or only partially backed by the current backend.

## Working Features

### Core SaaS access
- Login with JWT session handling
- Token refresh and session rehydration
- Tenant-aware authenticated routing
- Tenant context hydration from `/auth/me` and `/tenant`

### Main management pages
- Dashboard
- Contacts
- Broadcast creation and listing
- AI settings
- API keys informational page

### Instance management
- Instance list and instance detail loading
- Instance connect and disconnect flows
- QR code and pairing-code display
- Advanced settings and instance settings pages
- Instance dashboard with:
  - connection state
  - token display when available
  - text-only message composer for connected instances

### Instance integration pages currently supported
- Webhook
- Websocket
- Rabbitmq
- Proxy

## Partially Supported Features

### Instance dashboard
- The dashboard works for operational controls and text messaging
- Per-instance stats such as contacts, chats, and messages may show `N/A` because the backend does not provide full counters yet

### Webhook and runtime-derived instance detail
- Token and runtime-derived values can be missing when no runtime snapshot is available
- The UI already tolerates this, but users may see incomplete operational metadata

### Unsupported-feature handling
- The frontend correctly distinguishes `501 Not Implemented` from auth failures
- Supported pages that encounter backend `501` fall back to the shared unsupported-feature experience instead of crashing

## Gated Features

These areas are intentionally hidden from navigation or redirected away from legacy pages because the backend does not support them safely in the current SaaS contract:

- Instance chat
- Embed chat
- SQS
- Chatwoot
- OpenAI bot CRUD pages
- Typebot
- Dify
- N8N
- EvoAI
- Evolution Bot
- Flowise

Current gating behavior:
- Unsupported items are removed from normal instance sidebar navigation
- Existing deep links to unsupported instance pages redirect back to the instance dashboard or a safe manager page
- Media/audio/chat-search flows remain unavailable even though plain text sending is now supported

## User-Visible Limitations

- The messaging experience is text-only
- There is no supported in-product chat inbox, chat search, or message history view
- Media messages and WhatsApp audio are not available in the current SaaS UI
- Several legacy integration pages from the older manager experience are absent by design
- Broadcast metrics and dashboard metrics are leaner than older UI expectations
- Contact deletion and pipeline-stage style CRM workflows are not available in the current backend contract
- Full production build verification remains environment-sensitive because Vite has previously hit a local `spawn EPERM` issue in this workspace, even when TypeScript passes

## Next Recommended Frontend Priorities

### High priority
- Add a small sent-message confirmation/history panel for the instance dashboard text composer
- Improve validation and formatting guidance for recipient numbers in the text composer
- Add clearer empty states around missing runtime-derived instance fields such as token and owner metadata

### Medium priority
- Improve dashboard messaging around unavailable counters so users understand `N/A` is backend-limited, not broken
- Add better UI affordances around supported integrations:
  - last saved state
  - clearer save feedback
  - more explicit unsupported-event messaging where relevant
- Audit any remaining dead code from legacy chat/integration pages and reduce maintenance surface

### Backend-dependent priorities
- Re-enable instance chat only after tenant-safe backend support exists for:
  - chat search
  - message history retrieval
  - text/media/audio parity
- Reintroduce legacy integration pages only after their SaaS contracts move beyond `501 partial`
- Expand CRM and dashboard UI once backend counters and delete/workflow operations are formally supported

## Readiness Assessment

- Suitable now for:
  - internal tenant operations
  - instance connection management
  - webhook/websocket/rabbitmq/proxy configuration
  - basic outbound text sending from an instance
- Not yet suitable as a complete feature-parity replacement for the old manager UI
