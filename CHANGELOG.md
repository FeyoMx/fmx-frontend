# Changelog

All notable changes to Evolution Manager v2 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open source preparation with comprehensive documentation
- GitHub issue templates and PR templates
- Security policy and vulnerability reporting process
- Docker Compose setup for easy deployment
- Code quality tools (Prettier, ESLint configurations)
- FMX branding integration with new logo and branding
- Comprehensive developer documentation suite:
  - Frontend architecture documentation
  - Frontend pages inventory and status
  - Environment configuration guide
  - Backend integration patterns
  - Frontend-backend sync report
  - Development worklog
- Typed SaaS query adapters for tenant, dashboard, CRM, broadcast, AI settings, and instance normalization
- Centralized API error parsing helper for clearer auth and validation failures
- Consistent "not available yet" handling for backend `501 Not Implemented` responses on enabled instance integration pages
- Tenant-safe instance text-message composer on the instance dashboard using `POST /instance/:id/messages/text`
- Frontend product readiness summary in `docs/frontend-product-readiness.md`
- Frontend parity audit in `docs/frontend-parity-report.md`
- Guarded placeholder routes for unsupported upstream surfaces such as chat inbox, embed chat, SQS, Chatwoot, and legacy AI/integration suites
- Operational instance status charting on the main dashboard using tenant-safe backend instance data
- Chat readiness shell module with prepared conversation panel, message list, composer, capability status, and empty-state components
- Tenant-safe chat query adapters for chat list, future message history, and text/media/audio send flows
- Real tenant-safe chat conversation route on `/manager/instance/:instanceId/chat/:remoteJid` backed by `POST /instance/:id/messages/search`
- Product-ready chat UX polish for grouped messages, clearer thread selection, richer composer feedback, and safer active-thread optimistic updates
- Runtime observability panels on the instance dashboard using the new tenant-safe runtime state and history endpoints
- Shared operator page polish for the supported MVP surface, including more consistent headers, support caveats, badges, and feedback copy
- MVP release candidate documentation for supported scope, QA walkthrough, and known user-visible caveats
- Explicit gating for legacy embed chat/messages routes so operators enter chat through the tenant-safe instance chat flow only
- History backfill recovery control on the instance dashboard using the tenant-safe backend route
- Centralized bridge-unavailable adapter for lifecycle, runtime, and backfill queries
- Shared operator-formatting helpers for timestamps, relative timing, and status copy across the supported MVP pages
- Lazy route fallback component for heavy operator surfaces
- Incremental list rendering hook for large operator datasets
- Broadcast recipient analytics adapter/view model that stays dormant until backend analytics fields are returned
- Broadcast campaign detail workflow backed by real backend summary and paginated recipient endpoints
- Focused Vite vendor chunk splitting for shared frontend dependency groups

### Changed
- Updated package.json with proper metadata and repository information
- Improved project structure for open source development
- Migrated from API key to JWT-based authentication system
- Updated branding from Evolution Manager to FMX Evolution Manager
- Enhanced API client architecture with tenant support
- Updated environment variables for JWT authentication
- Fixed UI component issues (FormInput props, ResizablePanel sizes)
- Corrected navigation URL generation (removed double slashes)
- Updated README.md with new documentation links and FMX branding
- Frontend API base URL now prefers `VITE_API_URL` with `VITE_API_BASE_URL` as fallback
- Tenant session hydration now uses `/auth/me` and `/tenant` as the source of truth
- Dashboard, CRM, Broadcast, AI Settings, and API Keys pages now align with the current backend SaaS contract
- API Keys page was converted to informational mode because the backend currently supports API key auth but not API key management routes
- New instance creation now sends backend-native `name` and `engine_instance_id` aliases
- Frontend integration docs were rewritten against the current backend route registry
- Dashboard now distinguishes real operational metrics from backend-limited aggregate counters instead of implying full analytics parity
- Unsupported deep links now land on explanatory placeholders instead of silently redirecting away from the requested surface
- Instance chat routes now resolve to a real conversation view backed by tenant-safe chat list and message history routes
- Active chat list/detail flow now surfaces previews, unread hints when provided, smarter scrolling, and clearer history limitations
- Instance dashboard now surfaces runtime state, last observed bridge status, and recent lifecycle events for operator observability
- Supported MVP pages now present a more coherent operator flow, with unsupported legacy surfaces kept less prominent and informational-only pages labeled more clearly
- Sidebar navigation now uses a single chat entrypoint and no longer exposes the legacy embed chat/messages surface in the primary operator flow
- Legacy `/manager/embed-chat` routes now resolve to honest unsupported placeholders instead of mounting the old token/query-param chat UI
- Instance dashboard lifecycle controls now align with backend SaaS semantics by using reconnect, pair, and DELETE logout instead of stale restart/disconnect wording
- Instance dashboard now refreshes status, QR, runtime state, and runtime history after lifecycle and backfill actions
- Lifecycle and backfill operator feedback now stays honest when the live runtime bridge is unavailable, tolerating both current `500 internal_error` responses and future `409 conflict` normalization
- Main dashboard now surfaces clearer healthy / needs-attention / disconnected summaries, better sparse-data empty states, and stronger confidence cues for backend-limited metrics
- Broadcast now reads as an operational queue surface with clearer validation, job-state summaries, retry/schedule readability, and explicit runtime-dependency caveats
- Chat list/detail now feels faster and clearer for operators via deferred search input, stronger unread/preview emphasis, richer conversation framing, and better composer feedback
- Instance dashboard now has improved timestamp visibility, cleaner lifecycle/runtime hierarchy, and more readable runtime history cards
- Sidebar navigation now emphasizes supported operator surfaces first while keeping informational/reference links secondary
- Heavy operator routes such as chat, broadcast, instance dashboard, AI settings, and the main dashboard now lazy-load under the existing auth/layout flow
- Chat, contacts, and broadcast surfaces now use incremental rendering for larger datasets instead of eagerly painting every row at once
- Broadcast history/search is now structured to surface recipient totals, sent, failed, pending, and progress immediately when the backend starts returning those fields
- Broadcast inspection now surfaces real recipient analytics and paginated recipient rows with status filters, attempt counts, last errors, and attempt/result timestamps
- Broadcast UX now distinguishes queue/send-attempt outcome from absent delivery/read receipts instead of implying unsupported delivery analytics
- Production build now separates React/router, UI primitives, forms, data, i18n, realtime, charts, and remaining shared dependencies into dedicated vendor chunks instead of shipping a single ~762 kB shared JavaScript bundle

### Fixed
- FormInput component invalid onCheckedChange props
- ResizablePanel defaultSize values not summing to 100
- Navigation URL generation with double slashes
- QR code display issues with undefined data
- React Query error handling with undefined data crashes
- Instance list and detail parsing now tolerate the leaner backend SaaS instance payload
- Login, dashboard, CRM, broadcast, and AI settings flows now surface backend error messages more reliably
- AI instance settings now call `/ai/instances/:instanceID` instead of the stale singular route
- Instance text-message action now falls back to the standard unsupported-feature UI when the backend returns `501`
- Shared API error parsing now includes clearer `404` and `429` feedback
- Chat architecture no longer depends on legacy `instanceName` chat contracts for the future SaaS-ready shell
- Chat conversation rendering now tolerates partial message payloads while exposing timestamps, direction, status, and available media/audio metadata
- Instance status and broadcast badges now normalize more runtime and queue states consistently across the active MVP UI
- Lifecycle query wiring no longer calls the stale restart route or POST logout contract
- Instance dashboard and chat-recovery flows no longer imply auth/session failure when bridge-unavailable lifecycle or backfill requests fail
- Runtime status and runtime history panels now keep their last successful data visible during failed bridge-unavailable refetches
- Production build now passes after the operator-UX polish sweep
- Build output now ships major operator pages in separate route chunks, reducing the initial main bundle even though one large vendor chunk warning still remains
- Broadcast detail now aligns with backend status names such as `completed_with_failures` and recipient fields such as `attempted` and `partial`
- Current repo-hygiene sprint intentionally leaves unrelated local auth/chat edits untouched while improving build-time chunking only on supported product surfaces

### Removed
- Unused legacy `apiLegacy` client
- Unused legacy `verifyCreds` helper
- Unused stale `src/types/saas.types.ts`

### Security
- Implemented JWT authentication with automatic token refresh
- Added tenant context for multi-tenant security
- Enhanced API request security with proper headers

## [2.0.0] - develop

### Added
- Modern React + TypeScript + Vite architecture
- Comprehensive dashboard for Evolution API management
- Multi-language support (PT-BR, EN-US, ES-ES, FR-FR)
- Dark/Light theme support with system preference detection
- Real-time WebSocket integration for live updates
- Responsive design for desktop and mobile devices

#### Chat Management
- WhatsApp chat interface with message history
- Media file handling and preview
- Contact management and search
- Message status tracking

#### Chatbot Integrations
- **OpenAI** - GPT-powered conversations with customizable settings
- **Dify** - AI workflow automation platform integration
- **Typebot** - Visual flow builder for conversational experiences
- **Chatwoot** - Customer support platform integration
- **Flowise** - Low-code AI application builder
- **N8N** - Workflow automation platform
- **Evolution Bot** - Built-in chatbot functionality

#### Event Integrations
- **Webhook** - HTTP event delivery with retry logic
- **WebSocket** - Real-time event streaming
- **RabbitMQ** - Message queue integration
- **SQS** - Amazon Simple Queue Service integration
- **Apache Kafka** - Event streaming platform support

#### Instance Management
- Multi-instance dashboard with status monitoring
- Instance creation and configuration
- QR code display for WhatsApp connection
- Connection status and health monitoring
- Bulk operations for multiple instances

#### User Interface
- Modern UI components built with Radix UI
- Tailwind CSS for consistent styling
- Accessible design following WCAG guidelines
- Keyboard navigation support
- Loading states and error handling

#### Configuration Management
- Instance settings and behavior configuration
- Proxy configuration for network routing
- Authentication and security settings
- Integration-specific configurations

### Technical Features
- TypeScript for type safety and better developer experience
- React Query for efficient data fetching and caching
- React Hook Form with Zod validation
- Socket.io client for real-time communication
- Recharts for data visualization
- Internationalization with react-i18next

### Security
- Input validation and sanitization
- CSRF protection
- Secure authentication handling
- Content Security Policy support

### Performance
- Code splitting and lazy loading
- Optimized bundle size
- Efficient re-rendering with React optimization
- Caching strategies for API responses

## [1.x.x] - Legacy Versions

Previous versions of Evolution Manager (v1.x.x) are now considered legacy.
For migration guides and legacy documentation, please refer to the
[Migration Guide](docs/MIGRATION.md).

---

## Release Notes Format

### Types of Changes
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Contributing to Changelog
When contributing to the project, please update the `[Unreleased]` section
with your changes. The maintainers will move entries to the appropriate
version section during release preparation.

---

**Evolution Manager v2** - Built with ❤️ by the Evolution API Team
