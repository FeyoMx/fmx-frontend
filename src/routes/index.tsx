import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "@/components/providers/protected-route";
import PublicRoute from "@/components/providers/public-route";
import { RouteFallback } from "@/components/route-fallback";
import { UnsupportedInstanceFeature } from "@/components/unsupported-instance-feature";
import { InstanceLayout } from "@/layout/InstanceLayout";
import { MainLayout } from "@/layout/MainLayout";
import { APIKeys } from "@/pages/APIKeys";
import { CRM } from "@/pages/CRM";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import { Proxy } from "@/pages/instance/Proxy";
import { Rabbitmq } from "@/pages/instance/Rabbitmq";
import { Settings } from "@/pages/instance/Settings";
import { Webhook } from "@/pages/instance/Webhook";
import { Websocket } from "@/pages/instance/Websocket";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Broadcast = lazy(async () => import("@/pages/Broadcast").then((module) => ({ default: module.Broadcast })));
const AISettings = lazy(async () => import("@/pages/AISettings").then((module) => ({ default: module.AISettings })));
const DashboardInstance = lazy(async () => import("@/pages/instance/DashboardInstance").then((module) => ({ default: module.DashboardInstance })));
const ChatShell = lazy(async () => import("@/features/chat/ChatShell").then((module) => ({ default: module.ChatShell })));

function InstancePlaceholderRoute({ title, description }: { title: string; description: string }) {
  return <UnsupportedInstanceFeature title={title} description={description} />;
}

function withLazyBoundary(children: ReactNode, description?: string) {
  return <Suspense fallback={<RouteFallback description={description} />}>{children}</Suspense>;
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
          {withLazyBoundary(<Dashboard />, "Loading the dashboard status overview and operator cards.")}
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
          {withLazyBoundary(<Broadcast />, "Loading the broadcast queue view and job history.")}
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/ai-settings",
    element: (
      <ProtectedRoute>
        <MainLayout>
          {withLazyBoundary(<AISettings />, "Loading tenant AI settings and per-instance toggles.")}
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
          {withLazyBoundary(<DashboardInstance />, "Loading lifecycle controls, runtime observability, and instance actions.")}
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/chat",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          {withLazyBoundary(<ChatShell />, "Loading the tenant-safe chat shell and conversation composer.")}
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/chat/:remoteJid",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          {withLazyBoundary(<ChatShell />, "Loading the selected conversation and persisted thread history.")}
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
        <MainLayout>
          <InstancePlaceholderRoute
            title="Legacy embed chat is gated"
            description="The supported MVP operator flow now uses the tenant-safe chat list and conversation routes under each instance. This older embed chat surface still depends on legacy token and query-param contracts, so it remains intentionally unavailable."
          />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/embed-chat/:remoteJid",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <InstancePlaceholderRoute
            title="Legacy embed chat deep link is gated"
            description="This legacy messages deep link now resolves to an honest placeholder. Use the tenant-safe instance chat routes instead of the old embed chat contract."
          />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
]);

export default router;
