import { MessageCircle, Search } from "lucide-react";
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
                      className="h-auto justify-start gap-3 whitespace-normal px-3 py-3 text-left"
                      onClick={() => handleThreadSelect(thread)}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={thread.profilePicUrl} alt={thread.pushName} />
                        <AvatarFallback>{(thread.pushName || thread.remoteJid).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{thread.pushName || thread.remoteJid.split("@")[0]}</div>
                        <div className="truncate text-xs text-muted-foreground">{thread.remoteJid}</div>
                        {thread.lastMessageAt && <div className="mt-1 text-[11px] text-muted-foreground">Last activity: {new Date(thread.lastMessageAt).toLocaleString()}</div>}
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
