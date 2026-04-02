import { Navigate, createBrowserRouter, useParams } from "react-router-dom";

import ProtectedRoute from "@/components/providers/protected-route";
import PublicRoute from "@/components/providers/public-route";

import { InstanceLayout } from "@/layout/InstanceLayout";
import { MainLayout } from "@/layout/MainLayout";

import Dashboard from "@/pages/Dashboard";
import { CRM } from "@/pages/CRM";
import { Broadcast } from "@/pages/Broadcast";
import { AISettings } from "@/pages/AISettings";
import { APIKeys } from "@/pages/APIKeys";
import { DashboardInstance } from "@/pages/instance/DashboardInstance";
import { Proxy } from "@/pages/instance/Proxy";
import { Rabbitmq } from "@/pages/instance/Rabbitmq";
import { Settings } from "@/pages/instance/Settings";
import { Webhook } from "@/pages/instance/Webhook";
import { Websocket } from "@/pages/instance/Websocket";
import Login from "@/pages/Login";
import Home from "@/pages/Home";

function RedirectToInstanceDashboard() {
  const { instanceId } = useParams<{ instanceId: string }>();

  return <Navigate to={instanceId ? `/manager/instance/${instanceId}/dashboard` : "/manager"} replace />;
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
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/chat/:remoteJid",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
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
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/openai/:botId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
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
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/chatwoot",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/typebot",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/typebot/:typebotId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/dify",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/dify/:difyId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/n8n",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/n8n/:n8nId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/evoai",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/evoai/:evoaiId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/evolutionBot",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/evolutionBot/:evolutionBotId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/flowise",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
        </InstanceLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/instance/:instanceId/flowise/:flowiseId",
    element: (
      <ProtectedRoute>
        <InstanceLayout>
          <RedirectToInstanceDashboard />
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
    element: <Navigate to="/manager" replace />,
  },
  {
    path: "/manager/embed-chat/:remoteJid",
    element: <Navigate to="/manager" replace />,
  },
]);

export default router;
