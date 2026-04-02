# Backend Gap Report For Instance UI

## Scope
- Source of truth: current backend route registry in `../fmxevolution-go/internal/server/server.go`
- This report only covers frontend instance/integration pages that are still unsupported by the current backend
- Supported instance pages such as dashboard, settings, and webhook are intentionally excluded

## Summary
The current frontend still contains legacy instance UI contracts that expect instance-name and `apikey` based routes. The current backend `cmd/api` does not register those routes, so these pages cannot function without new backend capabilities or a new instance-scoped SaaS contract.

## Unsupported Frontend Pages
- `/manager/instance/:instanceId/chat`
- `/manager/instance/:instanceId/chat/:remoteJid`
- `/manager/embed-chat`
- `/manager/embed-chat/:remoteJid`
- `/manager/instance/:instanceId/websocket`
- `/manager/instance/:instanceId/rabbitmq`
- `/manager/instance/:instanceId/sqs`
- `/manager/instance/:instanceId/proxy`
- `/manager/instance/:instanceId/chatwoot`
- `/manager/instance/:instanceId/openai`
- `/manager/instance/:instanceId/openai/:botId`
- `/manager/instance/:instanceId/typebot`
- `/manager/instance/:instanceId/typebot/:typebotId`
- `/manager/instance/:instanceId/dify`
- `/manager/instance/:instanceId/dify/:difyId`
- `/manager/instance/:instanceId/n8n`
- `/manager/instance/:instanceId/n8n/:n8nId`
- `/manager/instance/:instanceId/evoai`
- `/manager/instance/:instanceId/evoai/:evoaiId`
- `/manager/instance/:instanceId/evolutionBot`
- `/manager/instance/:instanceId/evolutionBot/:evolutionBotId`
- `/manager/instance/:instanceId/flowise`
- `/manager/instance/:instanceId/flowise/:flowiseId`

## Frontend References
- Route registration and guarded placeholders:
  - `src/routes/index.tsx`
- Instance sidebar/navigation:
  - `src/components/sidebar.tsx`
- Legacy query modules still defining the unsupported contracts:
  - `src/lib/queries/chat/*`
  - `src/lib/queries/websocket/*`
  - `src/lib/queries/rabbitmq/*`
  - `src/lib/queries/sqs/*`
  - `src/lib/queries/proxy/*`
  - `src/lib/queries/chatwoot/*`
  - `src/lib/queries/openai/*`
  - `src/lib/queries/typebot/*`
  - `src/lib/queries/dify/*`
  - `src/lib/queries/n8n/*`
  - `src/lib/queries/evoai/*`
  - `src/lib/queries/evolutionBot/*`
  - `src/lib/queries/flowise/*`
- Legacy embedded chat implementation:
  - `src/pages/instance/EmbedChat/*`
  - `src/pages/instance/EmbedChatMessage/*`

## Gaps By Feature

### 1. Chat UI
- Frontend pages:
  - `/manager/instance/:instanceId/chat`
  - `/manager/instance/:instanceId/chat/:remoteJid`
  - `/manager/embed-chat`
  - `/manager/embed-chat/:remoteJid`
- Required backend capabilities:
  - `POST /chat/findChats/:instanceName`
    - Request shape: `{ "where": {} }`
    - Response shape: `Chat[]`
    - `Chat`: `{ id, pushName, remoteJid, labels, profilePicUrl, createdAt, updatedAt, instanceId }`
  - `POST /chat/findMessages/:instanceName`
    - Request shape: `{ "where": { "key": { "remoteJid": "<jid>" } } }`
    - Response shape: either `Message[]` or `{ messages: { records: Message[] } }`
    - `Message`: `{ id, key, pushName, messageType, message, messageTimestamp, instanceId, source }`
  - `POST /message/sendText/:instanceName`
    - Request shape: `{ number, text, options? }`
  - `POST /message/sendMedia/:instanceName`
    - Request shape: `{ number, mediaMessage, options? }`
  - `POST /message/sendWhatsAppAudio/:instanceName`
    - Request shape: `{ number, audioMessage, options? }`
  - Optional embedded lookup flow for legacy public embed:
    - `GET /instance?instanceName=<name>`
    - Response shape: `Instance[]`
- Why current UI cannot support it:
  - None of the `/chat/*` or `/message/*` routes are registered in the current backend
  - The embed flow also depends on legacy public instance lookup by name plus instance-token auth, which is outside the current SaaS contract

### 2. Event Connector Config Pages

#### 2.1 WebSocket
- Frontend page: `/manager/instance/:instanceId/websocket`
- Required backend capabilities:
  - `GET /websocket/find/:instanceName`
    - Response shape: `Websocket`
    - `Websocket`: `{ id?, enabled, events: string[] }`
  - `POST /websocket/set/:instanceName`
    - Request shape: `{ "websocket": { enabled, events } }`
    - Response shape: saved `Websocket` or success envelope containing equivalent data
- Why current UI cannot support it:
  - The backend has no `/websocket/*` routes in the active server

#### 2.2 RabbitMQ
- Frontend page: `/manager/instance/:instanceId/rabbitmq`
- Required backend capabilities:
  - `GET /rabbitmq/find/:instanceName`
    - Response shape: `Rabbitmq`
    - `Rabbitmq`: `{ id?, enabled, events: string[] }`
  - `POST /rabbitmq/set/:instanceName`
    - Request shape: `{ "rabbitmq": { enabled, events } }`
    - Response shape: saved `Rabbitmq` or success envelope
- Why current UI cannot support it:
  - The backend has no `/rabbitmq/*` routes in the active server

#### 2.3 SQS
- Frontend page: `/manager/instance/:instanceId/sqs`
- Required backend capabilities:
  - `GET /sqs/find/:instanceName`
    - Response shape: `Sqs`
    - `Sqs`: `{ id?, enabled, events: string[] }`
  - `POST /sqs/set/:instanceName`
    - Request shape: `{ "sqs": { enabled, events } }`
    - Response shape: saved `Sqs` or success envelope
- Why current UI cannot support it:
  - The backend has no `/sqs/*` routes in the active server

### 3. Proxy Page
- Frontend page: `/manager/instance/:instanceId/proxy`
- Required backend capabilities:
  - `GET /proxy/find/:instanceName`
    - Response shape: `Proxy`
    - `Proxy`: `{ id?, enabled, host, port, protocol, username?, password? }`
  - `POST /proxy/set/:instanceName`
    - Request shape: `Proxy`
    - Response shape: saved `Proxy` or success envelope
- Why current UI cannot support it:
  - The backend has no `/proxy/*` routes in the active server

### 4. Chatwoot Page
- Frontend page: `/manager/instance/:instanceId/chatwoot`
- Required backend capabilities:
  - `GET /chatwoot/find/:instanceName`
    - Response shape: `Chatwoot`
  - `POST /chatwoot/set/:instanceName`
    - Request shape: `Chatwoot`
    - `Chatwoot`: `{ enabled, accountId, token, url, signMsg, reopenConversation, conversationPending, nameInbox, mergeBrazilContacts, importContacts, importMessages, daysLimitImportMessages, signDelimiter, autoCreate, organization, logo, ignoreJids? }`
    - Response shape: saved `Chatwoot` or success envelope
- Why current UI cannot support it:
  - The backend has no `/chatwoot/*` routes in the active server

### 5. OpenAI Page
- Frontend pages:
  - `/manager/instance/:instanceId/openai`
  - `/manager/instance/:instanceId/openai/:botId`
- Required backend capabilities:
  - Credentials:
    - `GET /openai/creds/:instanceName`
      - Response shape: `OpenaiCreds[]`
    - `POST /openai/creds/:instanceName`
      - Request shape: `{ name, apiKey }`
      - Response shape: saved `OpenaiCreds`
    - `DELETE /openai/creds/:openaiCredsId/:instanceName`
  - Bot CRUD:
    - `GET /openai/find/:instanceName`
      - Response shape: `Openai[]`
    - `GET /openai/fetch/:openaiId/:instanceName`
      - Response shape: `Openai`
    - `POST /openai/create/:instanceName`
      - Request shape: `Openai`
    - `PUT /openai/update/:openaiId/:instanceName`
      - Request shape: `Openai`
    - `DELETE /openai/delete/:openaiId/:instanceName`
  - Settings and runtime:
    - `GET /openai/fetchSettings/:instanceName`
      - Response shape: `OpenaiSettings`
    - `POST /openai/settings/:instanceName`
      - Request shape: `OpenaiSettings`
    - `GET /openai/fetchSessions/:openaiId/:instanceName`
      - Response shape: `IntegrationSession[]`
    - `POST /openai/changeStatus/:instanceName`
      - Request shape: `{ remoteJid, status }`
    - `GET /openai/getModels/:instanceName`
      - Response shape: `ModelOpenai[]`
- Why current UI cannot support it:
  - The backend has no `/openai/*` routes in the active server
  - The page expects a full credentials + bot + settings + sessions contract, not just tenant-level AI settings

### 6. Typebot Page
- Frontend pages:
  - `/manager/instance/:instanceId/typebot`
  - `/manager/instance/:instanceId/typebot/:typebotId`
- Required backend capabilities:
  - `GET /typebot/find/:instanceName` -> `Typebot[]`
  - `GET /typebot/fetch/:typebotId/:instanceName` -> `Typebot`
  - `POST /typebot/create/:instanceName`
    - Request shape: `Typebot`
  - `PUT /typebot/update/:typebotId/:instanceName`
    - Request shape: `Typebot`
  - `DELETE /typebot/delete/:typebotId/:instanceName`
  - `GET /typebot/fetchSettings/:instanceName` -> `TypebotSettings`
  - `POST /typebot/settings/:instanceName`
    - Request shape: `TypebotSettings`
  - `GET /typebot/fetchSessions/:typebotId/:instanceName` -> `IntegrationSession[]`
  - `POST /typebot/changeStatus/:instanceName`
    - Request shape: `{ remoteJid, status }`
- `Typebot` request shape: `{ enabled, description, url, typebot, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - The backend has no `/typebot/*` routes in the active server

### 7. Dify Page
- Frontend pages:
  - `/manager/instance/:instanceId/dify`
  - `/manager/instance/:instanceId/dify/:difyId`
- Required backend capabilities:
  - `GET /dify/find/:instanceName` -> `Dify[]`
  - `GET /dify/fetch/:difyId/:instanceName` -> `Dify`
  - `POST /dify/create/:instanceName`
    - Request shape: `Dify`
  - `PUT /dify/update/:difyId/:instanceName`
    - Request shape: `Dify`
  - `DELETE /dify/delete/:difyId/:instanceName`
  - `GET /dify/fetchSettings/:instanceName` -> `DifySettings`
  - `POST /dify/settings/:instanceName`
    - Request shape: `DifySettings`
  - `GET /dify/fetchSessions/:difyId/:instanceName` -> `IntegrationSession[]`
  - `POST /dify/changeStatus/:instanceName`
    - Request shape: `{ remoteJid, status }`
- `Dify` request shape: `{ enabled, description, botType, apiUrl, apiKey, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - The backend has no `/dify/*` routes in the active server

### 8. N8N Page
- Frontend pages:
  - `/manager/instance/:instanceId/n8n`
  - `/manager/instance/:instanceId/n8n/:n8nId`
- Required backend capabilities:
  - `GET /n8n/find/:instanceName` -> `N8n[]`
  - `GET /n8n/fetch/:n8nId/:instanceName` -> `N8n`
  - `POST /n8n/create/:instanceName`
    - Request shape: `N8n`
  - `PUT /n8n/update/:n8nId/:instanceName`
    - Request shape: `N8n`
  - `DELETE /n8n/delete/:n8nId/:instanceName`
  - `GET /instance/:instanceName/settings`
    - Response shape: default settings compatible with `N8nSettings`
  - `POST /n8n/settings/:instanceName`
    - Request shape: `N8nSettings`
  - `GET /n8n/fetchSessions/:n8nId/:instanceName` -> `IntegrationSession[]`
  - `POST /n8n/changeStatus/:instanceName`
    - Request shape: `{ remoteJid, status }`
- `N8n` request shape: `{ enabled, description, webhookUrl, basicAuthUser, basicAuthPass, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - The backend has no `/n8n/*` routes in the active server
  - The settings read path expected by the frontend is also legacy and not part of the current backend contract

### 9. EvoAI Page
- Frontend pages:
  - `/manager/instance/:instanceId/evoai`
  - `/manager/instance/:instanceId/evoai/:evoaiId`
- Required backend capabilities:
  - `GET /evoai/find/:instanceName` -> `Evoai[]`
  - `GET /evoai/fetch/:evoaiId/:instanceName` -> `Evoai`
  - `POST /evoai/create/:instanceName`
    - Request shape: `Evoai`
  - `PUT /evoai/update/:evoaiId/:instanceName`
    - Request shape: `Evoai`
  - `DELETE /evoai/delete/:evoaiId/:instanceName`
  - `GET /evoai/fetchSettings/:instanceName` -> `EvoaiSettings`
  - `POST /evoai/settings/:instanceName`
    - Request shape: `EvoaiSettings`
  - `GET /evoai/fetchSessions/:evoaiId/:instanceName` -> `IntegrationSession[]`
  - `POST /evoai/changeStatus/:instanceName`
    - Request shape: `{ remoteJid, status }`
- `Evoai` request shape: `{ enabled, description, agentUrl, apiKey, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - The backend has no `/evoai/*` routes in the active server

### 10. Evolution Bot Page
- Frontend pages:
  - `/manager/instance/:instanceId/evolutionBot`
  - `/manager/instance/:instanceId/evolutionBot/:evolutionBotId`
- Required backend capabilities:
  - `GET /evolutionBot/find/:instanceName` -> `EvolutionBot[]`
  - `GET /evolutionBot/fetch/:evolutionBotId/:instanceName` -> `EvolutionBot`
  - `POST /evolutionBot/create/:instanceName`
    - Request shape: `EvolutionBot`
  - `PUT /evolutionBot/update/:evolutionBotId/:instanceName`
    - Request shape: `EvolutionBot`
  - `DELETE /evolutionBot/delete/:evolutionBotId/:instanceName`
  - `GET /evolutionBot/fetchSettings/:instanceName` -> `EvolutionBotSettings`
  - `POST /evolutionBot/settings/:instanceName`
    - Request shape: `EvolutionBotSettings`
  - `GET /evolutionBot/fetchSessions/:evolutionBotId/:instanceName` -> `IntegrationSession[]`
  - `POST /evolutionBot/changeStatus/:instanceName`
    - Request shape: `{ remoteJid, status }`
- `EvolutionBot` request shape: `{ enabled, description, apiUrl, apiKey?, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - The backend has no `/evolutionBot/*` routes in the active server

### 11. Flowise Page
- Frontend pages:
  - `/manager/instance/:instanceId/flowise`
  - `/manager/instance/:instanceId/flowise/:flowiseId`
- Required backend capabilities:
  - `GET /flowise/find/:instanceName` -> `Flowise[]`
  - `GET /flowise/fetch/:flowiseId/:instanceName` -> `Flowise`
  - `POST /flowise/create/:instanceName`
    - Request shape: `Flowise`
  - `PUT /flowise/update/:flowiseId/:instanceName`
    - Request shape: `Flowise`
  - `DELETE /flowise/delete/:flowiseId/:instanceName`
  - `GET /flowise/fetchSettings/:instanceName` -> `FlowiseSettings`
  - `POST /flowise/settings/:instanceName`
    - Request shape: `FlowiseSettings`
  - `GET /flowise/fetchSessions/:flowiseId/:instanceName` -> `IntegrationSession[]`
  - `POST /flowise/changeStatus/:instanceName`
    - Request shape: `{ remoteJid, status }`
- `Flowise` request shape: `{ enabled, description, apiUrl, apiKey?, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - The backend has no `/flowise/*` routes in the active server

## Recommended Backend Shape
- If these features are brought back, prefer instance-ID SaaS routes instead of the old `:instanceName` paths
- Minimum recommendation:
  - `GET /instance/:id/<feature>`
  - `POST /instance/:id/<feature>`
  - `PUT /instance/:id/<feature>/:resourceId`
  - `DELETE /instance/:id/<feature>/:resourceId`
  - `GET /instance/:id/<feature>/settings`
  - `PUT /instance/:id/<feature>/settings`
  - `GET /instance/:id/<feature>/:resourceId/sessions`
  - `POST /instance/:id/<feature>/status`
- Keep auth on the current JWT tenant-scoped model instead of reviving instance-token-only endpoints
