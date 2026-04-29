import { ImageIcon, Mic, Search, Video } from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import { useInstance } from "@/contexts/InstanceContext";
import { getApiErrorMessage } from "@/lib/queries/errors";
import { useChatCapabilities, useChatHistory, useChatThreads } from "@/lib/queries/chat/tenantChat";
import { ChatThread } from "@/lib/queries/chat/types";
import { formatCompactTimestamp, formatRelativeTime } from "@/lib/operator-format";
import { useIncrementalList } from "@/lib/use-incremental-list";
import { useMediaQuery } from "@/utils/useMediaQuery";

import { ChatConversationPanel } from "./ChatConversationPanel";
import { ChatEmptyState } from "./ChatEmptyState";

const previewLabel = (thread: ChatThread): string => {
  if (thread.previewText) {
    return thread.previewText;
  }

  switch (thread.previewType) {
    case "image":
      return "Image message";
    case "video":
      return "Video message";
    case "audio":
      return "Audio message";
    case "document":
      return "Document message";
    default:
      return "No preview available yet";
  }
};

const PreviewIcon = ({ type }: { type?: ChatThread["previewType"] }) => {
  if (type === "image") {
    return <ImageIcon className="h-3.5 w-3.5" />;
  }

  if (type === "video") {
    return <Video className="h-3.5 w-3.5" />;
  }

  if (type === "audio") {
    return <Mic className="h-3.5 w-3.5" />;
  }

  return null;
};

function ChatShell() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const navigate = useNavigate();
  const { instance } = useInstance();
  const { remoteJid } = useParams<{ remoteJid: string }>();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { data: threadData, isLoading: threadsLoading, error: threadsError } = useChatThreads({
    instanceId: instance?.id,
    search: deferredSearch,
  });
  const threads = useMemo(() => threadData?.items ?? [], [threadData?.items]);
  const chatListMetadata = threadData?.metadata;

  const activeThread = useMemo<ChatThread | null>(() => {
    const matched = threads.find((thread) => thread.remoteJid === remoteJid) ?? null;
    if (matched || !remoteJid) {
      return matched;
    }

    return {
      id: remoteJid,
      remoteJid,
      pushName: remoteJid.split("@")[0] || "Unknown contact",
      profilePicUrl: "",
      labels: [],
    };
  }, [remoteJid, threads]);

  const {
    data: historyMessages,
    isLoading: historyLoading,
    error: historyError,
  } = useChatHistory({
    instanceId: instance?.id,
    remoteJid,
  });

  const capabilities = useChatCapabilities({
    threadsAvailable: !threadsLoading && !threadsError,
    historyEnabled: !!instance?.id && !!remoteJid,
    historyLoading,
    historyError,
    historyMessages,
  });

  const threadSummary = useMemo(() => {
    return threads.reduce(
      (summary, thread) => {
        summary.total += 1;
        if ((thread.unreadCount ?? 0) > 0) {
          summary.unreadThreads += 1;
          summary.unreadMessages += thread.unreadCount ?? 0;
        }
        if (thread.lastMessageAt) {
          summary.withPreview += 1;
        }
        return summary;
      },
      {
        total: 0,
        unreadThreads: 0,
        unreadMessages: 0,
        withPreview: 0,
      },
    );
  }, [threads]);

  const chatListStatusCopy = useMemo(() => {
    if (!chatListMetadata || (!chatListMetadata.cached && !chatListMetadata.stale)) {
      return null;
    }

    const source = chatListMetadata.source ? ` Source: ${chatListMetadata.source}.` : "";
    const refreshedAt = chatListMetadata.refreshedAt ? ` Refreshed ${formatCompactTimestamp(chatListMetadata.refreshedAt)}.` : "";

    if (chatListMetadata.stale) {
      return `Showing stored chat-list data while the live bridge refreshes.${source}${refreshedAt}`;
    }

    return `Showing cached chat-list data from the backend.${source}${refreshedAt}`;
  }, [chatListMetadata]);

  const visibleThreads = useIncrementalList(threads, {
    initialCount: 75,
    step: 75,
  });

  const handleThreadSelect = (thread: ChatThread) => {
    if (!instance?.id) {
      return;
    }

    startTransition(() => {
      navigate(`/manager/instance/${instance.id}/chat/${encodeURIComponent(thread.remoteJid)}`);
    });
  };

  return (
    <div className="h-[calc(100vh-160px)] overflow-hidden">
      <ResizablePanelGroup direction={isDesktop ? "horizontal" : "vertical"} className="h-full">
        <ResizablePanel defaultSize={32} minSize={25}>
          <Card className="h-full rounded-r-none border-r-0">
            <CardHeader className="space-y-4 border-b">
              <div className="space-y-2">
                <CardTitle>Chats</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Browse tenant-safe conversations and open the persisted thread for any surfaced remote JID. Older sessions may stay partial until runtime capture or a successful backfill request exists.
                </p>
                {chatListStatusCopy ? (
                  <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    {chatListStatusCopy}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-muted-foreground">Surfaced threads</div>
                  <div className="mt-2 text-2xl font-semibold">{threadSummary.total}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-muted-foreground">Unread threads</div>
                  <div className="mt-2 text-2xl font-semibold">{threadSummary.unreadThreads}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-muted-foreground">Unread messages</div>
                  <div className="mt-2 text-2xl font-semibold">{threadSummary.unreadMessages}</div>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search surfaced chats"
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="flex h-[calc(100%-265px)] flex-col gap-3 overflow-y-auto p-4">
              {threadsLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : threadsError ? (
                <ChatEmptyState title="Chat list unavailable" description={getApiErrorMessage(threadsError, "Unable to load tenant-safe chats for this instance.")} />
              ) : threads.length > 0 ? (
                <>
                  {visibleThreads.visibleItems.map((thread) => {
                  const isActive = thread.remoteJid === remoteJid;
                  const hasUnread = (thread.unreadCount ?? 0) > 0;

                  return (
                    <Button
                      key={thread.id}
                      variant="ghost"
                      className={`h-auto justify-start gap-3 whitespace-normal rounded-2xl border px-3 py-3 text-left transition-colors ${
                        isActive
                          ? "border-primary/30 bg-primary/10 shadow-sm"
                          : hasUnread
                            ? "border-amber-200/70 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50"
                            : "border-transparent hover:border-border hover:bg-muted/70"
                      }`}
                      onClick={() => handleThreadSelect(thread)}>
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={thread.profilePicUrl} alt={thread.pushName} />
                        <AvatarFallback>{(thread.pushName || thread.remoteJid).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`truncate font-medium ${hasUnread ? "text-foreground" : ""}`}>{thread.pushName || thread.remoteJid.split("@")[0]}</div>
                            <div className="truncate text-xs text-muted-foreground">{thread.remoteJid}</div>
                          </div>
                          <div className="shrink-0 text-[11px] text-muted-foreground">
                            {thread.lastMessageAt ? formatCompactTimestamp(thread.lastMessageAt, "") : ""}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className={`flex min-w-0 items-center gap-1.5 text-xs ${hasUnread ? "text-foreground" : "text-muted-foreground"}`}>
                            <PreviewIcon type={thread.previewType} />
                            <span className="truncate">{previewLabel(thread)}</span>
                          </div>
                          {hasUnread ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              {thread.unreadCount! > 99 ? "99+" : thread.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant={hasUnread ? "warning" : "outline"}>{hasUnread ? "Unread activity" : "Seen"}</Badge>
                          <span>{thread.lastMessageAt ? `Last message ${formatRelativeTime(thread.lastMessageAt)}` : "Waiting for first persisted message"}</span>
                        </div>
                      </div>
                    </Button>
                  );
                })}
                  {visibleThreads.hasMore ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
                      <div className="text-xs text-muted-foreground">
                        Showing {visibleThreads.visibleCount} of {visibleThreads.totalCount} surfaced threads to keep large chat lists responsive.
                      </div>
                      <Button variant="outline" onClick={visibleThreads.showMore}>
                        Show 75 more
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <ChatEmptyState
                  title={search.trim() ? "No chats match this search" : "No chats surfaced yet"}
                  description={
                    search.trim()
                      ? "Try a different number, name, or remote JID fragment. Only tenant-safe conversations returned by the backend appear here."
                      : "The backend chat list route is active, but no tenant-safe conversations were returned for this instance yet."
                  }
                />
              )}
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={68}>
          <div className="h-full overflow-y-auto pl-4">
            {!instance?.id ? (
              <Card className="h-full">
                <CardContent className="flex h-full items-center justify-center">
                  <ChatEmptyState title="Instance not available" description="Load an instance before using the chat shell." />
                </CardContent>
              </Card>
            ) : (
              <ChatConversationPanel
                instanceId={instance.id}
                activeThread={activeThread}
                capabilities={capabilities}
                historyMessages={historyMessages}
                historyLoading={historyLoading}
                historyError={historyError}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export { ChatShell };
