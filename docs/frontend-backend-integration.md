# Frontend-Backend Integration

## 📡 API Architecture

### HTTP Clients

#### `api` (Legacy Instance-Scoped)
```typescript
// For instance-specific operations with API key
const api = axios.create({
  baseURL: VITE_API_BASE_URL,
  timeout: 30000
});

// Interceptors
api.interceptors.request.use((config) => {
  const token = getToken(TOKEN_ID.INSTANCE_TOKEN);
  if (token) {
    config.headers.apikey = token;
  }
  return config;
});
```

#### `apiGlobal` (Modern Tenant-Scoped)
```typescript
// For tenant-scoped operations with JWT
const apiGlobal = axios.create({
  baseURL: VITE_API_BASE_URL,
  timeout: 30000
});

// Interceptors
apiGlobal.interceptors.request.use(async (config) => {
  let token = getAuthToken();

  // Auto-refresh token if needed
  if (token && isTokenExpiring(token)) {
    token = await refreshAuthToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantId = getTenantId();
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  return config;
});
```

## 🔐 Authentication Flow

### Login Process
```typescript
// POST /auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  tenant: {
    id: string;
    name: string;
  };
}
```

### Token Management
- **Access Token**: Short-lived (15-30 minutes)
- **Refresh Token**: Long-lived (7-30 days)
- **Storage**: LocalStorage with secure handling
- **Auto-refresh**: Transparent token renewal on 401 responses

## 📊 Data Fetching Strategy

### TanStack Query Configuration
```typescript
// Global query client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: (failureCount, error) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 3;
      }
    },
    mutations: {
      retry: false
    }
  }
});
```

### Query Keys Pattern
```typescript
// Consistent key structure
const queryKeys = {
  instance: {
    list: ['instance', 'list'] as const,
    detail: (id: string) => ['instance', 'detail', id] as const,
    settings: (id: string) => ['instance', 'settings', id] as const,
  },
  auth: {
    user: ['auth', 'user'] as const,
  }
};
```

## 🔄 Real-time Updates

### WebSocket Integration
```typescript
// WebSocket service for real-time updates
class WebSocketService {
  private ws: WebSocket | null = null;

  connect(instanceId: string) {
    this.ws = new WebSocket(`${WS_BASE_URL}/instance/${instanceId}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Invalidate relevant queries
      queryClient.invalidateQueries(['instance', 'status', instanceId]);
    };
  }
}
```

### Polling Fallbacks
```typescript
// For endpoints without WebSocket support
useQuery({
  queryKey: ['instance', 'status', instanceId],
  queryFn: () => getInstanceStatus(instanceId),
  refetchInterval: 5000, // Poll every 5 seconds
  refetchIntervalInBackground: true,
});
```

## 📋 API Endpoints Mapping

### Authentication
```typescript
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Instance Management
```typescript
GET    /instance                    # List instances
POST   /instance                    # Create instance
GET    /instance/id/:id             # Get instance details
PUT    /instance/id/:id             # Update instance
DELETE /instance/id/:id             # Delete instance

POST   /instance/id/:id/connect     # Connect WhatsApp
POST   /instance/id/:id/disconnect  # Disconnect WhatsApp
GET    /instance/id/:id/qrcode      # Get QR code
GET    /instance/id/:id/status      # Get connection status
POST   /instance/id/:id/restart     # Restart instance
POST   /instance/id/:id/logout      # Logout instance

GET    /instance/id/:id/advanced-settings    # Get advanced settings
PUT    /instance/id/:id/advanced-settings    # Update advanced settings
```

### Chat Management
```typescript
GET    /chat/findChats/:instanceName         # List chats
GET    /chat/findMessages/:instanceName      # Get messages
POST   /chat/sendText/:instanceName          # Send text message
POST   /chat/sendMedia/:instanceName         # Send media message
```

### Integration Endpoints
```typescript
# OpenAI
GET    /openai/find/:instanceName
POST   /openai/create/:instanceName
PUT    /openai/update/:id/:instanceName
DELETE /openai/delete/:id/:instanceName

# Typebot
GET    /typebot/find/:instanceName
POST   /typebot/create/:instanceName
PUT    /typebot/update/:id/:instanceName
DELETE /typebot/delete/:id/:instanceName

# And similar patterns for all integrations...
```

### Event Integrations
```typescript
# Webhook
GET    /webhook/find/:instanceName
POST   /webhook/create/:instanceName
PUT    /webhook/update/:id/:instanceName
DELETE /webhook/delete/:id/:instanceName

# WebSocket, RabbitMQ, SQS follow same pattern
```

## 🔧 Error Handling

### HTTP Error Responses
```typescript
// Standardized error response
interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

// Error handling in queries
const query = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  onError: (error: ApiError) => {
    if (error.status === 401) {
      // Redirect to login
      navigate('/login');
    } else {
      // Show toast notification
      toast.error(error.message);
    }
  }
});
```

### Loading States
```typescript
// Consistent loading UI
const { data, isLoading, error } = useQuery(queryKey, queryFn);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return <DataComponent data={data} />;
```

## 📊 Response Data Handling

### Data Transformation
```typescript
// Handle nested response structures
const fetchData = async () => {
  const response = await api.get('/endpoint');

  // Handle different response shapes
  const payload = response.data?.data ?? response.data;

  if (!payload) {
    throw new Error('No data received');
  }

  return payload;
};
```

### Type Safety
```typescript
// Strongly typed API responses
interface InstanceResponse {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  settings: InstanceSettings;
}

const { data } = useQuery<InstanceResponse>({
  queryKey: ['instance', id],
  queryFn: () => api.get(`/instance/${id}`).then(res => res.data)
});
```

## 🔄 Mutation Patterns

### Optimistic Updates
```typescript
const updateSettings = useMutation({
  mutationFn: (settings: Settings) =>
    api.put(`/instance/${id}/settings`, settings),

  onMutate: async (newSettings) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['instance', id]);

    // Snapshot previous value
    const previousSettings = queryClient.getQueryData(['instance', id]);

    // Optimistically update
    queryClient.setQueryData(['instance', id], newSettings);

    return { previousSettings };
  },

  onError: (err, newSettings, context) => {
    // Rollback on error
    queryClient.setQueryData(['instance', id], context?.previousSettings);
  },

  onSettled: () => {
    // Always refetch after mutation
    queryClient.invalidateQueries(['instance', id]);
  }
});
```

## 🌐 CORS & Security

### CORS Configuration
```typescript
// Backend CORS headers
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-ID
Access-Control-Allow-Credentials: true
```

### CSRF Protection
- **JWT-based**: No CSRF tokens needed
- **SameSite Cookies**: For refresh token storage (future enhancement)

## 📈 Performance Optimization

### Query Caching
- **Stale Time**: 5 minutes for most data
- **Garbage Collection**: 10 minutes
- **Background Refetch**: Enabled for critical data

### Bundle Splitting
- **Route-based**: Automatic code splitting
- **Vendor Chunks**: Separate third-party libraries
- **Dynamic Imports**: Lazy load heavy components

## 🧪 Testing Strategy

### API Mocking
```typescript
// MSW for API mocking in tests
import { rest } from 'msw';

const handlers = [
  rest.get('/api/instances', (req, res, ctx) => {
    return res(ctx.json(mockInstances));
  }),
];
```

### Integration Tests
- **Component Testing**: React Testing Library
- **API Testing**: Mock Service Worker
- **E2E Testing**: Playwright (future)