import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, CheckCheck, ChevronDown, Clock3, FileText, ImageIcon, Mic, Play, Video } from "lucide-react";

import { ChatHistoryMessage } from "@/lib/queries/chat/types";

const formatTimestamp = (value: string): string => {
  if (!value) {
    return "Pending timestamp";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Pending timestamp" : parsed.toLocaleString();
};

const formatBubbleTime = (value: string): string => {
  if (!value) {
    return "Pending";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Pending"
    : parsed.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
};

const formatDayDivider = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown day";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (parsed.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (parsed.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return parsed.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

const dayKey = (value: string): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? `unknown-${value}` : parsed.toDateString();
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
    case "failed":
      return "Failed";
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

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <AlertCircle className="h-3 w-3" />
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
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-dashed px-3 py-4 text-xs text-muted-foreground">
            <ImageIcon className="h-4 w-4 shrink-0" />
            Image metadata is partial and no preview URL was provided.
          </div>
        )}
        {(message.caption || message.text) && <div className="whitespace-pre-wrap break-words">{message.caption || message.text}</div>}
      </div>
    );
  }

  if (message.contentType === "video") {
    return (
      <div className="space-y-2">
        {message.mediaUrl ? (
          <video src={message.mediaUrl} controls className="max-h-72 w-full rounded-xl border bg-black/80" />
        ) : (
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-dashed px-3 py-4 text-xs text-muted-foreground">
            <Video className="h-4 w-4 shrink-0" />
            Video metadata is partial and no playable URL was provided.
          </div>
        )}
        {(message.caption || message.text) && <div className="whitespace-pre-wrap break-words">{message.caption || message.text}</div>}
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
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-dashed px-3 py-4 text-xs text-muted-foreground">
            <Mic className="h-4 w-4 shrink-0" />
            Audio metadata is partial and no playable URL was provided.
          </div>
        )}
        {(message.caption || message.text) && <div className="whitespace-pre-wrap break-words">{message.caption || message.text}</div>}
      </div>
    );
  }

  if (message.contentType === "document") {
    return (
      <div className="space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border bg-background/60 px-3 py-3">
          <FileText className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
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
        {(message.caption || message.text) && <div className="whitespace-pre-wrap break-words">{message.caption || message.text}</div>}
      </div>
    );
  }

  return <div className="whitespace-pre-wrap break-words">{message.text || `Stored ${message.messageType || "unknown"} message has no previewable text.`}</div>;
}

type MessageGroup = {
  type: "day" | "message";
  key: string;
  label?: string;
  message?: ChatHistoryMessage;
  groupedWithPrevious?: boolean;
};

function ChatMessageList({ messages }: { messages: ChatHistoryMessage[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const groups = useMemo<MessageGroup[]>(() => {
    const result: MessageGroup[] = [];

    messages.forEach((message, index) => {
      const previous = messages[index - 1];
      const currentDay = dayKey(message.timestamp);
      const previousDay = previous ? dayKey(previous.timestamp) : null;

      if (currentDay !== previousDay) {
        result.push({
          type: "day",
          key: `day-${currentDay}-${index}`,
          label: formatDayDivider(message.timestamp),
        });
      }

      const groupedWithPrevious =
        !!previous &&
        previous.fromMe === message.fromMe &&
        dayKey(previous.timestamp) === currentDay &&
        Math.abs(new Date(message.timestamp).getTime() - new Date(previous.timestamp).getTime()) < 5 * 60 * 1000;

      result.push({
        type: "message",
        key: message.id,
        message,
        groupedWithPrevious,
      });
    });

    return result;
  }, [messages]);

  useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [groups, isNearBottom]);

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    setIsNearBottom(distanceFromBottom < 96);
  };

  return (
    <div className="relative">
      <div ref={scrollRef} onScroll={handleScroll} className="flex max-h-[560px] flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/20 p-4">
        {groups.map((entry) => {
          if (entry.type === "day") {
            return (
              <div key={entry.key} className="sticky top-0 z-10 mx-auto rounded-full border bg-background/95 px-3 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
                {entry.label}
              </div>
            );
          }

          const message = entry.message!;

          return (
            <div
              key={entry.key}
              className={`max-w-[92%] break-words rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[85%] ${
                message.fromMe ? "ml-auto bg-primary text-primary-foreground" : "bg-background"
              } ${entry.groupedWithPrevious ? "mt-1" : "mt-3"}`}>
              {!entry.groupedWithPrevious && (
                <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-70">
                  <span>{message.fromMe ? "You" : message.pushName || message.remoteJid.split("@")[0] || "Unknown"}</span>
                  {message.status && <StatusMeta status={message.status} />}
                </div>
              )}
              <MessageBody message={message} />
              <div className="mt-2 flex items-center justify-between gap-3 text-[10px] opacity-70">
                <span title={formatTimestamp(message.timestamp)}>{formatBubbleTime(message.timestamp)}</span>
                <span className="inline-flex items-center gap-2">
                  {message.isPartial && <span>Partial metadata</span>}
                  {message.status && entry.groupedWithPrevious && <StatusMeta status={message.status} />}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {!isNearBottom && (
        <button
          type="button"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })}
          className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-xs shadow-sm">
          <ChevronDown className="h-3.5 w-3.5" />
          Newest
        </button>
      )}
    </div>
  );
}

export { ChatMessageList };
