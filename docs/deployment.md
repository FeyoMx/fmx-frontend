# Deployment

## Build Command

```bash
npm ci
npm run build
```

The production bundle is generated in `dist/`.

## Environment Setup

Set the backend API origin before building:

```bash
VITE_API_URL=https://api.example.com
```

`VITE_API_URL` is the preferred variable. `VITE_API_BASE_URL` is still accepted for backward compatibility.

If neither variable is set, the app uses `/api` as a same-origin fallback. Only rely on that when the host or reverse proxy forwards `/api` to the backend.

Do not put secrets in `VITE_` variables. Vite embeds these values in the browser bundle.

## Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://api.example.com`
- Add a backend CORS allowlist entry for the Vercel production domain.

If using a same-origin proxy, configure Vercel rewrites so `/api/:path*` forwards to the backend API.

## Static Hosting

Any static host can serve the generated `dist/` folder.

Recommended server behavior:

- Serve `index.html` for unknown routes so React Router deep links work.
- Cache hashed files in `dist/assets/` aggressively.
- Avoid long caching for `index.html`.
- Proxy `/api` to the backend only when choosing the same-origin fallback.
- Use HTTPS for both frontend and backend origins.

## Local Preview

```bash
npm run preview
```

Use this after `npm run build` to smoke-test the production bundle locally.
