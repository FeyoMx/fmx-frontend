/* eslint-disable react-hooks/exhaustive-deps */
import { Activity, CircleUser, Clock3, LogOut, MessageCircle, RefreshCw, SmartphoneCharging, UsersRound, Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

import { InstanceStatus } from "@/components/instance-status";
import { InstanceToken } from "@/components/instance-token";
import { UnsupportedInstanceFeature } from "@/components/unsupported-instance-feature";
import { useTheme } from "@/components/theme-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";

import { useInstance } from "@/contexts/InstanceContext";

import { getTextMessageJobStatus, useManageInstance, useInstanceQRCode, useInstanceStatus } from "@/lib/queries/instance/manageInstance";
import { isBridgeUnavailableError } from "@/lib/queries/instance/bridgeAvailability";
import { useInstanceRuntime, useInstanceRuntimeHistory } from "@/lib/queries/instance/runtime";
import { TOKEN_ID } from "@/lib/queries/token";
import { getApiErrorMessage, isApiNotImplementedError, NOT_IMPLEMENTED_MESSAGE } from "@/lib/queries/errors";
import { InstanceTextMessageJobStatus, InstanceTextMessageResult } from "@/types/evolution.types";
import { toast } from "react-toastify";
import { FetchInstanceRuntimeHistoryResponse } from "@/lib/queries/instance/types";

type MessageSendUiStatus = "queued" | "sending" | "provider_sent" | "delivered" | "read" | "error";

type MessageSendFeedback = {
  status: MessageSendUiStatus;
  title: string;
  detail?: string;
};

type LifecycleFeedback = {
  action?: "reconnect" | "pair" | "logout";
  status: "idle" | "running" | "success" | "error";
  title: string;
  detail?: string;
  tone?: "info" | "success" | "warning" | "destructive";
};

const MESSAGE_JOB_POLL_INTERVAL_MS = 2500;
const MESSAGE_JOB_POLL_TIMEOUT_MS = 60000;

type MessageSendStatusPayload = Pick<
  InstanceTextMessageResult,
  "message" | "queued" | "accepted_only" | "sent" | "delivery_confirmed" | "delivery_status" | "job_id" | "delivered_at" | "read_at"
> &
  Partial<Pick<InstanceTextMessageJobStatus, "status" | "error">>;

function formatStatusTimestamp(label: string, value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return `${label}: ${parsedDate.toLocaleString()}`;
}

function notifyLifecycleFailure(detail: string, bridgeUnavailable: boolean) {
  if (bridgeUnavailable) {
    toast.warn(detail);
    return;
  }

  toast.error(detail);
}

function getMessageSendFeedback(payload: MessageSendStatusPayload): MessageSendFeedback {
  if (payload.status === "failed") {
    return {
      status: "error",
      title: "Send failed",
      detail: payload.error || payload.message,
    };
  }

  if (payload.delivery_status === "read") {
    return {
      status: "read",
      title: "Read",
      detail: formatStatusTimestamp("Read at", payload.read_at) || "The recipient has opened the message.",
    };
  }

  if (payload.delivery_status === "delivered" || payload.delivery_confirmed) {
    return {
      status: "delivered",
      title: "Delivered",
      detail: formatStatusTimestamp("Delivered at", payload.delivered_at) || "Delivery was confirmed by the provider.",
    };
  }

  if (payload.delivery_status === "sent") {
    return {
      status: "provider_sent",
      title: "Sent to provider",
      detail: "Still waiting for delivery confirmation.",
    };
  }

  if (payload.status === "running") {
    return {
      status: "sending",
      title: "Sending",
      detail: "Processing outbound message.",
    };
  }

  if (payload.status === "queued" || payload.queued === true || payload.accepted_only === true || payload.delivery_status === "queued") {
    return {
      status: "queued",
      title: "Queued",
      detail: "Waiting to be sent.",
    };
  }

  return {
    status: "queued",
    title: "Queued",
    detail: "Waiting to be sent.",
  };
}

function shouldStopMessagePolling(payload: InstanceTextMessageJobStatus): boolean {
  if (payload.status === "failed") {
    return true;
  }

  if (payload.delivery_confirmed) {
    return true;
  }

  return payload.delivery_status === "delivered" || payload.delivery_status === "read";
}

function getMessageSendAlertVariant(status: MessageSendUiStatus): "warning" | "info" | "success" | "destructive" {
  switch (status) {
    case "queued":
      return "warning";
    case "sending":
      return "info";
    case "provider_sent":
    case "delivered":
    case "read":
      return "success";
    case "error":
      return "destructive";
    default:
      return "info";
  }
}

function getRuntimeBadgeVariant(state: string): "default" | "secondary" | "warning" | "destructive" | "outline" {
  if (state === "connected" || state === "open" || state === "paired") {
    return "default";
  }

  if (state === "connecting" || state === "pairing_started" || state === "reconnect_requested") {
    return "warning";
  }

  if (state === "disconnected" || state === "logout" || state === "close" || state === "closed") {
    return "destructive";
  }

  if (state === "status_observed") {
    return "secondary";
  }

  return "outline";
}

function formatRuntimeLabel(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatOptionalTimestamp(value?: string): string {
  if (!value) {
    return "Not observed yet";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not observed yet" : parsed.toLocaleString();
}

function runtimeEventIcon(event: string) {
  switch (event) {
    case "connected":
    case "paired":
      return Wifi;
    case "pairing_started":
      return SmartphoneCharging;
    case "reconnect_requested":
      return RefreshCw;
    case "logout":
      return LogOut;
    case "disconnected":
      return WifiOff;
    case "status_observed":
      return Activity;
    default:
      return Clock3;
  }
}

function RuntimeHistoryList({ events }: { events: FetchInstanceRuntimeHistoryResponse }) {
  return (
    <div className="space-y-3">
      {events.map((event) => {
        const Icon = runtimeEventIcon(event.event);

        return (
          <div key={event.id} className="flex items-start gap-3 rounded-lg border p-3">
            <div className="rounded-full border p-2">
              <Icon className={`h-4 w-4 ${event.event === "reconnect_requested" ? "animate-pulse" : ""}`} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium">{formatRuntimeLabel(event.event)}</div>
                {event.status && (
                  <Badge variant={getRuntimeBadgeVariant(event.status)}>
                    {formatRuntimeLabel(event.status)}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{formatOptionalTimestamp(event.timestamp)}</div>
              {event.detail && <div className="text-sm text-muted-foreground">{event.detail}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DashboardInstance() {
  const { t, i18n } = useTranslation();
  const numberFormatter = new Intl.NumberFormat(i18n.language);
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [recipientNumber, setRecipientNumber] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageDelay, setMessageDelay] = useState("0");
  const [isSendingText, setIsSendingText] = useState(false);
  const [messageSendFeedback, setMessageSendFeedback] = useState<MessageSendFeedback | null>(null);
  const [textMessagingUnsupported, setTextMessagingUnsupported] = useState(false);
  const [lifecycleFeedback, setLifecycleFeedback] = useState<LifecycleFeedback | null>(null);
  const [activeLifecycleAction, setActiveLifecycleAction] = useState<LifecycleFeedback["action"] | null>(null);
  const [reconnectDialogOpen, setReconnectDialogOpen] = useState(false);
  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [backfillChatJid, setBackfillChatJid] = useState("");
  const [backfillCount, setBackfillCount] = useState("50");
  const [backfillFeedback, setBackfillFeedback] = useState<LifecycleFeedback | null>(null);
  const [isBackfillRunning, setIsBackfillRunning] = useState(false);
  const messageSendAttemptRef = useRef(0);
  const { theme } = useTheme();

  const { instance, reloadInstance } = useInstance();
  const { reconnect, pair, logout, backfillHistory, sendTextMessage } = useManageInstance();

  // Use React Query hooks for status and QR code
  const { data: instanceStatus, refetch: refetchStatus } = useInstanceStatus(instance?.id || "");
  const { data: qrCodeData, refetch: refetchQRCode } = useInstanceQRCode(instance?.id || "");
  const {
    data: runtimeState,
    isLoading: runtimeLoading,
    error: runtimeError,
    refetch: refetchRuntime,
  } = useInstanceRuntime({ instanceId: instance?.id || "" });
  const {
    data: runtimeHistory,
    isLoading: runtimeHistoryLoading,
    error: runtimeHistoryError,
    refetch: refetchRuntimeHistory,
  } = useInstanceRuntimeHistory({ instanceId: instance?.id || "" });

  useEffect(() => {
    if (instance) {
      localStorage.setItem(TOKEN_ID.INSTANCE_ID, instance.id);
      localStorage.setItem(TOKEN_ID.INSTANCE_NAME, instance.name);
      if (instance.token) {
        localStorage.setItem(TOKEN_ID.INSTANCE_TOKEN, instance.token);
      }
    }
  }, [instance]);

  // Determine if we should be actively polling (React Query handles this with refetchInterval)
  useEffect(() => {
    if (!instance?.id) return;

    // React Query will handle polling via refetchInterval automatically
    // This effect can be used for any additional UI state management if needed
  }, [instance?.id]);

  const refreshInstanceLifecycleData = async () => {
    await reloadInstance();
    await refetchStatus();
    await refetchQRCode();
    await refetchRuntime();
    await refetchRuntimeHistory();
  };

  const handleReload = async () => {
    await refreshInstanceLifecycleData();
  };

  const handleReconnect = async (instanceId: string) => {
    setActiveLifecycleAction("reconnect");
    setReconnectDialogOpen(true);
    try {
      setLifecycleFeedback({
        action: "reconnect",
        status: "running",
        title: "Requesting reconnect",
        detail: "Waiting for the backend to reopen the session and refresh runtime state.",
        tone: "info",
      });
      setQRCode(null);
      setPairingCode("");
      await reconnect(instanceId);
      await refreshInstanceLifecycleData();
      setLifecycleFeedback({
        action: "reconnect",
        status: "success",
        title: "Reconnect requested",
        detail: "Runtime status, QR availability, and lifecycle history were refreshed. A live QR may still be unavailable for the current session state.",
        tone: "success",
      });
    } catch (error) {
      console.error("Error:", error);
      const detail = getApiErrorMessage(error, "Failed to request reconnect.");
      const bridgeUnavailable = isBridgeUnavailableError(error);
      setLifecycleFeedback({
        action: "reconnect",
        status: "error",
        title: bridgeUnavailable ? "Reconnect unavailable" : "Reconnect failed",
        detail,
        tone: bridgeUnavailable ? "warning" : "destructive",
      });
      notifyLifecycleFailure(detail, bridgeUnavailable);
    } finally {
      setActiveLifecycleAction(null);
    }
  };

  const handleLogout = async (instanceId: string) => {
    setActiveLifecycleAction("logout");
    try {
      setLifecycleFeedback({
        action: "logout",
        status: "running",
        title: "Logging out instance",
        detail: "Waiting for logout to complete and for runtime state to refresh.",
        tone: "info",
      });
      setQRCode(null);
      setPairingCode("");
      await logout(instanceId);
      await refreshInstanceLifecycleData();
      setLifecycleFeedback({
        action: "logout",
        status: "success",
        title: "Logout completed",
        detail: "Runtime status and lifecycle history were refreshed after the logout request.",
        tone: "success",
      });
    } catch (error) {
      console.error("Error:", error);
      const detail = getApiErrorMessage(error, "Failed to log out the instance.");
      const bridgeUnavailable = isBridgeUnavailableError(error);
      setLifecycleFeedback({
        action: "logout",
        status: "error",
        title: bridgeUnavailable ? "Logout unavailable" : "Logout failed",
        detail,
        tone: bridgeUnavailable ? "warning" : "destructive",
      });
      notifyLifecycleFailure(detail, bridgeUnavailable);
    } finally {
      setActiveLifecycleAction(null);
    }
  };

  const handlePairingCode = async (instanceId: string) => {
    if (!instance?.number) {
      toast.error("A phone number is required before requesting a pairing code.");
      return;
    }

    setActiveLifecycleAction("pair");
    setPairDialogOpen(true);
    try {
      setLifecycleFeedback({
        action: "pair",
        status: "running",
        title: "Requesting pairing code",
        detail: "Waiting for the backend to generate a code for this phone number.",
        tone: "info",
      });
      setQRCode(null);
      setPairingCode("");
      const data = await pair({
        instanceId,
        phone: instance.number,
      });

      setPairingCode(data.pairingCode || data.code || "");
      await refreshInstanceLifecycleData();
      setLifecycleFeedback({
        action: "pair",
        status: "success",
        title: "Pairing code ready",
        detail: "Use the code below in WhatsApp if one was returned. Runtime status and lifecycle history were refreshed.",
        tone: "success",
      });
    } catch (error) {
      console.error("Error:", error);
      const detail = getApiErrorMessage(error, "Failed to request a pairing code.");
      const bridgeUnavailable = isBridgeUnavailableError(error);
      setLifecycleFeedback({
        action: "pair",
        status: "error",
        title: bridgeUnavailable ? "Pairing unavailable" : "Pairing request failed",
        detail,
        tone: bridgeUnavailable ? "warning" : "destructive",
      });
      notifyLifecycleFailure(detail, bridgeUnavailable);
    } finally {
      setActiveLifecycleAction(null);
    }
  };

  const closeQRCodePopup = async () => {
    setReconnectDialogOpen(false);
    setPairDialogOpen(false);
    setQRCode(null);
    setPairingCode("");
    await reloadInstance();
  };

  const handleHistoryBackfill = async () => {
    if (!instance?.id) {
      return;
    }

    const chatJid = backfillChatJid.trim();
    const parsedCount = Number.parseInt(backfillCount, 10);

    if (!chatJid) {
      toast.error("Chat JID is required to request history backfill.");
      return;
    }

    if (!Number.isFinite(parsedCount) || parsedCount <= 0) {
      toast.error("Backfill count must be greater than 0.");
      return;
    }

    try {
      setIsBackfillRunning(true);
      setBackfillFeedback({
        status: "running",
        title: "Requesting history backfill",
        detail: "This asks the live bridge for a bounded history sync. It does not guarantee a full replay.",
        tone: "info",
      });

      const result = await backfillHistory({
        instanceId: instance.id,
        data: {
          chat_jid: chatJid,
          count: parsedCount,
        },
      });

      await refreshInstanceLifecycleData();
      if (result.accepted) {
        const acceptedDetail = result.operatorMessage
          ? `${result.operatorMessage} Requested count (${parsedCount}) is request scope only, not the number of rows imported.`
          : `The bridge accepted a bounded recovery request for ${chatJid}. The requested count (${parsedCount}) is only the requested scope, not the number of rows imported.`;
        setBackfillFeedback({
          status: "success",
          title: "History backfill requested",
          detail: acceptedDetail,
          tone: "success",
        });
      } else {
        const detail =
          result.operatorMessage ||
          `The backend did not accept the recovery request for ${chatJid}. The requested count (${parsedCount}) was not applied.`;
        setBackfillFeedback({
          status: "error",
          title: "History backfill not accepted",
          detail,
          tone: "warning",
        });
        toast.warn(detail);
      }
    } catch (error) {
      console.error("Error:", error);
      const detail = getApiErrorMessage(error, "Unable to request history backfill.");
      const bridgeUnavailable = isBridgeUnavailableError(error);
      setBackfillFeedback({
        status: "error",
        title: bridgeUnavailable ? "History backfill unavailable" : "History backfill failed",
        detail,
        tone: bridgeUnavailable ? "warning" : "destructive",
      });
      notifyLifecycleFailure(detail, bridgeUnavailable);
    } finally {
      setIsBackfillRunning(false);
    }
  };

  const handleSendTextMessage = async () => {
    if (!instance?.id) {
      return;
    }

    const number = recipientNumber.trim();
    const text = messageText.trim();
    const parsedDelay = Number.parseInt(messageDelay, 10);

    if (!number || !text) {
      toast.error("Recipient number and message are required.");
      return;
    }

    if (!Number.isFinite(parsedDelay) || parsedDelay < 0) {
      toast.error("Delay must be 0 or greater.");
      return;
    }

    try {
      setIsSendingText(true);
      const attemptId = Date.now();
      messageSendAttemptRef.current = attemptId;
      setMessageSendFeedback(null);

      const response = await sendTextMessage({
        instanceId: instance.id,
        data: {
          number,
          text,
          delay: parsedDelay,
        },
      });

      setMessageText("");
      setMessageDelay("0");
      setTextMessagingUnsupported(false);
      const initialFeedback =
        response.httpStatus === 202
          ? getMessageSendFeedback({
              ...response,
              status: "queued",
              delivery_status: "queued",
            })
          : getMessageSendFeedback(response);
      setMessageSendFeedback(initialFeedback);

      if (response.httpStatus === 202 && response.status_endpoint) {
        const startedAt = Date.now();
        let lastFeedback = initialFeedback;

        while (Date.now() - startedAt < MESSAGE_JOB_POLL_TIMEOUT_MS) {
          await new Promise((resolve) => window.setTimeout(resolve, MESSAGE_JOB_POLL_INTERVAL_MS));

          if (messageSendAttemptRef.current !== attemptId) {
            return;
          }

          const jobStatus = await getTextMessageJobStatus(response.status_endpoint);
          lastFeedback = getMessageSendFeedback({
            ...jobStatus,
            message: response.message,
          });
          setMessageSendFeedback(lastFeedback);

          if (jobStatus.status === "failed") {
            toast.error(jobStatus.error || "Send failed");
            return;
          }

          if (shouldStopMessagePolling(jobStatus)) {
            return;
          }
        }

        if (messageSendAttemptRef.current === attemptId) {
          setMessageSendFeedback({
            ...lastFeedback,
            detail: `${lastFeedback.detail ? `${lastFeedback.detail} ` : ""}Still waiting for final backend confirmation.`,
          });
        }
        return;
      }

      if (initialFeedback.status === "error") {
        toast.error(initialFeedback.detail || initialFeedback.title);
      }
    } catch (error) {
      console.error("Error:", error);
      if (isApiNotImplementedError(error)) {
        setTextMessagingUnsupported(true);
        return;
      }
      setMessageSendFeedback({
        status: "error",
        title: "Send failed",
        detail: getApiErrorMessage(error, "Unable to send the message."),
      });
      toast.error(getApiErrorMessage(error, "Unable to send the message."));
    } finally {
      setIsSendingText(false);
    }
  };

  const stats = useMemo(() => {
    return {
      contacts: instance?.stats.contacts ?? null,
      chats: instance?.stats.chats ?? null,
      messages: instance?.stats.messages ?? null,
    };
  }, [instance]);

  const formatStat = (value: number | null) => {
    if (value === null) {
      return t("common.notAvailable") || "N/A";
    }
    return numberFormatter.format(value);
  };

  const qrCodeColor = useMemo(() => {
    if (theme === "dark") {
      return "#fff";
    }
    if (theme === "light") {
      return "#000";
    }
    return "#189d68";
  }, [theme]);

  // Determine QR code display value
  const displayQRCode = useMemo(() => {
    if (qrCodeData?.qrcode) {
      // If it's already a data URL, use it directly
      if (qrCodeData.qrcode.startsWith('data:image/')) {
        return qrCodeData.qrcode;
      }
      // If it's base64, construct data URL
      if (qrCodeData.qrcode.match(/^[A-Za-z0-9+/=]+$/)) {
        return `data:image/png;base64,${qrCodeData.qrcode}`;
      }
      // Otherwise, treat as text for QR generation
      return qrCodeData.qrcode;
    }
    return qrCode || qrCodeData?.code || pairingCode;
  }, [qrCodeData, qrCode, pairingCode]);

  // Determine if QR should be shown as image or generated
  const isQRImage = useMemo(() => {
    return displayQRCode?.startsWith('data:image/') || displayQRCode?.match(/^data:image\/png;base64,/);
  }, [displayQRCode]);

  const isLifecycleRunning = activeLifecycleAction !== null;
  const lifecycleVariant = lifecycleFeedback?.tone ?? "info";
  const backfillVariant = backfillFeedback?.tone ?? "info";
  const showReconnectDialogError = reconnectDialogOpen && lifecycleFeedback?.action === "reconnect" && lifecycleFeedback.status === "error";
  const showPairDialogError = pairDialogOpen && lifecycleFeedback?.action === "pair" && lifecycleFeedback.status === "error";
  const showReconnectDialogLoading = reconnectDialogOpen && activeLifecycleAction === "reconnect";
  const showPairDialogLoading = pairDialogOpen && activeLifecycleAction === "pair";

  if (!instance) {
    return <LoadingSpinner />;
  }

  return (
    <main className="flex flex-col gap-8">
      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="break-all text-lg font-semibold">{instance.name}</h2>
              <InstanceStatus status={instance.connectionStatus} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-start space-y-6">
            <div className="flex w-full flex-1">
              <InstanceToken token={instance.token} />
            </div>

            {instance.connectionStatus !== "open" && displayQRCode && (
              <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">{t("instance.dashboard.qr.title") || "QR Code for Connection"}</h3>
                <div className="flex items-center justify-center">
                  {isQRImage ? (
                    <img src={displayQRCode} alt="QR Code" className="max-w-64 max-h-64" />
                  ) : (
                    <QRCode value={displayQRCode} size={256} bgColor="transparent" fgColor={qrCodeColor} className="rounded-sm" />
                  )}
                </div>
                {pairingCode && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{t("instance.dashboard.pairingCode.title") || "Or use pairing code:"}</p>
                    <p className="text-lg font-mono font-bold">
                      {pairingCode.substring(0, 4)}-{pairingCode.substring(4, 8)}
                    </p>
                  </div>
                )}
                {(instanceStatus?.status === "connecting" || instanceStatus?.status === "qrcode" || instance?.connectionStatus === "connecting" || instance?.connectionStatus === "qrcode") && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoadingSpinner size={16} />
                    <span>{t("instance.dashboard.connecting") || "Connecting..."}</span>
                  </div>
                )}
              </div>
            )}
            {instance.connectionStatus !== "open" && (
              <Alert variant="warning" className="flex flex-wrap items-center justify-between gap-3">
                <AlertTitle className="text-lg font-bold tracking-wide">{t("instance.dashboard.alert")}</AlertTitle>

                <Dialog open={reconnectDialogOpen} onOpenChange={(open) => void (open ? setReconnectDialogOpen(true) : closeQRCodePopup())}>
                  <Button variant="warning" disabled={isLifecycleRunning} onClick={() => void handleReconnect(instance.id)}>
                    {activeLifecycleAction === "reconnect" ? "Requesting reconnect..." : "Reconnect with QR"}
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reconnect with QR</DialogTitle>
                      <DialogDescription>
                        Scan this QR code with WhatsApp after requesting reconnect. The backend decides whether a live QR is available for the current session state.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center">
                      {showReconnectDialogLoading ? (
                        <LoadingSpinner />
                      ) : showReconnectDialogError ? (
                        <Alert variant="warning">
                          <AlertTitle>{lifecycleFeedback.title}</AlertTitle>
                          {lifecycleFeedback.detail && <AlertDescription>{lifecycleFeedback.detail}</AlertDescription>}
                        </Alert>
                      ) : displayQRCode ? (
                        isQRImage ? (
                          <img src={displayQRCode} alt="QR Code" className="max-w-64 max-h-64" />
                        ) : (
                          <QRCode value={displayQRCode} size={256} bgColor="transparent" fgColor={qrCodeColor} className="rounded-sm" />
                        )
                      ) : (
                        <Alert variant="warning">
                          <AlertTitle>No live QR returned</AlertTitle>
                          <AlertDescription>The reconnect request finished, but the backend did not expose a QR for the current session state.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {instance.number && (
                  <Dialog open={pairDialogOpen} onOpenChange={(open) => void (open ? setPairDialogOpen(true) : closeQRCodePopup())}>
                    <Button type="button" className="connect-code-button" disabled={isLifecycleRunning} onClick={() => void handlePairingCode(instance.id)}>
                      {activeLifecycleAction === "pair" ? "Requesting code..." : "Pair with code"}
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Pair with code</DialogTitle>
                        <DialogDescription>
                          {showPairDialogLoading ? (
                            <div className="flex justify-center py-3">
                              <LoadingSpinner />
                            </div>
                          ) : showPairDialogError ? (
                            <Alert variant="warning">
                              <AlertTitle>{lifecycleFeedback.title}</AlertTitle>
                              {lifecycleFeedback.detail && <AlertDescription>{lifecycleFeedback.detail}</AlertDescription>}
                            </Alert>
                          ) : pairingCode ? (
                            <div className="py-3">
                              <p className="text-center">
                                <strong>Pair with code</strong>
                              </p>
                              <p className="pairing-code text-center">
                                {pairingCode.substring(0, 4)}-{pairingCode.substring(4, 8)}
                              </p>
                            </div>
                          ) : (
                            <Alert variant="warning">
                              <AlertTitle>No pairing code returned</AlertTitle>
                              <AlertDescription>The request finished, but the backend did not return a pairing code for this session state.</AlertDescription>
                            </Alert>
                          )}
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                )}
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="outline" className="refresh-button" size="icon" onClick={handleReload} disabled={isLifecycleRunning || isBackfillRunning}>
              <RefreshCw size="20" />
            </Button>
            <Button className="action-button" variant="secondary" onClick={() => void handleReconnect(instance.id)} disabled={isLifecycleRunning}>
              {activeLifecycleAction === "reconnect" ? "REQUESTING..." : "RECONNECT"}
            </Button>
            <Button variant="destructive" onClick={() => void handleLogout(instance.id)} disabled={instance.connectionStatus === "close" || isLifecycleRunning}>
              {activeLifecycleAction === "logout" ? "LOGGING OUT..." : "LOG OUT"}
            </Button>
          </CardFooter>
        </Card>
      </section>
      <section className="grid grid-cols-[repeat(auto-fit,_minmax(15rem,_1fr))] gap-6">
        <Card className="instance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleUser size="20" />
              {t("instance.dashboard.contacts")}
            </CardTitle>
          </CardHeader>
          <CardContent>{formatStat(stats.contacts)}</CardContent>
        </Card>
        <Card className="instance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound size="20" />
              {t("instance.dashboard.chats")}
            </CardTitle>
          </CardHeader>
          <CardContent>{formatStat(stats.chats)}</CardContent>
        </Card>
        <Card className="instance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle size="20" />
              {t("instance.dashboard.messages")}
            </CardTitle>
          </CardHeader>
          <CardContent>{formatStat(stats.messages)}</CardContent>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size="20" />
              Runtime status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This panel reflects the durable runtime endpoint. It is the best current operator view, but final truth can still lag when the bridge is temporarily unavailable.
            </p>
            {runtimeError ? (
              <Alert variant={isBridgeUnavailableError(runtimeError) ? "warning" : "destructive"}>
                <AlertTitle>{isBridgeUnavailableError(runtimeError) ? "Runtime status temporarily unavailable" : "Runtime status unavailable"}</AlertTitle>
                <AlertDescription>{getApiErrorMessage(runtimeError, "Unable to load runtime state.")}</AlertDescription>
              </Alert>
            ) : null}
            {runtimeLoading && !runtimeState ? (
              <div className="flex min-h-32 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : runtimeState ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Current runtime state</div>
                  <Badge variant={getRuntimeBadgeVariant(runtimeState.state)}>{formatRuntimeLabel(runtimeState.state)}</Badge>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Last observed status</div>
                  <Badge variant={getRuntimeBadgeVariant(runtimeState.lastObservedStatus || "unknown")}>
                    {formatRuntimeLabel(runtimeState.lastObservedStatus)}
                  </Badge>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Bridge signal</div>
                  {runtimeState.bridgeHealthy === undefined ? (
                    <Badge variant="outline">Not reported</Badge>
                  ) : runtimeState.bridgeHealthy ? (
                    <Badge variant="default">Healthy</Badge>
                  ) : (
                    <Badge variant="warning">Degraded</Badge>
                  )}
                </div>
                <div className="rounded-lg border p-4 md:col-span-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Last updated</div>
                  <div className="text-sm">{formatOptionalTimestamp(runtimeState.lastUpdatedAt)}</div>
                </div>
              </div>
            ) : !runtimeError ? (
              <Alert variant="warning">
                <AlertTitle>No runtime status returned</AlertTitle>
                <AlertDescription>The backend runtime endpoint is active, but it did not return a current state for this instance yet.</AlertDescription>
              </Alert>
            ) : null}
            {lifecycleFeedback && lifecycleFeedback.status !== "idle" && (
              <Alert variant={lifecycleVariant}>
                <AlertTitle>{lifecycleFeedback.title}</AlertTitle>
                {lifecycleFeedback.detail && <AlertDescription>{lifecycleFeedback.detail}</AlertDescription>}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 size="20" />
              Runtime history
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Recent lifecycle events help explain why an instance is connected, disconnected, pairing, or recovering. Event completeness still depends on bridge availability.
            </p>
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">History recovery</div>
              <p className="mb-4 text-sm text-muted-foreground">
                Request a bounded history backfill for one WhatsApp chat JID. This is a recovery tool, not a guaranteed full replay, and it only works when the live bridge can return a sync blob.
              </p>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_auto]">
                <div className="grid gap-2">
                  <Label htmlFor="history-backfill-chat-jid">Chat JID</Label>
                  <Input
                    id="history-backfill-chat-jid"
                    value={backfillChatJid}
                    onChange={(event) => setBackfillChatJid(event.target.value)}
                    placeholder="5215512345678@s.whatsapp.net"
                    disabled={isBackfillRunning}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="history-backfill-count">Count</Label>
                  <Input
                    id="history-backfill-count"
                    type="number"
                    min="1"
                    max="200"
                    value={backfillCount}
                    onChange={(event) => setBackfillCount(event.target.value)}
                    disabled={isBackfillRunning}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleHistoryBackfill}
                    disabled={isBackfillRunning || instance.connectionStatus !== "open"}>
                    {isBackfillRunning ? "Requesting..." : "Request backfill"}
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                The backend needs a stored anchor for this chat JID and a live bridge session. If the bridge is offline or no anchor exists, the request will fail honestly.
              </p>
            </div>
            {backfillFeedback && backfillFeedback.status !== "idle" && (
              <Alert variant={backfillVariant}>
                <AlertTitle>{backfillFeedback.title}</AlertTitle>
                {backfillFeedback.detail && <AlertDescription>{backfillFeedback.detail}</AlertDescription>}
              </Alert>
            )}
            {runtimeHistoryError ? (
              <Alert variant={isBridgeUnavailableError(runtimeHistoryError) ? "warning" : "destructive"}>
                <AlertTitle>{isBridgeUnavailableError(runtimeHistoryError) ? "Runtime history temporarily unavailable" : "Runtime history unavailable"}</AlertTitle>
                <AlertDescription>{getApiErrorMessage(runtimeHistoryError, "Unable to load runtime history.")}</AlertDescription>
              </Alert>
            ) : null}
            {runtimeHistoryLoading && !runtimeHistory ? (
              <div className="flex min-h-32 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : runtimeHistory && runtimeHistory.length > 0 ? (
              <RuntimeHistoryList events={runtimeHistory.slice(0, 10)} />
            ) : !runtimeHistoryError ? (
              <Alert variant="warning">
                <AlertTitle>No runtime history yet</AlertTitle>
                <AlertDescription>The runtime history endpoint is active, but there are no recent lifecycle events stored for this instance yet.</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </section>
      <section>
        {textMessagingUnsupported ? (
          <UnsupportedInstanceFeature description={NOT_IMPLEMENTED_MESSAGE} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Send text message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This instance action uses the current backend route for direct text sending. For full thread context, use the supported chat list and conversation routes.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="instance-send-number">Recipient number</Label>
                <Input
                  id="instance-send-number"
                  value={recipientNumber}
                  onChange={(event) => setRecipientNumber(event.target.value)}
                  placeholder="5215512345678"
                  disabled={instance.connectionStatus !== "open" || isSendingText}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instance-send-message">Message</Label>
                <Textarea
                  id="instance-send-message"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Write the text you want to send"
                  disabled={instance.connectionStatus !== "open" || isSendingText}
                />
              </div>
              <div className="grid gap-2 md:max-w-40">
                <Label htmlFor="instance-send-delay">Delay (ms)</Label>
                <Input
                  id="instance-send-delay"
                  type="number"
                  min="0"
                  step="1"
                  value={messageDelay}
                  onChange={(event) => setMessageDelay(event.target.value)}
                  disabled={instance.connectionStatus !== "open" || isSendingText}
                />
              </div>
              {messageSendFeedback && (
                <Alert variant={getMessageSendAlertVariant(messageSendFeedback.status)}>
                  <AlertTitle>{messageSendFeedback.title}</AlertTitle>
                  {messageSendFeedback.detail && <AlertDescription>{messageSendFeedback.detail}</AlertDescription>}
                </Alert>
              )}
              {instance.connectionStatus !== "open" && (
                <Alert variant="warning">
                  <AlertTitle>Connect the instance before sending text messages.</AlertTitle>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSendTextMessage} disabled={instance.connectionStatus !== "open" || isSendingText || !recipientNumber.trim() || !messageText.trim()}>
                {isSendingText ? "Sending..." : "Send text"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </section>
    </main>
  );
}

export { DashboardInstance };
