import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getChatHistoryCapabilityMessage } from "@/lib/queries/chat/tenantChat";
import { ChatCapabilities, ChatHistoryResponse, ChatThread } from "@/lib/queries/chat/types";

import { ChatCapabilityStatus } from "./ChatCapabilityStatus";
import { ChatComposer } from "./ChatComposer";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatMessageList } from "./ChatMessageList";

type ChatConversationPanelProps = {
  instanceId: string;
  activeThread: ChatThread | null;
  capabilities: ChatCapabilities;
  historyMessages: ChatHistoryResponse | undefined;
  historyError: unknown;
};

function ChatConversationPanel({
  instanceId,
  activeThread,
  capabilities,
  historyMessages,
  historyError,
}: ChatConversationPanelProps) {
  if (!activeThread) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Chat readiness shell</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChatCapabilityStatus capabilities={capabilities} />
          <ChatEmptyState
            title="Choose a conversation to continue"
            description="Chat list and supported senders can already live in this shell. Full thread history will activate automatically here once the backend starts returning truthful tenant-safe message history."
          />
        </CardContent>
      </Card>
    );
  }

  const historyReady = capabilities.messageHistory === "available";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{activeThread.pushName || activeThread.remoteJid.split("@")[0]}</CardTitle>
          <p className="text-sm text-muted-foreground">{activeThread.remoteJid}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChatCapabilityStatus capabilities={capabilities} />

          {historyReady ? (
            historyMessages && historyMessages.length > 0 ? (
              <ChatMessageList messages={historyMessages} />
            ) : (
              <ChatEmptyState
                title="No messages returned yet"
                description="The history route is active, but this conversation did not return any messages yet."
              />
            )
          ) : (
            <Alert>
              <AlertTitle>Message history still pending</AlertTitle>
              <AlertDescription>{getChatHistoryCapabilityMessage(historyError)}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <ChatComposer instanceId={instanceId} remoteJid={activeThread.remoteJid} capabilities={capabilities} />
    </div>
  );
}

export { ChatConversationPanel };
