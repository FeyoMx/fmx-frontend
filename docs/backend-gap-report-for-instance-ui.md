# Backend Gap Report For Instance UI

## Scope
- Source of truth: current backend route registry in `../fmxevolution-go/internal/server/server.go`
- This report only covers frontend instance/integration pages that are still unsupported by the current backend
- Supported instance pages such as dashboard, settings, and webhook are intentionally excluded

## Summary
The remaining unsupported instance UI falls into two buckets:
- chat and embed flows still depend on legacy instance-name contracts that the current backend does not expose
- `sqs`, `chatwoot`, `openai`, `typebot`, `dify`, `n8n`, `evoai`, `evolutionBot`, and `flowise` now have instance-ID SaaS routes registered, but those routes intentionally return `501 partial`

## Unsupported Frontend Pages
- `/manager/instance/:instanceId/chat`
- `/manager/instance/:instanceId/chat/:remoteJid`
- `/manager/embed-chat`
- `/manager/embed-chat/:remoteJid`
- `/manager/instance/:instanceId/sqs`
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
  - `src/lib/queries/sqs/*`
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
  - The current backend only exposes partial chat routes under `/instance/:id/chats/search`, `/instance/:id/messages/search`, `/instance/:id/messages/media`, and `/instance/:id/messages/audio`
  - Those instance-ID routes intentionally return `501 partial` for search/media/audio, and the old `/chat/*` plus `/message/*` routes are not registered
  - The embed flow also depends on legacy public instance lookup by name plus instance-token auth, which is outside the current SaaS contract

### 2. Event Connector Config Pages

#### 2.1 SQS
- Frontend page: `/manager/instance/:instanceId/sqs`
- Required backend capabilities:
  - `GET /instance/:id/sqs`
    - Response shape: `{ enabled, events }`
  - `PUT /instance/:id/sqs`
    - Request shape: `{ enabled, events }` or `{ sqs: { enabled, events } }`
    - Response shape: same
- Why current UI cannot support it:
  - The backend route now exists but intentionally returns `501 partial` because there is still no tenant-safe SQS configuration implementation

### 3. Chatwoot Page
- Frontend page: `/manager/instance/:instanceId/chatwoot`
- Required backend capabilities:
  - `GET /instance/:id/chatwoot`
    - Response shape: `Chatwoot`
  - `PUT /instance/:id/chatwoot`
    - Request shape: `Chatwoot`
    - `Chatwoot`: `{ enabled, accountId, token, url, signMsg, reopenConversation, conversationPending, nameInbox, mergeBrazilContacts, importContacts, importMessages, daysLimitImportMessages, signDelimiter, autoCreate, organization, logo, ignoreJids? }`
    - Response shape: saved `Chatwoot` or success envelope
- Why current UI cannot support it:
  - The backend route now exists but intentionally returns `501 partial`

### 4. OpenAI Page
- Frontend pages:
  - `/manager/instance/:instanceId/openai`
  - `/manager/instance/:instanceId/openai/:botId`
- Required backend capabilities:
  - Credentials:
    - `GET /instance/:id/openai`
      - Response shape: `Openai[]`
    - `POST /instance/:id/openai`
      - Request shape: `Openai`
      - Response shape: saved `Openai`
    - `GET /instance/:id/openai/:resourceId`
      - Response shape: `Openai`
    - `PUT /instance/:id/openai/:resourceId`
      - Request shape: `Openai`
    - `DELETE /instance/:id/openai/:resourceId`
  - Settings and runtime:
    - `GET /instance/:id/openai/settings`
      - Response shape: `OpenaiSettings`
    - `PUT /instance/:id/openai/settings`
      - Request shape: `OpenaiSettings`
    - `GET /instance/:id/openai/:resourceId/sessions`
      - Response shape: `IntegrationSession[]`
    - `POST /instance/:id/openai/status`
      - Request shape: `{ remoteJid, status }`
- Why current UI cannot support it:
  - These instance-ID routes are registered but intentionally return `501 partial`

### 5. Typebot Page
- Frontend pages:
  - `/manager/instance/:instanceId/typebot`
  - `/manager/instance/:instanceId/typebot/:typebotId`
- Required backend capabilities:
  - `GET /instance/:id/typebot` -> `Typebot[]`
  - `GET /instance/:id/typebot/:resourceId` -> `Typebot`
  - `POST /instance/:id/typebot`
    - Request shape: `Typebot`
  - `PUT /instance/:id/typebot/:resourceId`
    - Request shape: `Typebot`
  - `DELETE /instance/:id/typebot/:resourceId`
  - `GET /instance/:id/typebot/settings` -> `TypebotSettings`
  - `PUT /instance/:id/typebot/settings`
    - Request shape: `TypebotSettings`
  - `GET /instance/:id/typebot/:resourceId/sessions` -> `IntegrationSession[]`
  - `POST /instance/:id/typebot/status`
    - Request shape: `{ remoteJid, status }`
- `Typebot` request shape: `{ enabled, description, url, typebot, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - These instance-ID routes are registered but intentionally return `501 partial`

### 6. Dify Page
- Frontend pages:
  - `/manager/instance/:instanceId/dify`
  - `/manager/instance/:instanceId/dify/:difyId`
- Required backend capabilities:
  - `GET /instance/:id/dify` -> `Dify[]`
  - `GET /instance/:id/dify/:resourceId` -> `Dify`
  - `POST /instance/:id/dify`
    - Request shape: `Dify`
  - `PUT /instance/:id/dify/:resourceId`
    - Request shape: `Dify`
  - `DELETE /instance/:id/dify/:resourceId`
  - `GET /instance/:id/dify/settings` -> `DifySettings`
  - `PUT /instance/:id/dify/settings`
    - Request shape: `DifySettings`
  - `GET /instance/:id/dify/:resourceId/sessions` -> `IntegrationSession[]`
  - `POST /instance/:id/dify/status`
    - Request shape: `{ remoteJid, status }`
- `Dify` request shape: `{ enabled, description, botType, apiUrl, apiKey, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - These instance-ID routes are registered but intentionally return `501 partial`

### 7. N8N Page
- Frontend pages:
  - `/manager/instance/:instanceId/n8n`
  - `/manager/instance/:instanceId/n8n/:n8nId`
- Required backend capabilities:
  - `GET /instance/:id/n8n` -> `N8n[]`
  - `GET /instance/:id/n8n/:resourceId` -> `N8n`
  - `POST /instance/:id/n8n`
    - Request shape: `N8n`
  - `PUT /instance/:id/n8n/:resourceId`
    - Request shape: `N8n`
  - `DELETE /instance/:id/n8n/:resourceId`
  - `GET /instance/:id/n8n/settings` -> `N8nSettings`
  - `PUT /instance/:id/n8n/settings`
    - Request shape: `N8nSettings`
  - `GET /instance/:id/n8n/:resourceId/sessions` -> `IntegrationSession[]`
  - `POST /instance/:id/n8n/status`
    - Request shape: `{ remoteJid, status }`
- `N8n` request shape: `{ enabled, description, webhookUrl, basicAuthUser, basicAuthPass, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - These instance-ID routes are registered but intentionally return `501 partial`

### 8. EvoAI Page
- Frontend pages:
  - `/manager/instance/:instanceId/evoai`
  - `/manager/instance/:instanceId/evoai/:evoaiId`
- Required backend capabilities:
  - `GET /instance/:id/evoai` -> `Evoai[]`
  - `GET /instance/:id/evoai/:resourceId` -> `Evoai`
  - `POST /instance/:id/evoai`
    - Request shape: `Evoai`
  - `PUT /instance/:id/evoai/:resourceId`
    - Request shape: `Evoai`
  - `DELETE /instance/:id/evoai/:resourceId`
  - `GET /instance/:id/evoai/settings` -> `EvoaiSettings`
  - `PUT /instance/:id/evoai/settings`
    - Request shape: `EvoaiSettings`
  - `GET /instance/:id/evoai/:resourceId/sessions` -> `IntegrationSession[]`
  - `POST /instance/:id/evoai/status`
    - Request shape: `{ remoteJid, status }`
- `Evoai` request shape: `{ enabled, description, agentUrl, apiKey, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - These instance-ID routes are registered but intentionally return `501 partial`

### 9. Evolution Bot Page
- Frontend pages:
  - `/manager/instance/:instanceId/evolutionBot`
  - `/manager/instance/:instanceId/evolutionBot/:evolutionBotId`
- Required backend capabilities:
  - `GET /instance/:id/evolutionBot` -> `EvolutionBot[]`
  - `GET /instance/:id/evolutionBot/:resourceId` -> `EvolutionBot`
  - `POST /instance/:id/evolutionBot`
    - Request shape: `EvolutionBot`
  - `PUT /instance/:id/evolutionBot/:resourceId`
    - Request shape: `EvolutionBot`
  - `DELETE /instance/:id/evolutionBot/:resourceId`
  - `GET /instance/:id/evolutionBot/settings` -> `EvolutionBotSettings`
  - `PUT /instance/:id/evolutionBot/settings`
    - Request shape: `EvolutionBotSettings`
  - `GET /instance/:id/evolutionBot/:resourceId/sessions` -> `IntegrationSession[]`
  - `POST /instance/:id/evolutionBot/status`
    - Request shape: `{ remoteJid, status }`
- `EvolutionBot` request shape: `{ enabled, description, apiUrl, apiKey?, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - These instance-ID routes are registered but intentionally return `501 partial`

### 10. Flowise Page
- Frontend pages:
  - `/manager/instance/:instanceId/flowise`
  - `/manager/instance/:instanceId/flowise/:flowiseId`
- Required backend capabilities:
  - `GET /instance/:id/flowise` -> `Flowise[]`
  - `GET /instance/:id/flowise/:resourceId` -> `Flowise`
  - `POST /instance/:id/flowise`
    - Request shape: `Flowise`
  - `PUT /instance/:id/flowise/:resourceId`
    - Request shape: `Flowise`
  - `DELETE /instance/:id/flowise/:resourceId`
  - `GET /instance/:id/flowise/settings` -> `FlowiseSettings`
  - `PUT /instance/:id/flowise/settings`
    - Request shape: `FlowiseSettings`
  - `GET /instance/:id/flowise/:resourceId/sessions` -> `IntegrationSession[]`
  - `POST /instance/:id/flowise/status`
    - Request shape: `{ remoteJid, status }`
- `Flowise` request shape: `{ enabled, description, apiUrl, apiKey?, triggerType, triggerOperator, triggerValue, expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, debounceTime, ignoreJids?, splitMessages?, timePerChar? }`
- Why current UI cannot support it:
  - These instance-ID routes are registered but intentionally return `501 partial`

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
