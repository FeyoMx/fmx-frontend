# MVP Scope

Updated on 2026-04-06.

## Release Candidate Goal

This release candidate freezes the tenant-safe FMX Evolution MVP surface for manual QA and pilot demos. The goal is a coherent operator workflow around connection management, runtime visibility, and day-to-day messaging actions.

## Supported MVP Pages And Features

### Dashboard

- tenant-aware dashboard entry at `/manager`
- instance list with real status badges
- operator-focused status overview
- honest aggregate-counter caveats when backend totals are sparse

### Contacts

- contacts page at `/manager/contacts`
- list existing contacts
- create contacts
- filter by search and tag

### Broadcast Basic

- broadcast page at `/manager/broadcast`
- create and queue a broadcast job
- review recent broadcast jobs
- see queue/job state with readable badges

### AI Settings

- AI settings page at `/manager/ai-settings`
- tenant default AI configuration
- per-instance AI enablement
- honest messaging that legacy AI suites are still outside MVP scope

### Instance Dashboard

- instance dashboard at `/manager/instance/:instanceId/dashboard`
- QR and pairing flows
- reconnect, restart, and logout lifecycle controls
- direct text send from the instance surface

### Runtime Observability

- current runtime state panel
- last observed status
- last updated timestamp
- recent runtime/lifecycle history
- refresh after lifecycle actions

### Chat List And Detail

- chat list at `/manager/instance/:instanceId/chat`
- conversation detail at `/manager/instance/:instanceId/chat/:remoteJid`
- normalized history from the tenant-safe message search route
- grouped messages, timestamps, direction, and delivery/read indicators when available
- honest empty and sparse-history states

### Text, Media, And Audio Send

- text send from the instance dashboard
- text, media, and audio send from the active chat composer
- safe refresh or optimistic append behavior in supported conversation routes
- in-flight feedback and partial-history caveats

## Out Of Scope Or Partial

### Deep Analytics

- aggregate counters can still be sparse
- trend reporting and richer analytics are not part of this MVP

### Legacy Integration Suites

- Chatwoot
- SQS
- OpenAI resource CRUD
- Typebot
- Dify
- N8N
- EvoAI
- Evolution Bot
- Flowise

These remain gated and should not be presented as active product flows.

### API Keys As A Full Product Surface

- API key authentication exists in the backend contract
- full key lifecycle management is not exposed in the frontend MVP
- `/manager/api-keys` is informational only

### Perfect Chat History Completeness

- no historical backfill for older sessions
- inbound completeness depends on runtime capture
- media history can be partial when metadata is missing

### Bridge-Independent Runtime Truth

- runtime observability is durable and useful
- final truth can still lag when the bridge is unavailable or degraded

## Demo Guidance

- Stay inside the supported routes above during demos.
- Treat informational and gated surfaces as honest product boundaries, not hidden features.
- When showing chat or runtime state, call out that the UI reflects the current tenant-safe backend contract rather than claiming full upstream parity.
