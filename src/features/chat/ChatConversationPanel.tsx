import { History, MessagesSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorEmptyState, OperatorStatusBadge } from "@/components/operator-surface";

import { getChatHistoryCapabilityMessage } from "@/lib/queries/chat/tenantChat";
import { ChatCapabilities, ChatHistoryMessage, ChatHistoryResponse, ChatThread } from "@/lib/queries/chat/types";
import { formatCompactTimestamp } from "@/lib/operator-format";

import { ChatCapabilityStatus } from "./ChatCapabilityStatus";
import { ChatComposer } from "./ChatComposer";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatMessageList } from "./ChatMessageList";

type ChatConversationPanelProps = {
  instanceId: string;
  activeThread: ChatThread | null;
  capabilities: ChatCapabilities;
  historyMessages: ChatHistoryResponse | undefined;
  historyLoading: boolean;
  historyError: unknown;
};

function ChatConversationPanel({
  instanceId,
  activeThread,
  capabilities,
  historyMessages,
  historyLoading,
  historyError,
}: ChatConversationPanelProps) {
  const [localMessages, setLocalMessages] = useState<ChatHistoryMessage[]>([]);
  const activeRemoteJid = activeThread?.remoteJid ?? "";

  useEffect(() => {
    setLocalMessages([]);
  }, [activeRemoteJid]);

  const mergedMessages = useMemo(() => {
    const source = historyMessages ?? [];
    const byId = new Map<string, ChatHistoryMessage>();

    source.forEach((message) => {
      byId.set(message.id, message);
    });

    localMessages.forEach((message) => {
      byId.set(message.id, message);
    });

    return Array.from(byId.values()).sort((left, right) => {
      const leftTime = left.timestamp ? new Date(left.timestamp).getTime() : 0;
      const rightTime = right.timestamp ? new Date(right.timestamp).getTime() : 0;
      return leftTime - rightTime;
    });
  }, [historyMessages, localMessages]);

  if (!activeThread) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChatCapabilityStatus capabilities={capabilities} />
          <OperatorEmptyState
            icon={MessagesSquare}
            title="Elige una conversación"
            description="Usa chat para conversaciones uno a uno donde necesitas revisar contexto y responder manualmente. Para mensajes masivos o programados, usa Broadcast."
          />
        </CardContent>
      </Card>
    );
  }

  const handleLocalAppend = (message: ChatHistoryMessage) => {
    setLocalMessages((current) => {
      const filtered = current.filter((item) => item.id !== message.id);
      return [...filtered, message];
    });
  };

  const lastPersistedAt = mergedMessages[mergedMessages.length - 1]?.timestamp;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="break-words">{activeThread.pushName || activeThread.remoteJid.split("@")[0]}</CardTitle>
              <p className="break-all text-sm text-muted-foreground">{activeThread.remoteJid}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeThread.unreadCount ? <OperatorStatusBadge variant="warning">{activeThread.unreadCount} sin leer</OperatorStatusBadge> : <OperatorStatusBadge variant="outline">Sin marcador pendiente</OperatorStatusBadge>}
              <OperatorStatusBadge variant="outline">{lastPersistedAt ? `Último guardado ${formatCompactTimestamp(lastPersistedAt)}` : "Sin mensajes guardados"}</OperatorStatusBadge>
            </div>
          </div>
          <Alert variant="info">
            <History className="h-4 w-4" />
            <AlertTitle>Historial parcial cuando la instancia no tiene todo guardado.</AlertTitle>
            <AlertDescription>
              El historial guardado está disponible para este chat. Conversaciones antiguas o archivos de media pueden quedar incompletos si no fueron capturados por la instancia.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChatCapabilityStatus capabilities={capabilities} />

          {historyLoading ? (
            <ChatEmptyState title="Cargando conversación" description="Consultando historial guardado de este chat." />
          ) : historyError ? (
            <Alert variant="warning">
              <MessagesSquare className="h-4 w-4" />
              <AlertTitle>Historial no disponible</AlertTitle>
              <AlertDescription>{getChatHistoryCapabilityMessage(historyError)}</AlertDescription>
            </Alert>
          ) : mergedMessages.length > 0 ? (
            <ChatMessageList messages={mergedMessages} />
          ) : (
          <OperatorEmptyState
            icon={MessagesSquare}
            title="Sin historial guardado"
            description="Esta conversación está disponible, pero todavía no hay mensajes guardados para este JID. Puedes enviar un mensaje, esperar nuevos eventos capturados o solicitar recuperación acotada desde el panel de la instancia."
          />
          )}
        </CardContent>
      </Card>

      <ChatComposer instanceId={instanceId} remoteJid={activeThread.remoteJid} capabilities={capabilities} onMessageSent={handleLocalAppend} />
    </div>
  );
}

export { ChatConversationPanel };
