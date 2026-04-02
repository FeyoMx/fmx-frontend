/* eslint-disable react-hooks/exhaustive-deps */
import { CircleUser, MessageCircle, RefreshCw, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

import { InstanceStatus } from "@/components/instance-status";
import { InstanceToken } from "@/components/instance-token";
import { useTheme } from "@/components/theme-provider";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";

import { useInstance } from "@/contexts/InstanceContext";

import { useManageInstance, useInstanceQRCode, useInstanceStatus } from "@/lib/queries/instance/manageInstance";
import { TOKEN_ID } from "@/lib/queries/token";
import { getApiErrorMessage } from "@/lib/queries/errors";
import { toast } from "react-toastify";

function DashboardInstance() {
  const { t, i18n } = useTranslation();
  const numberFormatter = new Intl.NumberFormat(i18n.language);
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [recipientNumber, setRecipientNumber] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageDelay, setMessageDelay] = useState("0");
  const [isSendingText, setIsSendingText] = useState(false);
  const { theme } = useTheme();

  const { instance, reloadInstance } = useInstance();
  const { connect, logout, restart, sendTextMessage } = useManageInstance();

  // Use React Query hooks for status and QR code
  const { data: instanceStatus, refetch: refetchStatus } = useInstanceStatus(instance?.id || "");
  const { data: qrCodeData, refetch: refetchQRCode } = useInstanceQRCode(instance?.id || "");

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

  const handleReload = async () => {
    await reloadInstance();
  };

  const handleRestart = async (instanceId: string) => {
    try {
      await restart(instanceId);
      await reloadInstance();
    } catch (error) {
      console.error("Error:", error);
      toast.error(getApiErrorMessage(error, "Failed to restart instance"));
    }
  };

  const handleLogout = async (instanceId: string) => {
    try {
      await logout(instanceId);
      await reloadInstance();
    } catch (error) {
      console.error("Error:", error);
      toast.error(getApiErrorMessage(error, "Failed to disconnect instance"));
    }
  };

  const handleConnect = async (instanceId: string, pairingCode: boolean) => {
    try {
      setQRCode(null);
      setPairingCode("");

      if (pairingCode) {
        const data = await connect({
          instanceId,
          number: instance?.number,
        });

        setPairingCode(data.pairingCode || data.code);
      } else {
        await connect({ instanceId });
      }

      // Refresh instance data after connect
      await reloadInstance();
      // Refetch status and QR code
      await refetchStatus();
      await refetchQRCode();
    } catch (error) {
      console.error("Error:", error);
      toast.error(getApiErrorMessage(error, "Failed to connect instance"));
    }
  };

  const closeQRCodePopup = async () => {
    setQRCode(null);
    setPairingCode("");
    await reloadInstance();
  };

  const handleSendTextMessage = async () => {
    if (!instance?.id) {
      return;
    }

    const number = recipientNumber.trim();
    const text = messageText.trim();
    const parsedDelay = Number.parseInt(messageDelay, 10);

    if (!number || !text) {
      toast.error("Recipient number and message text are required.");
      return;
    }

    if (!Number.isFinite(parsedDelay) || parsedDelay < 0) {
      toast.error("Delay must be zero or greater.");
      return;
    }

    try {
      setIsSendingText(true);
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
      toast.success(response?.data?.messageId ? `Message sent (${response.data.messageId})` : "Message sent successfully.");
    } catch (error) {
      console.error("Error:", error);
      toast.error(getApiErrorMessage(error, "Failed to send text message"));
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

                <Dialog>
                  <DialogTrigger onClick={() => handleConnect(instance.id, false)} asChild>
                    <Button variant="warning">{t("instance.dashboard.button.qrcode.label")}</Button>
                  </DialogTrigger>
                  <DialogContent onCloseAutoFocus={closeQRCodePopup}>
                    <DialogHeader>
                      <DialogTitle>{t("instance.dashboard.button.qrcode.title")}</DialogTitle>
                      <DialogDescription>
                        {t("instance.dashboard.button.qrcode.description") || "Scan this QR code with WhatsApp to connect your instance"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center">
                      {displayQRCode ? (
                        isQRImage ? (
                          <img src={displayQRCode} alt="QR Code" className="max-w-64 max-h-64" />
                        ) : (
                          <QRCode value={displayQRCode} size={256} bgColor="transparent" fgColor={qrCodeColor} className="rounded-sm" />
                        )
                      ) : (
                        <LoadingSpinner />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {instance.number && (
                  <Dialog>
                    <DialogTrigger className="connect-code-button" onClick={() => handleConnect(instance.id, true)}>
                      {t("instance.dashboard.button.pairingCode.label")}
                    </DialogTrigger>
                    <DialogContent onCloseAutoFocus={closeQRCodePopup}>
                      <DialogHeader>
                        <DialogTitle>{t("instance.dashboard.button.pairingCode.title")}</DialogTitle>
                        <DialogDescription>
                          {displayQRCode ? (
                            <div className="py-3">
                              <p className="text-center">
                                <strong>{t("instance.dashboard.button.pairingCode.title")}</strong>
                              </p>
                              <p className="pairing-code text-center">
                                {displayQRCode.substring(0, 4)}-{displayQRCode.substring(4, 8)}
                              </p>
                            </div>
                          ) : (
                            <LoadingSpinner />
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
            <Button variant="outline" className="refresh-button" size="icon" onClick={handleReload}>
              <RefreshCw size="20" />
            </Button>
            <Button className="action-button" variant="secondary" onClick={() => handleRestart(instance.id)}>
              {t("instance.dashboard.button.restart").toUpperCase()}
            </Button>
            <Button variant="destructive" onClick={() => handleLogout(instance.id)} disabled={instance.connectionStatus === "close"}>
              {t("instance.dashboard.button.disconnect").toUpperCase()}
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
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Send text message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This instance action uses the current backend route for text-only messaging. Media, audio, and chat search remain unavailable in the SaaS UI.
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
      </section>
    </main>
  );
}

export { DashboardInstance };
