# Frontend Backend Integration

## Auth Flow
- Login uses `POST /auth/login`
- Request body:

```json
{
  "tenant_slug": "example-tenant",
  "email": "owner@example.com",
  "password": "secret"
}
```

- Backend returns:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "tenant_id": "ten_123",
  "user_id": "usr_123",
  "role": "owner",
  "expires_in": 900
}
```

- Frontend then loads session context with:
  - `GET /auth/me`
  - `GET /tenant`

## Token Storage
- Access token is stored in local storage through the shared auth helpers
- Refresh token is stored separately and used only for token renewal
- Tenant ID is stored after login and attached on authenticated SaaS requests
- Legacy instance token storage still exists for unsupported instance-scoped pages, but it is no longer part of the primary SaaS flow

## Refresh Flow
- `apiGlobal` attaches `Authorization: Bearer <access_token>`
- Before each request, the client checks token expiry and refreshes if the token is close to expiring
- On a `401` response, `apiGlobal` retries once after calling `POST /auth/refresh`
- If refresh fails, auth storage is cleared and the user is redirected to `/manager/login`

## API Service Structure

### `src/lib/queries/api.ts`
- `apiGlobal`
  - Used for tenant-scoped SaaS routes
  - Attaches `Authorization` and `X-Tenant-ID`
  - Handles refresh-token retry
- `api`
  - Used by legacy instance-token pages
  - Attaches `apikey`
  - Exists only because several legacy pages still depend on unsupported backend routes

### Normalizers and Adapters
- `src/lib/queries/instance/normalize.ts`
  - Maps backend instance payloads into existing UI `Instance` shape
- `src/lib/queries/crm/contacts.ts`
  - Maps backend contact rows and nested tags into `ContactView`
- `src/lib/queries/broadcast/jobs.ts`
  - Maps backend broadcast jobs into `BroadcastView`
- `src/lib/queries/ai/settings.ts`
  - Maps tenant and per-instance AI settings into frontend view models
- `src/lib/queries/errors.ts`
  - Centralizes backend error message extraction for consistent UI feedback

## Base URL Configuration
- Preferred env var: `VITE_API_URL`
- Backward-compatible fallback: `VITE_API_BASE_URL`
- Default fallback: `http://localhost:8080`

## Tenant Behavior
- The backend is multi-tenant
- Tenant context is derived from login response and hydrated with `GET /tenant`
- Authenticated SaaS requests send `X-Tenant-ID` when available
- The backend can also authenticate protected routes with a tenant API key through `X-API-Key` or `apikey`, but the frontend does not expose API key CRUD because the backend does not provide it

## Endpoint Mapping

### Current SaaS Pages
- Dashboard
  - `GET /dashboard/metrics`
  - `GET /instance`
  - `POST /instance`
- Login
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `GET /auth/me`
  - `POST /auth/logout`
- Tenant context
  - `GET /tenant`
- CRM
  - `GET /contacts`
  - `POST /contacts`
- Broadcast
  - `GET /broadcast`
  - `POST /broadcast`
- AI settings
  - `GET /ai/settings`
  - `PUT /ai/settings`
  - `GET /ai/instances/:instanceID`
  - `PUT /ai/instances/:instanceID`
- Webhooks
  - `GET /webhook`
  - `POST /webhook`
  - `GET /webhook/:id`
  - `PATCH /webhook/:id`
  - `DELETE /webhook/:id`

### Unsupported Legacy Pages
The following frontend pages still target legacy endpoints that are not registered in the backend route registry:
- `/chat/*`
- `/websocket/*`
- `/rabbitmq/*`
- `/sqs/*`
- `/proxy/*`
- `/chatwoot/*`
- `/openai/*`
- `/typebot/*`
- `/dify/*`
- `/n8n/*`
- `/evoai/*`
- `/evolutionBot/*`
- `/flowise/*`

## Error Handling
- Backend validation and auth errors are surfaced through `getApiErrorMessage`
- Expected user-visible categories:
  - invalid credentials
  - expired session
  - forbidden access
  - validation errors
  - network failure

## Notes for Future Sync Work
- Hide or gate unsupported legacy instance pages rather than faking backend support
- Continue replacing UI-specific assumptions with small view adapters near the query layer
- Prefer route registration in the backend code over old integration docs when conflicts appear
