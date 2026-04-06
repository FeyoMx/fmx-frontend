import { ChatHistoryMessage } from "@/lib/queries/chat/types";

function ChatMessageList({ messages }: { messages: ChatHistoryMessage[] }) {
  return (
    <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/20 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
            message.fromMe ? "ml-auto bg-primary text-primary-foreground" : "bg-background"
          }`}>
          <div className="mb-1 text-[11px] opacity-70">
            {message.pushName || message.remoteJid.split("@")[0] || "Unknown"}
          </div>
          <div>{message.text || `[${message.messageType}]`}</div>
          {message.timestamp && <div className="mt-2 text-[10px] opacity-70">{new Date(message.timestamp).toLocaleString()}</div>}
        </div>
      ))}
    </div>
  );
}

export { ChatMessageList };
