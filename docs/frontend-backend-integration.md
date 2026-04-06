# Frontend Backend Integration

Updated on 2026-04-05.

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

## Instance Text Messaging

The current tenant-safe messaging flow is text-only and async.

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

- no tenant-safe inbox/thread browsing
- no media send
- no audio send
- no chat search/message history

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

- `POST /instance/:id/chats/search`
- `POST /instance/:id/messages/search`
- `POST /instance/:id/messages/media`
- `POST /instance/:id/messages/audio`
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
- do not revive legacy instance-token CRUD flows unless the SaaS backend truly supports them
