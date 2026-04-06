import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { getApiErrorMessage } from "@/lib/queries/errors";
import { fetchTenantChatTextStatus, useTenantChatAudio, useTenantChatMedia, useTenantChatText } from "@/lib/queries/chat/tenantChat";
import { ChatCapabilities, ChatSendResult } from "@/lib/queries/chat/types";

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
}: {
  instanceId: string;
  remoteJid: string;
  capabilities: ChatCapabilities;
}) {
  const [mode, setMode] = useState<"text" | "media" | "audio">("text");
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [delay, setDelay] = useState("0");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<ComposerFeedback | null>(null);
  const sendText = useTenantChatText();
  const sendMedia = useTenantChatMedia();
  const sendAudio = useTenantChatAudio();

  const recipientNumber = useMemo(() => remoteJid.split("@")[0] ?? "", [remoteJid]);
  const parsedDelay = Number.parseInt(delay, 10);

  const handleTextSend = async () => {
    if (!text.trim()) {
      toast.error("Write a message before sending.");
      return;
    }

    try {
      setFeedback({
        status: "queued",
        title: "En cola",
        detail: "Waiting for backend confirmation.",
      });

      const response = await sendText({
        instanceId,
        data: {
          number: recipientNumber,
          text: text.trim(),
          delay: Number.isFinite(parsedDelay) && parsedDelay >= 0 ? parsedDelay : 0,
        },
      });

      if (response.httpStatus === 202 && response.status_endpoint) {
        const startedAt = Date.now();

        while (Date.now() - startedAt < 60000) {
          await new Promise((resolve) => window.setTimeout(resolve, 2500));
          const status = await fetchTenantChatTextStatus(response.status_endpoint);

          if (status.status === "failed") {
            setFeedback({
              status: "error",
              title: "Error al enviar",
              detail: status.error || "The backend rejected the send request.",
            });
            return;
          }

          if (status.delivery_status === "read") {
            setFeedback({
              status: "read",
              title: "Leído",
              detail: status.read_at ? `Read at ${new Date(status.read_at).toLocaleString()}` : "The recipient opened the message.",
            });
            setText("");
            return;
          }

          if (status.delivery_status === "delivered" || status.delivery_confirmed) {
            setFeedback({
              status: "delivered",
              title: "Entregado",
              detail: status.delivered_at ? `Delivered at ${new Date(status.delivered_at).toLocaleString()}` : "Delivery confirmed by the provider.",
            });
            setText("");
            return;
          }

          if (status.delivery_status === "sent") {
            setFeedback({
              status: "provider_sent",
              title: "Enviado al proveedor",
              detail: "Still waiting for delivery confirmation.",
            });
            continue;
          }

          if (status.status === "running") {
            setFeedback({
              status: "sending",
              title: "Enviando",
              detail: "Backend is processing the send request.",
            });
            continue;
          }
        }

        setFeedback({
          status: "provider_sent",
          title: "Seguimiento pendiente",
          detail: "The message send is still in progress. History will surface here automatically once backend message retrieval becomes available.",
        });
        setText("");
        return;
      }

      setFeedback({
        status: "success",
        title: "Message accepted",
        detail: response.message,
      });
      setText("");
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Error al enviar",
        detail: getApiErrorMessage(error, "Unable to send text message."),
      });
    }
  };

  const handleMediaSend = async () => {
    if (!mediaFile) {
      toast.error("Choose a file before sending media.");
      return;
    }

    try {
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

      setFeedback(buildSendResultFeedback(result, "Media sent"));
      setMediaFile(null);
      setCaption("");
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Media send failed",
        detail: getApiErrorMessage(error, "Unable to send media."),
      });
    }
  };

  const handleAudioSend = async () => {
    if (!audioFile) {
      toast.error("Choose an audio file before sending.");
      return;
    }

    try {
      const audio = await fileToBase64(audioFile);
      const result = await sendAudio({
        instanceId,
        data: {
          number: recipientNumber,
          audio,
          delay: Number.isFinite(parsedDelay) && parsedDelay >= 0 ? parsedDelay : 0,
        },
      });

      setFeedback(buildSendResultFeedback(result, "Audio sent"));
      setAudioFile(null);
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Audio send failed",
        detail: getApiErrorMessage(error, "Unable to send audio."),
      });
    }
  };

  const onFileChange = (setter: (file: File | null) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    setter(event.target.files?.[0] ?? null);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
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
            <Button onClick={handleTextSend} disabled={!text.trim()}>
              Send text
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-3">
          <Input type="file" onChange={onFileChange(setMediaFile)} />
          <Textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Optional caption" />
          <div className="flex justify-end">
            <Button onClick={handleMediaSend} disabled={!mediaFile}>
              Send media
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="audio" className="space-y-3">
          <Input type="file" accept="audio/*" onChange={onFileChange(setAudioFile)} />
          <div className="flex justify-end">
            <Button onClick={handleAudioSend} disabled={!audioFile}>
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
