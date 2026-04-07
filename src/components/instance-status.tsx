import { useTranslation } from "react-i18next";

import { Badge } from "./ui/badge";

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function InstanceStatus({ status }: { status: string }) {
  const { t } = useTranslation();

  if (!status) {
    return null;
  }

  if (status === "open") return <Badge>{t("status.open")}</Badge>;

  if (status === "connecting") return <Badge variant="warning">{t("status.connecting")}</Badge>;

  if (status === "qrcode") return <Badge variant="warning">QR Ready</Badge>;

  if (status === "logout" || status === "disconnected" || status === "close" || status === "closed") {
    return <Badge variant="destructive">{t("status.closed")}</Badge>;
  }

  return <Badge variant="secondary">{formatStatusLabel(status)}</Badge>;
}
