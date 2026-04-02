# Frontend Pages & Features

## 🏠 Public Pages

### Home Page (`/`)
- **Purpose**: Landing page with project information
- **Features**: Hero section, feature highlights, navigation
- **Components**: Static content, call-to-action buttons

### Login Page (`/manager/login`)
- **Purpose**: User authentication
- **Features**:
  - Email/password form
  - JWT token acquisition
  - Tenant context initialization
  - Error handling and loading states
- **Integration**: POST `/auth/login` endpoint

## 🔒 Protected Pages

### Dashboard (`/manager/`)
- **Purpose**: Main dashboard with instance overview
- **Features**:
  - Instance list with status indicators
  - Quick actions (connect, disconnect, restart)
  - Real-time status updates via WebSocket
  - Metrics cards (total instances, messages, AI usage)
- **API Endpoints**:
  - GET `/instance` - List instances
  - POST `/instance/id/{id}/connect` - Connect instance
  - POST `/instance/id/{id}/disconnect` - Disconnect instance

## 👥 Management Pages

### CRM/Contacts (`/manager/contacts`)
- **Purpose**: Contact management system
- **Features**:
  - Contact list with search and filtering
  - Add/edit/delete contacts
  - Import/export functionality (placeholder)
- **Status**: UI implemented, backend integration pending
- **API Endpoints**: TBD (backend not yet implemented)

### Broadcast (`/manager/broadcast`)
- **Purpose**: Bulk messaging campaigns
- **Features**:
  - Campaign creation and management
  - Message templates
  - Scheduling and targeting
- **Status**: UI implemented, backend integration pending
- **API Endpoints**: TBD (backend not yet implemented)

### AI Settings (`/manager/ai-settings`)
- **Purpose**: Global AI configuration
- **Features**:
  - AI provider selection
  - Model configuration
  - Usage limits and billing
- **Status**: UI implemented, backend integration pending
- **API Endpoints**: TBD (backend not yet implemented)

### API Keys (`/manager/api-keys`)
- **Purpose**: API key management
- **Features**:
  - Key generation and listing
  - Permission scopes
  - Key revocation
- **Status**: UI implemented, backend integration pending
- **API Endpoints**: TBD (backend not yet implemented)

## 📱 Instance-Specific Pages

### Instance Dashboard (`/manager/instance/:instanceId/dashboard`)
- **Purpose**: Instance overview and management
- **Features**:
  - QR code display for WhatsApp connection
  - Real-time connection status
  - Instance information display
  - Quick action buttons
- **API Endpoints**:
  - GET `/instance/id/{id}/qrcode` - QR code generation
  - GET `/instance/id/{id}/status` - Connection status

### Settings (`/manager/instance/:instanceId/settings`)
- **Purpose**: Instance configuration
- **Features**:
  - Advanced settings toggles
  - Message rejection configuration
  - Group/status filtering options
- **API Endpoints**:
  - GET `/instance/id/{id}/advanced-settings` - Load settings
  - PUT `/instance/id/{id}/advanced-settings` - Save settings
- **Supported Settings**:
  - `alwaysOnline`: boolean
  - `rejectCall`: boolean
  - `msgRejectCall`: string
  - `readMessages`: boolean
  - `ignoreGroups`: boolean
  - `ignoreStatus`: boolean

### Chat Interface (`/manager/instance/:instanceId/chat`)
- **Purpose**: WhatsApp chat management
- **Features**:
  - Contact and group chat lists
  - Message history with media support
  - Real-time message sending/receiving
  - Message status indicators
- **API Endpoints**:
  - GET `/chat/findChats/{instanceName}` - Chat list
  - GET `/chat/findMessages/{instanceName}` - Message history
  - POST `/chat/sendText/{instanceName}` - Send messages

## 🤖 Integration Pages

### OpenAI (`/manager/instance/:instanceId/openai`)
- **Purpose**: OpenAI chatbot configuration
- **Features**:
  - Bot creation and management
  - API key configuration
  - Model selection and parameters
- **API Endpoints**:
  - GET `/openai/find/{instanceName}` - List bots
  - POST `/openai/create/{instanceName}` - Create bot
  - PUT `/openai/update/{id}/{instanceName}` - Update bot

### Typebot (`/manager/instance/:instanceId/typebot`)
- **Purpose**: Typebot integration
- **Features**:
  - Flow management and configuration
  - Webhook URL setup
- **API Endpoints**:
  - GET `/typebot/find/{instanceName}` - List flows
  - POST `/typebot/create/{instanceName}` - Create flow

### Dify (`/manager/instance/:instanceId/dify`)
- **Purpose**: Dify AI workflow integration
- **Features**:
  - Workflow configuration
  - API endpoint management
- **API Endpoints**:
  - GET `/dify/find/{instanceName}` - List workflows
  - POST `/dify/create/{instanceName}` - Create workflow

### Flowise (`/manager/instance/:instanceId/flowise`)
- **Purpose**: Flowise chatbot integration
- **Features**:
  - Chatbot deployment and management
- **API Endpoints**:
  - GET `/flowise/find/{instanceName}` - List chatbots
  - POST `/flowise/create/{instanceName}` - Create chatbot

### N8N (`/manager/instance/:instanceId/n8n`)
- **Purpose**: N8N workflow automation
- **Features**:
  - Workflow triggers and actions
  - Session management
- **API Endpoints**:
  - GET `/n8n/find/{instanceName}` - List workflows
  - POST `/n8n/create/{instanceName}` - Create workflow

### Evolution Bot (`/manager/instance/:instanceId/evolutionBot`)
- **Purpose**: Built-in chatbot functionality
- **Features**:
  - Bot configuration and responses
- **API Endpoints**:
  - GET `/evolutionBot/find/{instanceName}` - List bots
  - POST `/evolutionBot/create/{instanceName}` - Create bot

### EvoAI (`/manager/instance/:instanceId/evoai`)
- **Purpose**: EvoAI integration
- **Features**:
  - AI model configuration
- **API Endpoints**:
  - GET `/evoai/find/{instanceName}` - List configurations
  - POST `/evoai/create/{instanceName}` - Create configuration

### Chatwoot (`/manager/instance/:instanceId/chatwoot`)
- **Purpose**: Chatwoot customer support integration
- **Features**:
  - Ticket management and routing
- **API Endpoints**:
  - GET `/chatwoot/find/{instanceName}` - List integrations
  - POST `/chatwoot/create/{instanceName}` - Create integration

## 📡 Event Integration Pages

### Webhook (`/manager/instance/:instanceId/webhook`)
- **Purpose**: HTTP webhook configuration
- **Features**:
  - Webhook URL management
  - Event filtering and transformation
- **API Endpoints**:
  - GET `/webhook/find/{instanceName}` - List webhooks
  - POST `/webhook/create/{instanceName}` - Create webhook

### WebSocket (`/manager/instance/:instanceId/websocket`)
- **Purpose**: Real-time WebSocket connections
- **Features**:
  - Connection management
  - Event streaming configuration
- **API Endpoints**:
  - GET `/websocket/find/{instanceName}` - List connections
  - POST `/websocket/create/{instanceName}` - Create connection

### RabbitMQ (`/manager/instance/:instanceId/rabbitmq`)
- **Purpose**: Message queue integration
- **Features**:
  - Queue configuration and routing
- **API Endpoints**:
  - GET `/rabbitmq/find/{instanceName}` - List configurations
  - POST `/rabbitmq/create/{instanceName}` - Create configuration

### SQS (`/manager/instance/:instanceId/sqs`)
- **Purpose**: Amazon SQS integration
- **Features**:
  - Queue management and messaging
- **API Endpoints**:
  - GET `/sqs/find/{instanceName}` - List configurations
  - POST `/sqs/create/{instanceName}` - Create configuration

### Proxy (`/manager/instance/:instanceId/proxy`)
- **Purpose**: Proxy configuration
- **Features**:
  - Proxy server setup and management
- **API Endpoints**:
  - GET `/proxy/find/{instanceName}` - List proxies
  - POST `/proxy/create/{instanceName}` - Create proxy

## 🎯 Page Status Summary

### ✅ Fully Implemented & Integrated
- Home, Login, Dashboard
- Instance Dashboard, Settings, Chat
- All integration pages (OpenAI, Typebot, Dify, etc.)

### 🚧 UI Implemented, Backend Pending
- CRM/Contacts
- Broadcast
- AI Settings
- API Keys

### 📝 Known Limitations
- Some integration pages may have incomplete backend endpoints
- Real-time features depend on WebSocket implementation
- File upload/media handling may need backend support