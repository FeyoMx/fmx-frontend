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
            title="Integración OpenAI en proceso"
            description="La configuración general de IA está disponible en Ajustes de IA. Este editor por instancia no está disponible en esta versión."
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
            title="Editor OpenAI no disponible"
            description="Este acceso se conserva para compatibilidad, pero la gestión de recursos OpenAI por instancia no está disponible en esta versión."
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
            title="Conector SQS en proceso"
            description="SQS no está disponible para operación diaria en esta versión. Usa Webhook, WebSocket, RabbitMQ o Proxy cuando estén activos para tu instancia."
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
            title="Chatwoot en proceso"
            description="La integración de Chatwoot no está disponible en esta versión. Este enlace queda seguro para accesos antiguos."
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
            title="Typebot en proceso"
            description="La gestión de Typebot por instancia no está disponible en esta versión."
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
            title="Editor Typebot no disponible"
            description="Este acceso directo se conserva, pero la edición de recursos Typebot no está disponible en esta versión."
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
            title="Dify en proceso"
            description="La gestión de Dify por instancia no está disponible en esta versión."
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
            title="Editor Dify no disponible"
            description="Este acceso directo se conserva, pero la edición de recursos Dify no está disponible en esta versión."
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
            title="N8N en proceso"
            description="La gestión de N8N por instancia no está disponible en esta versión."
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
            title="Editor N8N no disponible"
            description="Este acceso directo se conserva, pero la edición de recursos N8N no está disponible en esta versión."
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
            title="EvoAI en proceso"
            description="La gestión de EvoAI por instancia no está disponible en esta versión."
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
            title="Editor EvoAI no disponible"
            description="Este acceso directo se conserva, pero la edición de recursos EvoAI no está disponible en esta versión."
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
            title="Evolution Bot en proceso"
            description="La gestión de Evolution Bot por instancia no está disponible en esta versión."
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
            title="Editor Evolution Bot no disponible"
            description="Este acceso directo se conserva, pero la edición de recursos Evolution Bot no está disponible en esta versión."
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
            title="Flowise en proceso"
            description="La gestión de Flowise por instancia no está disponible en esta versión."
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
            title="Editor Flowise no disponible"
            description="Este acceso directo se conserva, pero la edición de recursos Flowise no está disponible en esta versión."
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
            title="Chat embebido anterior no disponible"
            description="Para conversaciones usa Chat dentro de cada instancia. Este acceso anterior queda cerrado para evitar flujos fuera del MVP."
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
            title="Enlace de mensajes anterior no disponible"
            description="Abre Chat desde el panel de una instancia para usar el flujo de conversaciones disponible."
          />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
]);

export default router;
