import { Badge } from "./ui/badge";

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function InstanceStatus({ status }: { status: string }) {
  if (!status) {
    return null;
  }

  if (status === "open") return <Badge>Disponible</Badge>;

  if (status === "connecting") return <Badge variant="warning">Conectando</Badge>;

  if (status === "qrcode") return <Badge variant="warning">QR pendiente</Badge>;

  if (status === "logout" || status === "disconnected" || status === "close" || status === "closed") {
    return <Badge variant="destructive">Sin conexión</Badge>;
  }

  return <Badge variant="secondary">{formatStatusLabel(status)}</Badge>;
}
