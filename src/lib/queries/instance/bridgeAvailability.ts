import { isAxiosError } from "axios";

type BridgeUnavailableContext = "reconnect" | "pair" | "logout" | "runtime" | "runtime-history" | "history-backfill";

type ErrorPayload = {
  error?: string;
  message?: string;
  response?: {
    message?: string;
  };
};

const BRIDGE_UNAVAILABLE_NAME = "BridgeUnavailableError";

const BRIDGE_HINTS = [
  "bridge unavailable",
  "bridge is unavailable",
  "runtime unavailable",
  "runtime is unavailable",
  "live runtime unavailable",
  "live runtime is unavailable",
  "bridge offline",
  "runtime offline",
];

class BridgeUnavailableError extends Error {
  readonly status?: number;
  readonly cause: unknown;

  constructor(message: string, cause: unknown, status?: number) {
    super(message);
    this.name = BRIDGE_UNAVAILABLE_NAME;
    this.cause = cause;
    this.status = status;
  }
}

const normalizeText = (value?: string): string => value?.trim().toLowerCase() ?? "";

const extractApiMessage = (error: unknown): string => {
  if (!isAxiosError<ErrorPayload>(error)) {
    return error instanceof Error ? error.message : "";
  }

  const payload = error.response?.data;
  return payload?.message ?? payload?.response?.message ?? payload?.error ?? error.message ?? "";
};

const extractApiCode = (error: unknown): string => {
  if (!isAxiosError<ErrorPayload>(error)) {
    return "";
  }

  return error.response?.data?.error?.trim().toLowerCase() ?? "";
};

const includesBridgeHint = (value: string): boolean => BRIDGE_HINTS.some((hint) => value.includes(hint));

export const isBridgeUnavailableApiError = (error: unknown): boolean => {
  if (!isAxiosError<ErrorPayload>(error)) {
    return false;
  }

  const status = error.response?.status;
  const message = normalizeText(extractApiMessage(error));
  const code = normalizeText(extractApiCode(error));

  if (status === 409) {
    return true;
  }

  if (status !== 500) {
    return false;
  }

  return code === "internal_error" || includesBridgeHint(message) || includesBridgeHint(code);
};

export const getBridgeUnavailableMessage = (context: BridgeUnavailableContext): string => {
  switch (context) {
    case "reconnect":
      return "Reconnect could not be completed because the live runtime bridge is unavailable.";
    case "pair":
      return "A pairing code could not be generated because the live runtime bridge is unavailable.";
    case "logout":
      return "Logout could not be completed because the live runtime bridge is unavailable.";
    case "runtime":
      return "The live runtime bridge is unavailable, so the dashboard cannot load current runtime state right now.";
    case "runtime-history":
      return "The live runtime bridge is unavailable, so the dashboard cannot load recent runtime history right now.";
    case "history-backfill":
      return "History backfill could not be requested because the live runtime bridge is unavailable.";
    default:
      return "The live runtime bridge is unavailable right now.";
  }
};

export const normalizeBridgeUnavailableError = (error: unknown, context: BridgeUnavailableContext): unknown => {
  if (!isBridgeUnavailableApiError(error)) {
    return error;
  }

  const status = isAxiosError(error) ? error.response?.status : undefined;
  return new BridgeUnavailableError(getBridgeUnavailableMessage(context), error, status);
};

export const isBridgeUnavailableError = (error: unknown): error is BridgeUnavailableError => {
  return error instanceof BridgeUnavailableError || (error instanceof Error && error.name === BRIDGE_UNAVAILABLE_NAME);
};
