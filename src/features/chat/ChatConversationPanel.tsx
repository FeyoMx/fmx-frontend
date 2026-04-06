import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getChatHistoryCapabilityMessage } from "@/lib/queries/chat/tenantChat";
import { ChatCapabilities, ChatHistoryMessage, ChatHistoryResponse, ChatThread } from "@/lib/queries/chat/types";

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
          <ChatEmptyState
            title="Choose a conversation to continue"
            description="Pick a chat from the list to load persisted history for that remote JID."
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{activeThread.pushName || activeThread.remoteJid.split("@")[0]}</CardTitle>
          <p className="text-sm text-muted-foreground">{activeThread.remoteJid}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChatCapabilityStatus capabilities={capabilities} />

          {historyLoading ? (
            <ChatEmptyState title="Loading conversation" description="Fetching persisted message history for this chat." />
          ) : historyError ? (
            <Alert>
              <AlertTitle>Conversation history unavailable</AlertTitle>
              <AlertDescription>{getChatHistoryCapabilityMessage(historyError)}</AlertDescription>
            </Alert>
          ) : mergedMessages.length > 0 ? (
            <ChatMessageList messages={mergedMessages} />
          ) : (
            <ChatEmptyState
              title="No persisted history yet"
              description="This chat route is active, but the backend has not stored any messages for this conversation yet. Older sessions are not backfilled automatically."
            />
          )}
        </CardContent>
      </Card>

      <ChatComposer instanceId={instanceId} remoteJid={activeThread.remoteJid} capabilities={capabilities} onMessageSent={handleLocalAppend} />
    </div>
  );
}

export { ChatConversationPanel };
