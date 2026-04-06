import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { ChatCapabilities, ChatCapabilityState } from "@/lib/queries/chat/types";

const capabilityMeta: Record<ChatCapabilityState, { label: string; icon: typeof CheckCircle2; className: string }> = {
  available: {
    label: "Available",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  pending_backend: {
    label: "Waiting on backend",
    icon: Clock3,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  checking: {
    label: "Checking",
    icon: LoaderCircle,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  unavailable: {
    label: "Unavailable",
    icon: XCircle,
    className: "border-zinc-200 bg-zinc-50 text-zinc-700",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

function CapabilityBadge({ state }: { state: ChatCapabilityState }) {
  const meta = capabilityMeta[state];
  const Icon = meta.icon;

  return (
    <Badge variant="outline" className={`gap-1 ${meta.className}`}>
      <Icon className={`h-3.5 w-3.5 ${state === "checking" ? "animate-spin" : ""}`} />
      {meta.label}
    </Badge>
  );
}

function ChatCapabilityStatus({ capabilities }: { capabilities: ChatCapabilities }) {
  const rows = [
    { label: "Chat list", state: capabilities.chatList },
    { label: "Message history", state: capabilities.messageHistory },
    { label: "Text send", state: capabilities.textSend },
    { label: "Media send", state: capabilities.mediaSend },
    { label: "Audio send", state: capabilities.audioSend },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {rows.map((row) => (
        <div key={row.label} className="rounded-lg border p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">{row.label}</div>
          <CapabilityBadge state={row.state} />
        </div>
      ))}
    </div>
  );
}

export { ChatCapabilityStatus };
