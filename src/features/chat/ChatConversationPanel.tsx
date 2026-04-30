import { History, MessagesSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
              {activeThread.unreadCount ? <Badge variant="warning">{activeThread.unreadCount} unread</Badge> : <Badge variant="outline">No unread marker</Badge>}
              <Badge variant="outline">{lastPersistedAt ? `Last persisted ${formatCompactTimestamp(lastPersistedAt)}` : "No persisted messages yet"}</Badge>
            </div>
          </div>
          <Alert variant="info">
            <History className="h-4 w-4" />
            <AlertTitle>History stays honest about what the backend has actually stored.</AlertTitle>
            <AlertDescription>
              Persisted history is live for this chat. Older sessions are not backfilled automatically, and inbound or media records can still be partial when runtime capture was incomplete.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChatCapabilityStatus capabilities={capabilities} />

          {historyLoading ? (
            <ChatEmptyState title="Loading conversation" description="Fetching persisted message history for this chat." />
          ) : historyError ? (
            <Alert variant="warning">
              <MessagesSquare className="h-4 w-4" />
              <AlertTitle>Conversation history unavailable</AlertTitle>
              <AlertDescription>{getChatHistoryCapabilityMessage(historyError)}</AlertDescription>
            </Alert>
          ) : mergedMessages.length > 0 ? (
            <ChatMessageList messages={mergedMessages} />
          ) : (
            <ChatEmptyState
              title="No persisted history yet"
              description="This conversation is active, but there is no stored thread data yet for this remote JID. Send a new message here or wait for future runtime-captured events; older sessions are not backfilled automatically."
            />
          )}
        </CardContent>
      </Card>

      <ChatComposer instanceId={instanceId} remoteJid={activeThread.remoteJid} capabilities={capabilities} onMessageSent={handleLocalAppend} />
    </div>
  );
}

export { ChatConversationPanel };
