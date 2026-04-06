import { Check, CheckCheck, Clock3, FileText, ImageIcon, Mic, Play, Video } from "lucide-react";

import { ChatHistoryMessage } from "@/lib/queries/chat/types";

const formatTimestamp = (value: string): string => {
  if (!value) {
    return "Pending timestamp";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Pending timestamp" : parsed.toLocaleString();
};

const statusLabel = (status?: string): string | null => {
  switch (status) {
    case "read":
      return "Read";
    case "delivered":
      return "Delivered";
    case "sent":
      return "Sent";
    case "queued":
    case "running":
      return "Sending";
    default:
      return status ? status.replace(/_/g, " ") : null;
  }
};

function StatusMeta({ status }: { status?: string }) {
  if (!status) {
    return null;
  }

  const label = statusLabel(status);
  if (!label) {
    return null;
  }

  if (status === "read") {
    return (
      <span className="inline-flex items-center gap-1">
        <CheckCheck className="h-3 w-3" />
        {label}
      </span>
    );
  }

  if (status === "delivered") {
    return (
      <span className="inline-flex items-center gap-1">
        <CheckCheck className="h-3 w-3" />
        {label}
      </span>
    );
  }

  if (status === "queued" || status === "running") {
    return (
      <span className="inline-flex items-center gap-1">
        <Clock3 className="h-3 w-3" />
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Check className="h-3 w-3" />
      {label}
    </span>
  );
}

function MessageBody({ message }: { message: ChatHistoryMessage }) {
  if (message.contentType === "image") {
    return (
      <div className="space-y-2">
        {message.mediaUrl ? (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border bg-background/60">
            <img src={message.mediaUrl} alt={message.caption || message.fileName || "Image message"} className="max-h-72 w-full object-cover" loading="lazy" />
          </a>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-4 text-xs opacity-80">
            <ImageIcon className="h-4 w-4" />
            Image metadata is partial and no preview URL was provided.
          </div>
        )}
        {(message.caption || message.text) && <div>{message.caption || message.text}</div>}
      </div>
    );
  }

  if (message.contentType === "video") {
    return (
      <div className="space-y-2">
        {message.mediaUrl ? (
          <video src={message.mediaUrl} controls className="max-h-72 w-full rounded-xl border bg-black/80" />
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-4 text-xs opacity-80">
            <Video className="h-4 w-4" />
            Video metadata is partial and no playable URL was provided.
          </div>
        )}
        {(message.caption || message.text) && <div>{message.caption || message.text}</div>}
      </div>
    );
  }

  if (message.contentType === "audio") {
    return (
      <div className="space-y-2">
        {message.mediaUrl ? (
          <audio controls className="w-full">
            <source src={message.mediaUrl} type={message.mimeType || "audio/mpeg"} />
          </audio>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-4 text-xs opacity-80">
            <Mic className="h-4 w-4" />
            Audio metadata is partial and no playable URL was provided.
          </div>
        )}
        {(message.caption || message.text) && <div>{message.caption || message.text}</div>}
      </div>
    );
  }

  if (message.contentType === "document") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-3">
          <FileText className="h-4 w-4" />
          <div className="min-w-0">
            <div className="truncate font-medium">{message.fileName || "Document"}</div>
            {message.mimeType && <div className="truncate text-xs opacity-70">{message.mimeType}</div>}
          </div>
          {message.mediaUrl && (
            <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline">
              <Play className="h-3 w-3" />
              Open
            </a>
          )}
        </div>
        {(message.caption || message.text) && <div>{message.caption || message.text}</div>}
      </div>
    );
  }

  return <div>{message.text || `[${message.messageType}]`}</div>;
}

function ChatMessageList({ messages }: { messages: ChatHistoryMessage[] }) {
  return (
    <div className="flex max-h-[560px] flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/20 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
            message.fromMe ? "ml-auto bg-primary text-primary-foreground" : "bg-background"
          }`}>
          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-70">
            <span>{message.fromMe ? "You" : message.pushName || message.remoteJid.split("@")[0] || "Unknown"}</span>
            {message.status && <StatusMeta status={message.status} />}
          </div>
          <MessageBody message={message} />
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] opacity-70">
            <span>{formatTimestamp(message.timestamp)}</span>
            {message.isPartial && <span>Partial metadata</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export { ChatMessageList };
