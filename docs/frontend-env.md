# Frontend Environment Configuration

## Required Variables

```bash
VITE_API_URL=https://api.example.com
```

`VITE_API_URL` is the preferred backend API origin for production builds. `VITE_API_BASE_URL` remains supported as a backward-compatible fallback for older deployment environments.

If neither variable is set, the frontend uses `/api` as a relative same-origin fallback. Use that only when the static host or reverse proxy forwards `/api` to the backend.

## API Configuration

- Preferred variable: `VITE_API_URL`
- Backward-compatible fallback: `VITE_API_BASE_URL`
- Same-origin fallback: `/api`
- Required for hosted static deployments unless `/api` is reverse-proxied
- Do not place secrets in `VITE_` variables because Vite embeds them into the browser bundle

## Authentication

- JWT access token storage key: `auth_token`
- Refresh token storage key: `refresh_token`
- Tenant storage key: `tenant_id`
- Refresh endpoint: `POST /auth/refresh`
- Current user endpoint: `GET /auth/me`

## Build Commands

```bash
npm install
npm run build
npm run preview
```

The production output is written to `dist/`.

## Docker And Static Hosting

For Docker or static hosting, set `VITE_API_URL` at build time:

```bash
VITE_API_URL=https://api.example.com npm run build
```

For same-origin deployments, configure the web server to serve the built frontend and proxy `/api` to the backend.

## Security Notes

- Configure backend CORS for the production frontend origin.
- Prefer HTTPS for both frontend and API origins.
- Keep tenant secrets and server tokens out of browser environment variables.
