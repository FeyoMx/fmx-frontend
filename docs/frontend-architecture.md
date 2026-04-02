# Frontend Architecture

## 📁 Application Structure

```
src/
├── components/           # Reusable UI components
│   ├── providers/       # Route protection providers
│   ├── ui/             # Shadcn/ui components
│   └── [component].tsx  # Individual components
├── contexts/           # React context providers
├── layout/             # Layout components
├── lib/                # Utilities and services
│   ├── auth.ts         # JWT token management
│   ├── queries/        # API service layer
│   └── utils.ts        # Helper functions
├── pages/              # Page components
│   ├── instance/       # Instance-specific pages
│   └── [page].tsx      # Main pages
├── routes/             # Route definitions
├── services/           # WebSocket services
├── translate/          # i18n translations
└── types/              # TypeScript definitions
```

## 🏗️ Tech Stack

- **Framework**: React 18.3.1 with TypeScript 5.2.2
- **Build Tool**: Vite 5.3.4
- **UI Library**: Radix UI + Tailwind CSS 3.4.1
- **State Management**: React Context + TanStack Query
- **Routing**: React Router 6.22.3
- **HTTP Client**: Axios 1.6.7
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: react-i18next

## 🔐 Authentication & Authorization

### JWT Token Management
- **Storage**: LocalStorage with secure token handling
- **Refresh**: Automatic token refresh on 401 responses
- **Tenant Context**: Multi-tenant support with X-Tenant-ID header

### Route Protection
- **ProtectedRoute**: Requires authentication for dashboard access
- **PublicRoute**: Redirects authenticated users away from login

## 📡 API Integration

### HTTP Clients
- **api**: Legacy instance-scoped requests (apikey header)
- **apiGlobal**: Modern tenant-scoped requests (JWT + tenant headers)

### Data Fetching
- **TanStack Query**: Server state management with caching
- **Mutations**: Optimistic updates with rollback on error
- **Error Handling**: Toast notifications for user feedback

## 🎨 UI/UX Architecture

### Component Library
- **Shadcn/ui**: Consistent design system
- **Responsive**: Mobile-first approach
- **Themes**: Dark/light mode with system preference detection

### Layout System
- **MainLayout**: Dashboard layout with sidebar navigation
- **InstanceLayout**: Instance-specific layout with breadcrumbs

## 🌐 Internationalization

### Supported Languages
- Portuguese (pt-BR)
- English (en-US)
- Spanish (es-ES)
- French (fr-FR)

### Translation Structure
```
src/translate/
├── i18n.ts              # i18n configuration
└── languages/
    ├── en-US.json
    ├── es-ES.json
    ├── fr-FR.json
    └── pt-BR.json
```

## 🔄 State Management

### Global State
- **TenantContext**: User and tenant information
- **InstanceContext**: Current instance data

### Server State
- **TanStack Query**: API data caching and synchronization
- **WebSocket**: Real-time updates for chat and instance status

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Layout Patterns
- **Sidebar**: Collapsible navigation for desktop
- **Mobile Menu**: Drawer-based navigation
- **Grid System**: Responsive card layouts

## 🚀 Performance Optimizations

### Code Splitting
- **Route-based**: Automatic code splitting per route
- **Component Lazy Loading**: Dynamic imports for heavy components

### Caching Strategy
- **API Responses**: TanStack Query caching with stale-while-revalidate
- **Images**: Optimized loading with lazy loading
- **Bundle**: Vite's optimized chunk splitting

## 🧪 Development Workflow

### Scripts
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "type-check": "tsc --noEmit",
  "lint": "eslint ./src/**/*.{ts,tsx} --ext .ts,.tsx --fix",
  "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
}
```

### Development Server
- **Hot Reload**: Fast development with Vite
- **Type Checking**: Real-time TypeScript validation
- **ESLint**: Code quality enforcement

## 🐳 Deployment

### Docker Support
- **Multi-stage builds**: Optimized production images
- **Nginx**: Static file serving
- **Environment**: Configurable via environment variables

### Build Output
- **Static Assets**: Optimized bundles in `/dist`
- **SPA Routing**: Client-side routing with history API fallback