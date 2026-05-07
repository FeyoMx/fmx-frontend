const SPANISH_LOCALE = "es-MX";

export function formatUnknown(value?: string | number | null, fallback = "No disponible"): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : fallback;
}

export function formatProfileName(value?: string | null): string {
  return formatUnknown(value, "Perfil pendiente");
}

export function formatOwnerJid(value?: string | null): string {
  const normalized = formatUnknown(value, "Número propietario pendiente");
  if (normalized === "Número propietario pendiente") {
    return normalized;
  }

  return normalized.split("@")[0] || "Número propietario pendiente";
}

export function formatOperatorTimestamp(value?: string | null, fallback = "No disponible"): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleString(SPANISH_LOCALE);
}

export function formatCompactTimestamp(value?: string | null, fallback = "No disponible"): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleString(SPANISH_LOCALE, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(value?: string | null, fallback = "Actualización pendiente"): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.round(Math.abs(diffMs) / 60000);

  if (diffMinutes < 1) {
    return diffMs >= 0 ? "hace un momento" : "en menos de 1 min";
  }

  if (diffMinutes < 60) {
    return diffMs >= 0 ? `hace ${diffMinutes} min` : `en ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return diffMs >= 0 ? `hace ${diffHours} h` : `en ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return diffMs >= 0 ? `hace ${diffDays} d` : `en ${diffDays} d`;
}

export const formatRelativeTimeEs = formatRelativeTime;

export function truncateOperatorText(value: string, max = 120): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

export function formatOperatorStatusLabel(value?: string | null, fallback = "No disponible"): string {
  if (!value) {
    return fallback;
  }

  const labels: Record<string, string> = {
    queued: "En cola",
    processing: "En proceso",
    completed: "Completado",
    completed_with_failures: "Completado con fallos",
    failed: "Fallido",
    pending: "Pendiente",
    sent: "Enviado",
    open: "Disponible",
    close: "Cerrado",
    closed: "Cerrado",
    connecting: "Conectando",
    qrcode: "QR pendiente",
    disconnected: "Sin conexión",
    logout: "Sesión cerrada",
  };

  if (labels[value]) {
    return labels[value];
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
