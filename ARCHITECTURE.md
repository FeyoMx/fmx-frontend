# Architecture & Changes Summary

## 📁 New Files Created

### Authentication & Auth
```
src/types/auth.types.ts              # JWT authentication types
src/lib/auth.ts                      # Token management functions
src/lib/queries/auth/login.ts        # Login API service
```

### Contexts
```
src/contexts/TenantContext.tsx        # Multi-tenant context provider
```

### Pages
```
src/pages/CRM/index.tsx               # Contact management page
src/pages/Broadcast/index.tsx         # Broadcast messaging page
src/pages/AISettings/index.tsx        # AI configuration page
src/pages/APIKeys/index.tsx           # API key management page
```

### Types
```
src/types/saas.types.ts               # SaaS feature type definitions
```

### Config
```
.env.example                          # Environment variables template
MIGRATION.md                          # Migration guide
ARCHITECTURE.md                       # This file
```

---

## 📝 Modified Files

### Core Application
```
src/main.tsx
├─ Added TenantProvider wrapper
└─ Required for global tenant state

src/routes/index.tsx
├─ Added CRM route: /manager/contacts
├─ Added Broadcast route: /manager/broadcast
├─ Added AI Settings route: /manager/ai-settings
└─ Added API Keys route: /manager/api-keys
```

### API Configuration
```
src/lib/queries/api.ts
├─ Enhanced JWT support with Bearer token
├─ Added X-Tenant-ID header injection
├─ Implemented automatic token refresh logic
├─ Added 401 error response handling
├─ Maintained backward compatibility for legacy API key approach
└─ Created separate apiGlobal instance for tenant-scoped requests
```

### Authentication & Routes
```
src/pages/Login/index.tsx
├─ Rewrote from API key to JWT-based login
├─ Email/password form instead of serverUrl/apiKey
├─ Integrated with TenantContext
└─ Added loading states and error handling

src/components/providers/protected-route.tsx
├─ Updated to check JWT tokens via TenantContext
├─ Added loading state handling
└─ Checks for getAuthToken() instead of TOKEN_ID

src/components/providers/public-route.tsx
├─ Updated to check JWT tokens
├─ Prevents authenticated users from accessing login
└─ Loading state awareness
```

### UI Components
```
src/components/header.tsx
├─ Added user name and avatar display
├─ Updated logout to use clearAuthTokens()
├─ Internationalization support
└─ Profile information from TenantContext

src/components/sidebar.tsx
├─ Added new "Management" menu section with 4 items
├─ Links to CRM, Broadcast, AI Settings, API Keys
├─ Maintained all existing sections
└─ Responsive navigation structure
```

### Dashboard
```
src/pages/Dashboard/index.tsx
├─ Added 4 metric cards (Instances, Messages, AI Usage, Plan)
├─ Calls GET /dashboard/metrics endpoint
├─ Displays tenant information
├─ Maintains existing instance list functionality
└─ Added refresh metrics on instance changes
```

---

## 🔐 Authentication Flow

```
User Input (Email/Password)
    ↓
POST /auth/login
    ↓
Backend validates & returns JWT + RefreshToken
    ↓
Store in localStorage via saveAuthTokens()
Store user data via saveUserData()
    ↓
Update TenantContext
    ↓
Redirect to /manager/
    ↓
ProtectedRoute Verification
    ↓
Render protected content
```

### Token Refresh Flow
```
Every axios request with apiGlobal
    ↓
Check token expiration
    ↓
If expiring within 5 minutes
    ↓
POST /auth/refresh with refreshToken
    ↓
Update tokens in localStorage & context
    ↓
Attach new token to request headers
    ↓
Continue with request
```

###401 Response Flow
```
API returns 401 Unauthorized
    ↓
Response interceptor catches it
    ↓
Attempt POST /auth/refresh
    ↓
Success: Update token, retry original request
    ↓
Failure: Clear tokens, redirect to /manager/login
```

---

## 🔗 API Integration Points

### Required Backend Endpoints

#### Authentication
- `POST /auth/login` - Returns JWT, refreshToken, user, tenant
- `POST /auth/refresh` - Validates refreshToken, returns new JWT

#### Dashboard
- `GET /dashboard/metrics` - Returns instance count, message count, AI usage %

#### CRM (Contacts)
- `GET /contacts` - List all contacts
- `POST /contacts` - Create contact
- `DELETE /contacts/{id}` - Delete contact
- `GET /contacts/pipeline-stages` - Get available stages

#### Broadcast
- `GET /broadcast` - List broadcasts
- `POST /broadcast` - Send/schedule broadcast

#### AI Settings
- `GET /ai/settings` - Get tenant & instance settings
- `PUT /ai/settings` - Update tenant settings
- `PUT /ai/instance/{id}` - Update instance settings

#### API Keys
- `GET /apikey` - List API keys
- `POST /apikey` - Create new key
- `DELETE /apikey/{id}` - Revoke key

---

## 📊 HTTP Headers

### All Requests to `apiGlobal`

```
Authorization: Bearer {jwt_token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json
```

### Token Lifecycle

| Event | Header | Status |
|-------|--------|--------|
| Fresh Login | Bearer {token} | Valid for 1 hour* |
| 55 min elapsed | Bearer {new_token} | Auto-refreshed |
| Request at 59 min | Bearer {new_token} | Refreshed before use |
| Token expired | Returns 401 | Refresh attempt triggered |
| Refresh fails | No token | Redirect to login |

*Adjust expiration based on backend configuration

---

## 🎯 Context Usage

### TenantContext Provides
```typescript
{
  tenant: {           // Tenant info
    id: string;
    name: string;
    plan: "free" | "pro" | "enterprise";
    instancesCount: number;
    messagesCount: number;
    aiUsage: { tokensUsed, tokensLimit };
  }
  user: {             // Current user
    id: string;
    email: string;
    name: string;
    role: "admin" | "manager" | "user";
    tenantId: string;
  }
  token: string | null;      // Current JWT
  isLoading: boolean;         // Initial load state
  setTenant: Function;        // Update tenant
  setUser: Function;          // Update user
  setToken: Function;         // Update token
}
```

### Usage in Components
```typescript
import { useTenant } from "@/contexts/TenantContext";

function MyComponent() {
  const { tenant, user, token } = useTenant();
  
  return (
    <div>
      <h1>{tenant?.name}</h1>
      <p>Welcome, {user?.name}</p>
    </div>
  );
}
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │ email/password
         ↓
    ┌─────────────────────────┐
    │ POST /auth/login        │
    └────────┬────────────────┘
             │ token, refreshToken, user, tenant
             ↓
    ┌──────────────────────┐
    │ Save in localStorage │
    │ Update TenantContext │
    └────────┬─────────────┘
             │
             ↓
    ┌─────────────────────┐
    │  ProtectedRoute     │
    │  Checks JWT Token   │
    └────────┬────────────┘
             │ Valid
             ↓
    ┌──────────────────────┐
    │ Render Protected Page│
    └──────────────────────┘
         │
         ├─→ All requests attach JWT header
         ├─→ All requests attach X-Tenant-ID header
         ├─→ Auto-refresh if expiring soon
         └─→ Redirect to login on 401
```

---

## 🚀 Performance Considerations

1. **Token Refresh**: Proactive refresh 5 mins before expiry minimizes 401 responses
2. **Tenant Data Caching**: User & tenant info cached in localStorage, not re-fetched
3. **Context Updates**: TenantContext uses React Context API for minimal re-renders
4. **API Instances**: Separate `apiGlobal` and `api` instances prevent header conflicts
5. **Route Protection**: Early route checks prevent rendering protected content

---

## ✨ Feature Highlights

### Security
✓ JWT instead of API keys
✓ Tenant isolation via headers
✓ Automatic token management
✓ Secure logout with complete cleanup
✓ Protected routes

### UX
✓ Auto token refresh (no mid-session logouts)
✓ User profile in header
✓ Loading states during auth
✓ Clear error messages
✓ Responsive design

### Maintainability
✓ Modular page components
✓ Reusable context provider
✓ Type-safe with TypeScript
✓ Clear separation of concerns
✓ Comprehensive migration guide

---

## 🔗 Cross-Cutting Concerns

### Error Handling
- 401: Auto-refresh attempt, then login redirect
- 403: Permission denied (user sees error)
- 500: API error (user sees notification)

### Loading States
- Auth loading: `TenantContext.isLoading`
- Route protection: Route shows nothing while initializing
- Page components: Individual loading spinners

### Internationalization
- All new components support `useTranslation()`
- Add translations to language files in `src/translate/languages/`
- Placeholder translations included in code

