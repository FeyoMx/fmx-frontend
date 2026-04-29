# Frontend Backend Integration

Updated on 2026-04-12.

## Auth Flow

- Login uses `POST /auth/login`
- Session hydration uses:
  - `GET /auth/me`
  - `GET /tenant`
- `apiGlobal` attaches:
  - `Authorization: Bearer <access_token>`
  - `X-Tenant-ID` when available

## Refresh Flow

- Access tokens are refreshed before expiry when possible
- `apiGlobal` retries once on `401` after `POST /auth/refresh`
- On refresh failure, auth storage is cleared and the user is redirected to `/manager/login`

## Logout Flow

- Frontend logout clears local access token, refresh token, tenant, user, and cached query data.
- When an access token is available, the frontend calls `POST /auth/logout` as a best-effort acknowledgement before local cleanup finishes.
- Backend logout is currently stateless and protected by the bearer token; refresh tokens are JWTs and are not server-revoked by this endpoint.
- Backend logout failure never blocks local logout or traps the operator in stale session UI.

## Shared Error Handling

`src/lib/queries/errors.ts` is the shared adapter for user-facing backend errors.

Handled explicitly:

- `401`
- `403`
- `404`
- `429`
- `400`
- `422`
- `501`
- generic `5xx`

## Tenant-Safe Chat And Messaging

The supported MVP chat flow now lives on the instance chat routes:

- `/manager/instance/:instanceId/chat`
- `/manager/instance/:instanceId/chat/:remoteJid`

These routes use tenant-safe SaaS endpoints for:

- chat list: `POST /instance/:id/chats/search`
- persisted message history: `POST /instance/:id/messages/search`
- text send: `POST /instance/:id/messages/text`
- media send: `POST /instance/:id/messages/media`
- audio send: `POST /instance/:id/messages/audio`

The chat-list adapter accepts either the current array response or an envelope with `items` / `chats` / `data` plus optional metadata fields: `cached`, `stale`, `source`, and `refreshed_at`. Cached or stale chat-list data is not treated as an error; the UI shows subtle operator copy while keeping search and thread navigation active.

The message-history request supports `where.key.remoteJid`, optional `where.key.id` / `where.messageId`, optional `where.query` / `where.search` / `where.text`, optional `limit`, and optional `cursor`.

Legacy embed chat routes remain in the repo only as gated placeholders. They are not part of the supported operator flow and still depend on older token/query-param contracts.

## Instance Lifecycle And Recovery

The instance dashboard now uses the current tenant-safe lifecycle contract directly:

- `POST /instance/id/:instanceID/reconnect`
- `POST /instance/id/:instanceID/pair`
- `DELETE /instance/id/:instanceID/logout`
- `GET /instance/id/:instanceID/runtime`
- `GET /instance/id/:instanceID/runtime/history`
- `POST /instance/id/:instanceID/history/backfill`

### Frontend behavior

- `Reconnect` is the operator action for reopening a live session and refreshing QR availability when the backend exposes one.
- `Pair with code` is only shown when the instance has a phone number that can be used with the backend pairing endpoint.
- `Log out` uses the backend delete semantics and then refreshes status, QR, runtime state, and runtime history.
- `History backfill` is exposed as a guarded recovery action on the instance dashboard and requires:
  - a chat JID
  - a stored message anchor for that chat
  - a live bridge session able to return a sync blob

### Current limitations

- history backfill is bounded, bridge-dependent, and not a guaranteed full replay
- runtime truth can still lag briefly when the bridge is degraded or temporarily unavailable
- chat history completeness still depends on what the runtime captured or what the bridge can return during backfill

## Instance Text Messaging

The direct instance-dashboard text action is still async and remains useful for quick outbound sends.

### Send route

- `POST /instance/:id/messages/text`

Request body:

```json
{
  "number": "5215512345678",
  "text": "Hello from FMX",
  "delay": 0
}
```

Accepted response:

```json
{
  "message": "message queued; delivery pending",
  "queued": true,
  "accepted_only": true,
  "sent": false,
  "delivery_confirmed": false,
  "delivery_status": "queued",
  "job_id": "job_123",
  "status_endpoint": "/instance/id/uuid/messages/text/job_123",
  "instance_id": "uuid",
  "instanceName": "MyInstance"
}
```

### Status route

- `GET /instance/id/:instanceID/messages/text/:jobID`
- or the relative path returned by `status_endpoint`

Status payload can include:

```json
{
  "job_id": "job_123",
  "status": "queued",
  "delivery_status": "queued",
  "sent": false,
  "delivery_confirmed": false,
  "queued_at": "2026-04-05T12:00:00Z",
  "started_at": "2026-04-05T12:00:02Z",
  "finished_at": "2026-04-05T12:00:03Z",
  "delivered_at": "2026-04-05T12:00:05Z",
  "read_at": "2026-04-05T12:00:08Z"
}
```

### Frontend behavior

- `202 Accepted` is never treated as final success
- UI immediately shows `En cola`
- frontend polls `status_endpoint` every 2.5 seconds
- polling stops on:
  - `delivery_status === "delivered"`
  - `delivery_status === "read"`
  - `delivery_confirmed === true`
  - `status === "failed"`
  - UI timeout

### Current limitations

- instance-dashboard sending is still only a quick-send surface, not a full conversation workspace
- older sessions are not guaranteed to be historically backfilled into chat threads even though a bounded recovery action now exists
- inbound history completeness still depends on runtime event capture
- stored media history can still be partial when preview/download metadata is missing

## Supported Instance Connectors

Frontend pages currently wired to real tenant-safe SaaS routes:

- Webhook
  - `GET /webhook`
  - `POST /webhook`
  - `GET /webhook/:id`
  - `PATCH /webhook/:id`
  - `DELETE /webhook/:id`
- Websocket
  - `GET /instance/:id/websocket`
  - `PUT /instance/:id/websocket`
- RabbitMQ
  - `GET /instance/:id/rabbitmq`
  - `PUT /instance/:id/rabbitmq`
- Proxy
  - `GET /instance/:id/proxy`
  - `PUT /instance/:id/proxy`
- Advanced settings
  - `GET /instance/id/:instanceID/advanced-settings`
  - `PUT /instance/id/:instanceID/advanced-settings`

## Explicit Backend-Partial Surfaces

The backend intentionally exposes the following as `501 partial`, and the frontend keeps them gated or placeholder-backed instead of faking parity:

- `GET/PUT /instance/:id/sqs`
- `GET/PUT /instance/:id/chatwoot`
- `GET/POST /instance/:id/openai`
- `GET/POST /instance/:id/typebot`
- `GET/POST /instance/:id/dify`
- `GET/POST /instance/:id/n8n`
- `GET/POST /instance/:id/evoai`
- `GET/POST /instance/:id/evolutionBot`
- `GET/POST /instance/:id/flowise`

## Current Integration Principles

- prefer backend route registration over stale legacy manager assumptions
- keep adapters centralized near `src/lib/queries/*`
- preserve tenant-safe routing and auth
- show guarded placeholders for backend-partial surfaces
- do not revive legacy instance-token or query-param chat flows unless the SaaS backend truly supports them
