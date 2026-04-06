import { ImageIcon, MessageCircle, Mic, Search, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import { useInstance } from "@/contexts/InstanceContext";

import { useChatCapabilities, useChatHistory, useChatThreads } from "@/lib/queries/chat/tenantChat";
import { ChatThread } from "@/lib/queries/chat/types";
import { getApiErrorMessage } from "@/lib/queries/errors";
import { useMediaQuery } from "@/utils/useMediaQuery";

import { ChatConversationPanel } from "./ChatConversationPanel";
import { ChatEmptyState } from "./ChatEmptyState";

const previewLabel = (thread: ChatThread): string => {
  if (thread.previewText) {
    return thread.previewText;
  }

  switch (thread.previewType) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "document":
      return "Document";
    default:
      return "No preview available";
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

  const { data: threads, isLoading: threadsLoading, error: threadsError } = useChatThreads({
    instanceId: instance?.id,
    search,
  });

  const activeThread = useMemo<ChatThread | null>(() => {
    const matched = threads?.find((thread) => thread.remoteJid === remoteJid) ?? null;
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

  const handleThreadSelect = (thread: ChatThread) => {
    if (!instance?.id) {
      return;
    }

    navigate(`/manager/instance/${instance.id}/chat/${encodeURIComponent(thread.remoteJid)}`);
  };

  return (
    <div className="h-[calc(100vh-160px)] overflow-hidden">
      <ResizablePanelGroup direction={isDesktop ? "horizontal" : "vertical"} className="h-full">
        <ResizablePanel defaultSize={30} minSize={25}>
          <Card className="h-full rounded-r-none border-r-0">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle>Chats</CardTitle>
                <p className="text-sm text-muted-foreground">Browse tenant-safe conversations and open the persisted thread for any surfaced remote JID.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats already exposed by backend" className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="flex h-[calc(100%-152px)] flex-col gap-3 overflow-y-auto">
              {threadsLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : threadsError ? (
                <ChatEmptyState title="Chat list unavailable" description={getApiErrorMessage(threadsError, "Unable to load tenant-safe chats for this instance.")} />
              ) : threads && threads.length > 0 ? (
                threads.map((thread) => {
                  const isActive = thread.remoteJid === remoteJid;
                  return (
                    <Button
                      key={thread.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={`h-auto justify-start gap-3 whitespace-normal rounded-xl px-3 py-3 text-left transition-colors ${
                        isActive ? "border border-primary/30 bg-primary/10 shadow-sm" : "border border-transparent hover:border-border hover:bg-muted/70"
                      }`}
                      onClick={() => handleThreadSelect(thread)}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={thread.profilePicUrl} alt={thread.pushName} />
                        <AvatarFallback>{(thread.pushName || thread.remoteJid).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{thread.pushName || thread.remoteJid.split("@")[0]}</div>
                            <div className="truncate text-xs text-muted-foreground">{thread.remoteJid}</div>
                          </div>
                          <div className="shrink-0 text-[11px] text-muted-foreground">
                            {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <PreviewIcon type={thread.previewType} />
                            <span className="truncate">{previewLabel(thread)}</span>
                          </div>
                          {thread.unreadCount && thread.unreadCount > 0 ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Button>
                  );
                })
              ) : (
                <ChatEmptyState
                  title="No chats surfaced yet"
                  description="The backend chat list route is active, but no tenant-safe conversations were returned for this instance with the current search."
                />
              )}
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={70}>
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
