import { ImageIcon, Mic, Search, Video } from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OperatorErrorState, SkeletonCard } from "@/components/operator-state";
import { OperatorStatTile, OperatorStatusBadge } from "@/components/operator-surface";
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

type ThreadFilter = "all" | "unread" | "recent";

const previewLabel = (thread: ChatThread): string => {
  if (thread.previewText) {
    return thread.previewText;
  }

  switch (thread.previewType) {
    case "image":
      return "Mensaje con imagen";
    case "video":
      return "Mensaje con video";
    case "audio":
      return "Mensaje de audio";
    case "document":
      return "Documento adjunto";
    default:
      return "Sin vista previa todavía";
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

const decodeRouteParam = (value?: string): string => {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

function ChatShell() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const navigate = useNavigate();
  const { instance } = useInstance();
  const { remoteJid } = useParams<{ remoteJid: string }>();
  const selectedRemoteJid = useMemo(() => decodeRouteParam(remoteJid), [remoteJid]);
  const [search, setSearch] = useState("");
  const [threadFilter, setThreadFilter] = useState<ThreadFilter>("all");
  const deferredSearch = useDeferredValue(search);

  const { data: threadData, isLoading: threadsLoading, isFetching: threadsFetching, error: threadsError, refetch: refetchThreads } = useChatThreads({
    instanceId: instance?.id,
    search: deferredSearch,
  });
  const threads = useMemo(() => threadData?.items ?? [], [threadData?.items]);
  const chatListMetadata = threadData?.metadata;

  const activeThread = useMemo<ChatThread | null>(() => {
    const matched = threads.find((thread) => thread.remoteJid === selectedRemoteJid) ?? null;
    if (matched || !selectedRemoteJid) {
      return matched;
    }

    return {
      id: selectedRemoteJid,
      remoteJid: selectedRemoteJid,
      pushName: selectedRemoteJid.split("@")[0] || "Contacto pendiente",
      profilePicUrl: "",
      labels: [],
    };
  }, [selectedRemoteJid, threads]);

  const {
    data: historyMessages,
    isLoading: historyLoading,
    error: historyError,
  } = useChatHistory({
    instanceId: instance?.id,
    remoteJid: selectedRemoteJid,
  });

  const capabilities = useChatCapabilities({
    threadsAvailable: !threadsLoading && !threadsError,
    historyEnabled: !!instance?.id && !!selectedRemoteJid,
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

    const source = chatListMetadata.source ? ` Origen: ${chatListMetadata.source}.` : "";
    const refreshedAt = chatListMetadata.refreshedAt ? ` Actualizado ${formatCompactTimestamp(chatListMetadata.refreshedAt)}.` : "";

    if (chatListMetadata.stale) {
      return `Mostrando conversaciones guardadas mientras se actualiza la conexión.${source}${refreshedAt}`;
    }

    return `Mostrando conversaciones guardadas.${source}${refreshedAt}`;
  }, [chatListMetadata]);

  const filteredThreads = useMemo(() => {
    return [...threads]
      .filter((thread) => {
        if (threadFilter === "unread") {
          return (thread.unreadCount ?? 0) > 0;
        }
        if (threadFilter === "recent") {
          return !!thread.lastMessageAt;
        }
        return true;
      })
      .sort((left, right) => {
        const unreadDiff = (right.unreadCount ?? 0) - (left.unreadCount ?? 0);
        if (unreadDiff !== 0) {
          return unreadDiff;
        }

        const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
        const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
        if (rightTime !== leftTime) {
          return rightTime - leftTime;
        }

        return (left.pushName || left.remoteJid).localeCompare(right.pushName || right.remoteJid);
      });
  }, [threadFilter, threads]);

  const threadFilters: Array<{ value: ThreadFilter; label: string; count: number }> = [
    { value: "all", label: "Todos", count: threadSummary.total },
    { value: "unread", label: "Sin leer", count: threadSummary.unreadThreads },
    { value: "recent", label: "Recientes", count: threadSummary.withPreview },
  ];

  const visibleThreads = useIncrementalList(filteredThreads, {
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
    <div className="h-full min-h-0 min-w-0 overflow-hidden">
      <ResizablePanelGroup direction={isDesktop ? "horizontal" : "vertical"} className="h-full min-h-0 min-w-0 overflow-hidden">
        <ResizablePanel defaultSize={32} minSize={25} className="min-h-0 min-w-0">
          <Card className="flex h-full min-h-0 min-w-0 flex-col lg:rounded-r-none lg:border-r-0">
            <CardHeader className="space-y-4 border-b">
              <div className="space-y-2">
                <CardTitle>Chats</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  Revisa conversaciones disponibles y abre el historial guardado de cada JID. Algunas conversaciones antiguas pueden aparecer como historial parcial.
                </p>
                {chatListStatusCopy ? (
                  <div role="status" className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    {chatListStatusCopy}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <OperatorStatTile label="Chats" value={threadSummary.total} detail="Disponibles" className="p-3" />
                <OperatorStatTile label="Atención" value={threadSummary.unreadThreads} detail="Chats sin leer" className="p-3" />
                <OperatorStatTile label="Mensajes" value={threadSummary.unreadMessages} detail="Sin leer" className="p-3" />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar chats disponibles"
                  className="pl-9"
                  disabled={threadsLoading && !threadData}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {threadFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    variant={threadFilter === filter.value ? "secondary" : "outline"}
                    size="sm"
                    className="shrink-0 gap-2"
                    onClick={() => setThreadFilter(filter.value)}>
                    {filter.label}
                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">{filter.count}</span>
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              {threadsLoading && !threadData ? (
                <div className="grid animate-pulse gap-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              ) : threadsError ? (
                <OperatorErrorState
                  title="Lista de chats no disponible"
                  description={getApiErrorMessage(threadsError, "No se pudieron cargar los chats de esta instancia.")}
                  onRetry={() => void refetchThreads()}
                />
              ) : filteredThreads.length > 0 ? (
                <>
                  {threadsFetching ? (
                    <div role="status" className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      Actualizando chats sin borrar los resultados actuales.
                    </div>
                  ) : null}
                  {visibleThreads.visibleItems.map((thread) => {
                    const isActive = thread.remoteJid === selectedRemoteJid;
                    const hasUnread = (thread.unreadCount ?? 0) > 0;

                    return (
                      <Button
                        key={thread.id}
                        variant="ghost"
                        className={`h-auto justify-start gap-3 whitespace-normal rounded-xl border px-3 py-3 text-left transition-colors ${
                          isActive
                            ? "border-primary/40 bg-primary/10 shadow-sm ring-1 ring-primary/20"
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
                            <OperatorStatusBadge variant={hasUnread ? "warning" : "outline"}>{hasUnread ? "Actividad nueva" : "Visto"}</OperatorStatusBadge>
                            <span className="min-w-0 break-words">{thread.lastMessageAt ? `Último mensaje ${formatRelativeTime(thread.lastMessageAt)}` : "Esperando primer mensaje guardado"}</span>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                  {visibleThreads.hasMore ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
                      <div className="text-xs text-muted-foreground">
                        Mostrando {visibleThreads.visibleCount} de {visibleThreads.totalCount} chats para mantener la lista ágil.
                      </div>
                      <Button variant="outline" onClick={visibleThreads.showMore}>
                        Mostrar 75 más
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <ChatEmptyState
                  title={search.trim() || threadFilter !== "all" ? "No hay chats con este filtro" : "Aún no hay chats visibles"}
                  description={
                    search.trim()
                      ? "Prueba otro número, nombre o fragmento de JID. Solo aparecen conversaciones disponibles para esta instancia."
                      : threadFilter === "unread"
                        ? "No hay conversaciones sin leer en este momento."
                        : threadFilter === "recent"
                          ? "Todavía no hay conversaciones con actividad reciente guardada."
                          : "Cuando la instancia reciba o envíe mensajes, las conversaciones aparecerán aquí para atención manual del operador."
                  }
                />
              )}
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={68} className="min-h-0 min-w-0">
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden pt-4 lg:pl-4 lg:pt-0">
            {!instance?.id ? (
              <Card className="h-full">
                <CardContent className="flex h-full items-center justify-center">
                  <ChatEmptyState title="Instancia no disponible" description="Carga una instancia antes de usar chat." />
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
