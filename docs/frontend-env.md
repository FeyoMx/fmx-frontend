# Frontend Environment Configuration

## 🔧 Required Environment Variables

### Core Configuration
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8080

# Optional: Enable debug mode
VITE_DEBUG=false
```

## 🌐 API Endpoints

### Base URL
- **Variable**: `VITE_API_BASE_URL`
- **Default**: `http://localhost:8080`
- **Description**: Backend API server URL
- **Required**: Yes

### Debug Mode
- **Variable**: `VITE_DEBUG`
- **Default**: `false`
- **Description**: Enable debug logging and development features
- **Required**: No

## 🔐 Authentication Configuration

### JWT Token Storage
- **Storage**: LocalStorage
- **Keys**:
  - `auth_token`: JWT access token
  - `refresh_token`: JWT refresh token
  - `tenant_id`: Current tenant identifier

### Token Refresh
- **Automatic**: Enabled on 401 responses
- **Endpoint**: POST `/auth/refresh`
- **Headers**: `Authorization: Bearer {refresh_token}`

## 🌍 Internationalization

### Supported Languages
- **Portuguese**: `pt-BR`
- **English**: `en-US` (default)
- **Spanish**: `es-ES`
- **French**: `fr-FR`

### Language Detection
- **Priority**: LocalStorage > Browser > Default (en-US)
- **Storage Key**: `i18nextLng`

## 🎨 Theme Configuration

### Theme Modes
- **Light**: Default light theme
- **Dark**: Dark theme
- **System**: Follows OS preference

### Theme Storage
- **Key**: `theme`
- **Values**: `light`, `dark`, `system`

## 📱 Responsive Breakpoints

### CSS Variables
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

## 🚀 Build Configuration

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  base: '/',
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

## 🐳 Docker Configuration

### Environment Variables in Docker
```dockerfile
# Dockerfile
ENV VITE_API_BASE_URL=http://api:8080
ENV VITE_DEBUG=false
```

### Docker Compose
```yaml
# docker-compose.yml
services:
  frontend:
    environment:
      - VITE_API_BASE_URL=http://api:8080
      - VITE_DEBUG=false
```

## 🔍 Development Environment

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server
- **Port**: 5173
- **Host**: 0.0.0.0 (accessible from network)
- **Hot Reload**: Enabled
- **TypeScript**: Real-time checking

## 🧪 Testing Configuration

### Test Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_DEBUG=true
```

## 📊 Monitoring & Analytics

### Error Tracking
- **Console Logging**: Enabled in development
- **Error Boundaries**: React error boundaries implemented
- **Toast Notifications**: User-friendly error messages

### Performance Monitoring
- **Bundle Analyzer**: `npm run build` generates stats
- **Lighthouse**: Performance auditing available

## 🔒 Security Considerations

### Environment Variables
- **Prefix**: All client-side env vars must be prefixed with `VITE_`
- **Exposure**: Public environment variables are embedded in the bundle
- **Secrets**: Never store secrets in client-side environment variables

### CORS Configuration
- **Development**: Configured for localhost origins
- **Production**: Must be configured on the backend

## 🌐 CDN & Asset Configuration

### Static Assets
- **Base Path**: `/`
- **Asset Optimization**: Vite handles optimization automatically
- **Image Optimization**: Lazy loading and responsive images

### External Services
- **No external CDNs**: All assets bundled locally
- **Font Loading**: System fonts preferred, web fonts lazy-loaded