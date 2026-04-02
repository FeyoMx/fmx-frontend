# Evolution Manager v2 - Multi-Tenant SaaS Migration

## 🎯 Overview

The Evolution Manager frontend has been successfully adapted to support a modern multi-tenant SaaS architecture with JWT authentication, tenant isolation, and new features for CRM, broadcasting, AI settings, and API key management.

## ✅ Changes Implemented

### 1. **Authentication System**

#### New Files Created:
- `src/types/auth.types.ts` - Authentication type definitions
- `src/lib/queries/auth/login.ts` - Login API service
- `src/lib/auth.ts` - JWT token management utilities

#### Features:
- JWT token-based authentication replacing API key approach
- Automatic token refresh 5 minutes before expiration
- localStorage persistence for tokens and user data
- Token expiration checking utilities
- Refresh token support for long-lived sessions

#### Updated Files:
- `src/pages/Login/index.tsx` - Rewritten with email/password form and JWT support
- `src/components/providers/protected-route.tsx` - Updated to check JWT tokens
- `src/components/providers/public-route.tsx` - Updated to check JWT tokens

---

### 2. **Multi-Tenant Context**

#### New File Created:
- `src/contexts/TenantContext.tsx` - Tenant and user context provider

#### Features:
- Global tenant and user state management
- Automatic initialization from localStorage
- Background token refresh mechanism
- Easy access via `useTenant()` hook

#### Usage:
```typescript
const { tenant, user, token } = useTenant();
```

---

### 3. **API Configuration**

#### Updated File:
- `src/lib/queries/api.ts` - Enhanced with JWT and multi-tenant support

#### Features:
- **JWT Bearer Token**: Automatically attaches `Authorization: Bearer {token}` header
- **Tenant Header**: Includes `X-Tenant-ID` header for tenant isolation
- **Automatic Token Refresh**: Refreshes token if expiring within 5 minutes
- **401 Response Handler**: Automatically attempts token refresh on 401 errors
- **Backward Compatibility**: Legacy API key support maintained via `apiLegacy`

#### Available Instances:
- `apiGlobal` - Use for tenant-scoped requests (JWT + Tenant ID)
- `api` - Instance-scoped requests (legacy API key support)

---

### 4. **New Pages**

#### CRM Page (`src/pages/CRM/index.tsx`)
Features:
- Contact management (create, list, delete)
- Search and filter by tags
- Pipeline stage support
- Tag-based categorization
- Responsive table view

Endpoints Used:
- `GET /contacts` - List all contacts
- `POST /contacts` - Create new contact
- `DELETE /contacts/{id}` - Delete contact
- `GET /contacts/pipeline-stages` - Get pipeline stages

#### Broadcast Page (`src/pages/Broadcast/index.tsx`)
Features:
- Create and send broadcasts
- Schedule broadcasts for later
- Delay configuration for immediate sends
- Message template selection
- Broadcast history with status tracking
- Success/failure metrics per broadcast

Endpoints Used:
- `GET /broadcast` - List broadcasts
- `POST /broadcast` - Create and send broadcast

#### AI Settings Page (`src/pages/AISettings/index.tsx`)
Features:
- Tenant-level AI enablement toggle
- API key configuration
- Model selection (GPT-4, GPT-3.5, Claude 3)
- Max tokens and temperature configuration
- Per-instance AI toggle
- Instance-level AI settings

Endpoints Used:
- `GET /ai/settings` - Get current AI settings
- `PUT /ai/settings` - Update tenant AI settings
- `PUT /ai/instance/{id}` - Update instance AI settings

#### API Keys Page (`src/pages/APIKeys/index.tsx`)
Features:
- Create new API keys
- List all active keys
- View/hide key values
- Copy to clipboard functionality
- Revoke/delete keys
- Track last used date
- Scope management (placeholder for future)

Endpoints Used:
- `GET /apikey` - List all API keys
- `POST /apikey` - Create new key
- `DELETE /apikey/{id}` - Revoke key

---

### 5. **Dashboard Enhancement**

#### Updated File:
- `src/pages/Dashboard/index.tsx`

#### New Metrics Cards:
- **Total Instances** - Shows count and active instances
- **Total Messages** - Monthly message count
- **AI Usage** - Percentage of quota used
- **Plan** - Current subscription plan

#### New Endpoint:
- `GET /dashboard/metrics` - Fetch dashboard metrics

---

### 6. **Sidebar Updates**

#### Updated File:
- `src/components/sidebar.tsx`

#### New Menu Section: "Management"
- **Contacts** → `/manager/contacts` (CRM)
- **Broadcast** → `/manager/broadcast`
- **AI Settings** → `/manager/ai-settings`
- **API Keys** → `/manager/api-keys`

#### Existing Sections Maintained:
- Instance configurations
- Events (webhook, websocket, rabbitmq, sqs)
- Integrations (all existing ones)
- External links

---

### 7. **Header Component**

#### Updated File:
- `src/components/header.tsx`

#### Changes:
- Display current user name and avatar
- JWT-based logout using `clearAuthTokens()`
- Internationalization support
- User profile avatar with initials

---

### 8. **Routes Configuration**

#### Updated File:
- `src/routes/index.tsx`

#### New Routes Added:
```
/manager/contacts        → CRM page
/manager/broadcast       → Broadcast page
/manager/ai-settings     → AI Settings page
/manager/api-keys        → API Keys page
```

#### All New Routes Protected:
- Wrapped with `<ProtectedRoute>`
- Displayed within `<MainLayout>`
- Require valid JWT token

---

### 9. **Application Entry Point**

#### Updated File:
- `src/main.tsx`

#### Changes:
- Added `<TenantProvider>` wrapper around router
- Initializes tenant and user state globally
- Enables automatic token refresh

---

### 10. **Environment Configuration**

#### New File:
- `.env.example`

#### Required Variables:
```env
VITE_API_URL=http://localhost:3000
```

---

## 🔐 Security Features

✅ **JWT Authentication**: Secure token-based auth, no API keys sent in requests
✅ **Tenant Isolation**: All requests include tenant ID header
✅ **Automatic Token Refresh**: Proactive refresh before expiration
✅ **Protected Routes**: All sensitive pages require valid JWT
✅ **Logout Cleanup**: Complete token removal on logout
✅ **Error Handling**: Automatic redirect to login on 401 responses
✅ **Password Fields**: Input properly masked as password type

---

## 📝 API Contract Requirements

For the backend implementation, ensure these endpoints exist:

### Authentication
```
POST /auth/login
  Request: { email, password }
  Response: { token, refreshToken?, user, tenant }

POST /auth/refresh
  Request: { refreshToken }
  Response: { token, refreshToken?, user, tenant }
```

### Dashboard
```
GET /dashboard/metrics
  Response: { totalInstances, totalMessages, aiUsagePercentage, activeInstances }
```

### Contacts (CRM)
```
GET /contacts
  Response: Contact[]

POST /contacts
  Request: { name, email, phone, tags }
  Response: Contact

DELETE /contacts/{id}

GET /contacts/pipeline-stages
  Response: PipelineStage[]
```

### Broadcast
```
GET /broadcast
  Response: Broadcast[]

POST /broadcast
  Request: { title, message, template, delay, scheduledAt }
  Response: { id, ... }
```

### AI Settings
```
GET /ai/settings
  Response: { tenant: AISettings, instances: InstanceAISettings[] }

PUT /ai/settings
  Request: AISettings
  Response: AISettings

PUT /ai/instance/{id}
  Request: { enabled, model }
  Response: InstanceAISettings
```

### API Keys
```
GET /apikey
  Response: APIKey[]

POST /apikey
  Request: { name }
  Response: { id, key, name, createdAt }

DELETE /apikey/{id}
  Response: 204 No Content
```

---

## 🚀 Getting Started

### 1. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local and set VITE_API_URL to your backend URL
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 📦 Feature Checklist

- ✅ Multi-tenant JWT authentication
- ✅ Tenant isolation (X-Tenant-ID header)
- ✅ Automatic token refresh
- ✅ Protected routes
- ✅ Logout functionality
- ✅ Dashboard with metrics
- ✅ CRM page with contact management
- ✅ Broadcast page with scheduling
- ✅ AI Settings page with tenant/instance toggle
- ✅ API Keys management page
- ✅ Updated sidebar navigation
- ✅ User profile display in header
- ✅ Backward compatibility with existing instance pages
- ✅ WebSocket features preserved
- ✅ Chat UI preserved
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Internationalization ready

---

## 🔄 Migration Notes

### Breaking Changes
- Login now requires email/password instead of API key + server URL
- Token management changed from `TOKEN_ID.TOKEN` to JWT functions
- API requests automatically include Authorization header

### Backward Compatibility
- Existing instance pages remain fully functional
- WebSocket features preserved
- Chat functionality unchanged
- Legacy API key support available via `apiLegacy`

---

## 🐛 Troubleshooting

### "Not authenticated" or redirect to login
- Check `.env.local` has correct `VITE_API_URL`
- Ensure backend is running and API is accessible
- Check browser localStorage for `jwt_token`

### API requests failing with 401
- Token may have expired; page should auto-refresh
- Check network tab for `X-Tenant-ID` header being sent
- Verify refresh token endpoint is working

### Tenant information not showing
- Ensure `TenantProvider` is wrapping the app in `main.tsx`
- Check that user data is saved after login via `saveUserData()`

---

## 📚 Additional Resources

- React Router: https://reactrouter.com/
- React Query: https://tanstack.com/query
- Tailwind CSS: https://tailwindcss.com/
- Radix UI: https://www.radix-ui.com/
