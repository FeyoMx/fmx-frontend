import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Mic, Paperclip, Send, ShieldAlert, X } from "lucide-react";
import { toast } from "react-toastify";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { chatHistoryKey, fetchTenantChatTextStatus, useTenantChatAudio, useTenantChatMedia, useTenantChatText } from "@/lib/queries/chat/tenantChat";
import { ChatCapabilities, ChatHistoryMessage, ChatHistoryResponse, ChatSendResult } from "@/lib/queries/chat/types";
import { getApiErrorMessage } from "@/lib/queries/errors";

type ComposerFeedbackStatus = "queued" | "sending" | "provider_sent" | "delivered" | "read" | "success" | "error";

type ComposerFeedback = {
  status: ComposerFeedbackStatus;
  title: string;
  detail?: string;
};

const textStatusAlertVariant = (status: ComposerFeedbackStatus): "warning" | "info" | "success" | "destructive" => {
  switch (status) {
    case "queued":
      return "warning";
    case "sending":
      return "info";
    case "provider_sent":
    case "delivered":
    case "read":
    case "success":
      return "success";
    case "error":
      return "destructive";
    default:
      return "info";
  }
};

const fileToBase64 = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
  });

const buildSendResultFeedback = (result: ChatSendResult, fallbackTitle: string): ComposerFeedback => ({
  status: "success",
  title: fallbackTitle,
  detail: result.message_id ? `Message ID: ${result.message_id}` : result.message || undefined,
});

function ChatComposer({
  instanceId,
  remoteJid,
  capabilities,
  onMessageSent,
}: {
  instanceId: string;
  remoteJid: string;
  capabilities: ChatCapabilities;
  onMessageSent?: (message: ChatHistoryMessage) => void;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"text" | "media" | "audio">("text");
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [delay, setDelay] = useState("0");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<ComposerFeedback | null>(null);
  const [isSending, setIsSending] = useState(false);
  const sendText = useTenantChatText();
  const sendMedia = useTenantChatMedia();
  const sendAudio = useTenantChatAudio();

  const recipientNumber = useMemo(() => remoteJid.split("@")[0] ?? "", [remoteJid]);
  const parsedDelay = Number.parseInt(delay, 10);

  const appendMessage = (message: ChatHistoryMessage) => {
    onMessageSent?.(message);
    queryClient.setQueryData<ChatHistoryResponse>(chatHistoryKey(instanceId, remoteJid), (current) => {
      const next = current ? [...current.filter((item) => item.id !== message.id), message] : [message];
      return next.sort((left, right) => {
        const leftTime = left.timestamp ? new Date(left.timestamp).getTime() : 0;
        const rightTime = right.timestamp ? new Date(right.timestamp).getTime() : 0;
        return leftTime - rightTime;
      });
    });
  };

  const invalidateHistory = () => queryClient.invalidateQueries({ queryKey: chatHistoryKey(instanceId, remoteJid) });

  useEffect(() => {
    setFeedback(null);
    setText("");
    setCaption("");
    setMediaFile(null);
    setAudioFile(null);
    setMode("text");
    setIsSending(false);
  }, [remoteJid]);

  const createLocalMessage = (overrides: Partial<ChatHistoryMessage>): ChatHistoryMessage => ({
    id: overrides.id || `local-${Date.now()}`,
    remoteJid,
    fromMe: true,
    pushName: "You",
    messageType: overrides.messageType || "conversation",
    contentType: overrides.contentType || "text",
    text: overrides.text || "",
    caption: overrides.caption,
    fileName: overrides.fileName,
    mimeType: overrides.mimeType,
    mediaUrl: overrides.mediaUrl,
    status: overrides.status,
    timestamp: overrides.timestamp || new Date().toISOString(),
    isPartial: overrides.isPartial ?? false,
    raw: overrides.raw ?? null,
  });

  const handleTextSend = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending) {
      toast.error("Write a message before sending.");
      return;
    }

    const localMessageId = `local-text-${Date.now()}`;
    appendMessage(
      createLocalMessage({
        id: localMessageId,
        text: trimmedText,
        status: "queued",
      }),
    );

    try {
      setIsSending(true);
      setFeedback({
        status: "queued",
        title: "Queued for send",
        detail: "Waiting for backend confirmation and provider handoff.",
      });

      const response = await sendText({
        instanceId,
        data: {
          number: recipientNumber,
          text: trimmedText,
          delay: Number.isFinite(parsedDelay) && parsedDelay >= 0 ? parsedDelay : 0,
        },
      });

      if (response.httpStatus === 202 && response.status_endpoint) {
        const startedAt = Date.now();

        while (Date.now() - startedAt < 60000) {
          await new Promise((resolve) => window.setTimeout(resolve, 2500));
          const status = await fetchTenantChatTextStatus(response.status_endpoint);

          if (status.status === "failed") {
            appendMessage(
              createLocalMessage({
                id: status.message_id || localMessageId,
                text: trimmedText,
                status: "failed",
              }),
            );
            setFeedback({
              status: "error",
              title: "Send failed",
              detail: status.error || "The backend rejected the send request.",
            });
            return;
          }

          if (status.delivery_status === "read") {
            appendMessage(
              createLocalMessage({
                id: status.message_id || localMessageId,
                text: trimmedText,
                status: "read",
                timestamp: status.read_at || new Date().toISOString(),
              }),
            );
            setFeedback({
              status: "read",
              title: "Read",
              detail: status.read_at ? `Read at ${new Date(status.read_at).toLocaleString()}` : "The recipient opened the message.",
            });
            setText("");
            return;
          }

          if (status.delivery_status === "delivered" || status.delivery_confirmed) {
            appendMessage(
              createLocalMessage({
                id: status.message_id || localMessageId,
                text: trimmedText,
                status: "delivered",
                timestamp: status.delivered_at || new Date().toISOString(),
              }),
            );
            setFeedback({
              status: "delivered",
              title: "Delivered",
              detail: status.delivered_at ? `Delivered at ${new Date(status.delivered_at).toLocaleString()}` : "Delivery confirmed by the provider.",
            });
            setText("");
            return;
          }

          if (status.delivery_status === "sent") {
            appendMessage(
              createLocalMessage({
                id: status.message_id || localMessageId,
                text: trimmedText,
                status: "sent",
              }),
            );
            setFeedback({
              status: "provider_sent",
              title: "Sent to provider",
              detail: "Still waiting for delivery confirmation.",
            });
            continue;
          }

          if (status.status === "running") {
            appendMessage(
              createLocalMessage({
                id: status.message_id || localMessageId,
                text: trimmedText,
                status: "running",
              }),
            );
            setFeedback({
              status: "sending",
              title: "Sending",
              detail: "Backend is processing the send request.",
            });
            continue;
          }
        }

        setFeedback({
          status: "provider_sent",
          title: "Tracking still in progress",
          detail: "The send request is still settling. The thread will refresh again as backend delivery state becomes available.",
        });
        setText("");
        void invalidateHistory();
        return;
      }

      appendMessage(
        createLocalMessage({
          id: localMessageId,
          text: trimmedText,
          status: response.delivery_status || (response.sent ? "sent" : "queued"),
        }),
      );
      setFeedback({
        status: "success",
        title: "Message accepted",
        detail: response.message,
      });
      setText("");
      void invalidateHistory();
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Send failed",
        detail: getApiErrorMessage(error, "Unable to send text message."),
      });
      void invalidateHistory();
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaSend = async () => {
    if (!mediaFile || isSending) {
      toast.error("Choose a file before sending media.");
      return;
    }

    try {
      setIsSending(true);
      const media = await fileToBase64(mediaFile);
      const mediaType = mediaFile.type.split("/")[0] === "application" ? "document" : ((mediaFile.type.split("/")[0] || "document") as "image" | "video" | "audio" | "document");
      const result = await sendMedia({
        instanceId,
        data: {
          number: recipientNumber,
          mediatype: mediaType,
          mimetype: mediaFile.type,
          caption: caption.trim() || undefined,
          media,
          fileName: mediaFile.name,
          delay: Number.isFinite(parsedDelay) && parsedDelay >= 0 ? parsedDelay : 0,
        },
      });

      appendMessage(
        createLocalMessage({
          id: result.message_id || `local-media-${Date.now()}`,
          messageType: `${mediaType}Message`,
          contentType: mediaType === "document" ? "document" : mediaType,
          text: caption.trim(),
          caption: caption.trim() || undefined,
          fileName: mediaFile.name,
          mimeType: mediaFile.type,
          mediaUrl: URL.createObjectURL(mediaFile),
          status: "sent",
          isPartial: true,
          raw: result,
        }),
      );
      setFeedback(buildSendResultFeedback(result, "Media accepted by backend"));
      setMediaFile(null);
      setCaption("");
      void invalidateHistory();
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Media send failed",
        detail: getApiErrorMessage(error, "Unable to send media."),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAudioSend = async () => {
    if (!audioFile || isSending) {
      toast.error("Choose an audio file before sending.");
      return;
    }

    try {
      setIsSending(true);
      const audio = await fileToBase64(audioFile);
      const result = await sendAudio({
        instanceId,
        data: {
          number: recipientNumber,
          audio,
          delay: Number.isFinite(parsedDelay) && parsedDelay >= 0 ? parsedDelay : 0,
        },
      });

      appendMessage(
        createLocalMessage({
          id: result.message_id || `local-audio-${Date.now()}`,
          messageType: "audioMessage",
          contentType: "audio",
          fileName: audioFile.name,
          mimeType: audioFile.type,
          mediaUrl: URL.createObjectURL(audioFile),
          status: "sent",
          isPartial: true,
          raw: result,
        }),
      );
      setFeedback(buildSendResultFeedback(result, "Audio accepted by backend"));
      setAudioFile(null);
      void invalidateHistory();
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Audio send failed",
        detail: getApiErrorMessage(error, "Unable to send audio."),
      });
    } finally {
      setIsSending(false);
    }
  };

  const onFileChange = (setter: (file: File | null) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    setter(event.target.files?.[0] ?? null);
  };

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Composer</h3>
          <p className="text-xs text-muted-foreground">Thread target: {recipientNumber}</p>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="chat-send-delay" className="text-xs">
            Delay (ms)
          </Label>
          <Input id="chat-send-delay" type="number" min="0" step="1" value={delay} onChange={(event) => setDelay(event.target.value)} className="h-8 w-28" />
        </div>
      </div>

      <Alert variant="info">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Send feedback reflects backend truth as it arrives.</AlertTitle>
        <AlertDescription>
          Text sends can move through queued, sending, provider-sent, delivered, and read states. Media and audio sends are accepted here, but history preview can stay partial until the backend republishes richer metadata.
        </AlertDescription>
      </Alert>

      <Tabs value={mode} onValueChange={(value) => setMode(value as "text" | "media" | "audio")}>
        <TabsList>
          <TabsTrigger value="text" disabled={capabilities.textSend !== "available"}>
            Text
          </TabsTrigger>
          <TabsTrigger value="media" disabled={capabilities.mediaSend !== "available"}>
            Media
          </TabsTrigger>
          <TabsTrigger value="audio" disabled={capabilities.audioSend !== "available"}>
            Audio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-3">
          <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a message for this conversation" />
          <div className="flex justify-end">
            <Button onClick={handleTextSend} disabled={!text.trim() || isSending} className="gap-2">
              {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send text
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-3">
          <Input type="file" onChange={onFileChange(setMediaFile)} />
          {mediaFile && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-3.5 w-3.5" />
                <span className="truncate">{mediaFile.name}</span>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMediaFile(null)} disabled={isSending}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <Textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Optional caption" />
          <div className="flex justify-end">
            <Button onClick={handleMediaSend} disabled={!mediaFile || isSending} className="gap-2">
              {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send media
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="audio" className="space-y-3">
          <Input type="file" accept="audio/*" onChange={onFileChange(setAudioFile)} />
          {audioFile && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <Mic className="h-3.5 w-3.5" />
                <span className="truncate">{audioFile.name}</span>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAudioFile(null)} disabled={isSending}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleAudioSend} disabled={!audioFile || isSending} className="gap-2">
              {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send audio
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {feedback && (
        <Alert variant={textStatusAlertVariant(feedback.status)}>
          <AlertTitle>{feedback.title}</AlertTitle>
          {feedback.detail && <AlertDescription>{feedback.detail}</AlertDescription>}
        </Alert>
      )}
    </div>
  );
}

export { ChatComposer };
