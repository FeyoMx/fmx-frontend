export function formatOperatorTimestamp(value?: string | null, fallback = "Not available"): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleString();
}

export function formatCompactTimestamp(value?: string | null, fallback = "-"): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(value?: string | null, fallback = "Not observed yet"): string {
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
    return diffMs >= 0 ? "Just now" : "In under a minute";
  }

  if (diffMinutes < 60) {
    return diffMs >= 0 ? `${diffMinutes} min ago` : `In ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return diffMs >= 0 ? `${diffHours} hr ago` : `In ${diffHours} hr`;
  }

  const diffDays = Math.round(diffHours / 24);
  return diffMs >= 0 ? `${diffDays} day${diffDays === 1 ? "" : "s"} ago` : `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

export function truncateOperatorText(value: string, max = 120): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

export function formatOperatorStatusLabel(value?: string | null, fallback = "Unknown"): string {
  if (!value) {
    return fallback;
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
