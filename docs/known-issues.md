# Known Issues

Updated on 2026-04-06.

## Sparse Counters

- Dashboard aggregate counters for messages, contacts, and broadcasts can be sparse or remain at zero.
- Instance totals and current status breakdown are more trustworthy than aggregate analytics totals.

## Partial Historical Completeness

- Chat history does not include historical backfill for older sessions.
- Inbound message completeness depends on runtime event capture.
- Media history can be partial when the backend does not provide enough metadata for preview or playback.

## Informational-Only Surfaces

- `/manager/api-keys` is intentionally informational only.
- The backend supports API key authentication, but not full key management from this frontend.

## Gated Legacy Features

- Legacy integration suites remain outside the MVP operator flow:
- Chatwoot
- SQS
- OpenAI resource CRUD
- Typebot
- Dify
- N8N
- EvoAI
- Evolution Bot
- Flowise

These routes should be treated as intentionally gated, not as partially hidden active features.

## Runtime Truth Still Depends On Bridge Availability

- Runtime observability is durable and useful, but it is not fully bridge-independent.
- When the bridge is degraded or unavailable, runtime truth can lag behind real device state.

## Demo Note

- For pilot demos, stay on the supported MVP routes and describe these caveats proactively rather than letting them appear as surprises.
