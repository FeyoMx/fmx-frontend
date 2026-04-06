import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "@/components/providers/protected-route";
import PublicRoute from "@/components/providers/public-route";
import { UnsupportedInstanceFeature } from "@/components/unsupported-instance-feature";
import { ChatShell } from "@/features/chat/ChatShell";

import { InstanceLayout } from "@/layout/InstanceLayout";
import { MainLayout } from "@/layout/MainLayout";

import Dashboard from "@/pages/Dashboard";
import { CRM } from "@/pages/CRM";
import { Broadcast } from "@/pages/Broadcast";
import { AISettings } from "@/pages/AISettings";
import { APIKeys } from "@/pages/APIKeys";
import { DashboardInstance } from "@/pages/instance/DashboardInstance";
import { EmbedChat } from "@/pages/instance/EmbedChat";
import { Proxy } from "@/pages/instance/Proxy";
import { Rabbitmq } from "@/pages/instance/Rabbitmq";
import { Settings } from "@/pages/instance/Settings";
import { Webhook } from "@/pages/instance/Webhook";
import { Websocket } from "@/pages/instance/Websocket";
import Login from "@/pages/Login";
import Home from "@/pages/Home";

function InstancePlaceholderRoute({ title, description }: { title: string; description: string }) {
  return (
    <UnsupportedInstanceFeature
      title={title}
      description={description}
    />
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/manager/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: "/manager/",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/contacts",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <CRM />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/broadcast",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Broadcast />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/ai-settings",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AISettings />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/api-keys",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <APIKeys />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/dashboard",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <DashboardInstance />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/chat",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <ChatShell />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/chat/:remoteJid",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <ChatShell />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/settings",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <Settings />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/openai",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="OpenAI integration is gated"
            description="The backend registers tenant-safe OpenAI routes but they currently return structured 501 partial responses, so the legacy CRUD surface remains intentionally unavailable."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/openai/:botId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="OpenAI resource editor is gated"
            description="The current backend does not provide tenant-ready OpenAI resource CRUD yet, so this deep link stays on the shared unsupported placeholder."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/webhook",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <Webhook />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/websocket",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <Websocket />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/rabbitmq",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <Rabbitmq />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/sqs",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="SQS connector not available yet"
            description="The current backend exposes tenant-safe SQS routes only as explicit 501 partial placeholders, so this page remains gated instead of pretending the connector works."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/chatwoot",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="Chatwoot integration is gated"
            description="Chatwoot configuration is still backend-partial in the SaaS layer, so this route now resolves to an honest placeholder rather than bouncing users away silently."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/typebot",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="Typebot integration is gated"
            description="The current backend still returns 501 partial responses for tenant-safe Typebot management, so this route remains intentionally unavailable."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/typebot/:typebotId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="Typebot resource editor is gated"
            description="This deep link is preserved for parity with upstream page surface, but tenant-safe Typebot resource CRUD is not backend-ready yet."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/dify",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="Dify integration is gated"
            description="Dify management remains a backend-partial surface today, so the frontend keeps a guarded placeholder instead of reviving unsupported legacy CRUD."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/dify/:difyId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="Dify resource editor is gated"
            description="This route is preserved for compatibility, but tenant-safe Dify resource management is not implemented in the current backend."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/n8n",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="N8N integration is gated"
            description="The backend still exposes N8N as an explicit partial surface, so the frontend keeps this route on a shared unsupported state."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/n8n/:n8nId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="N8N resource editor is gated"
            description="Tenant-safe N8N resource CRUD is not backend-complete yet, so this page remains a guarded placeholder."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/evoai",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="EvoAI integration is gated"
            description="EvoAI still depends on backend-partial integration routes, so this page stays disabled rather than reviving unsupported legacy behavior."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/evoai/:evoaiId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="EvoAI resource editor is gated"
            description="This deep link is preserved, but the SaaS backend does not yet support tenant-safe EvoAI resource management."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/evolutionBot",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="Evolution Bot integration is gated"
            description="The current backend still reports Evolution Bot management as partial, so the frontend keeps an honest unsupported state here."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/evolutionBot/:evolutionBotId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="Evolution Bot resource editor is gated"
            description="Tenant-safe CRUD for Evolution Bot resources is not backend-ready, so this route remains a placeholder."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/flowise",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="Flowise integration is gated"
            description="Flowise management is still served as a backend-partial surface, so this page is intentionally gated in the SaaS frontend."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/flowise/:flowiseId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <InstancePlaceholderRoute
            title="Flowise resource editor is gated"
            description="This deep link now resolves to a guarded placeholder because tenant-safe Flowise resource CRUD is not implemented yet."
          />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/proxy",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <Proxy />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/embed-chat",
    element: (
      <ProtectedRoute>
        <EmbedChat />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/embed-chat/:remoteJid",
    element: (
      <ProtectedRoute>
        <EmbedChat />
      </ProtectedRoute>
    ),
  },
]);

export default router;
