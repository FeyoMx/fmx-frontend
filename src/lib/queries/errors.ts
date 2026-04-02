import { isAxiosError } from "axios";

type ErrorPayload = {
  error?: string;
  message?: string;
  response?: {
    message?: string;
  };
};

export const NOT_IMPLEMENTED_MESSAGE = "This feature is not available in the current backend yet";

export const isApiStatus = (error: unknown, status: number): boolean => {
  if (!isAxiosError(error)) {
    return false;
  }

  return error.response?.status === status;
};

export const isApiNotImplementedError = (error: unknown): boolean => isApiStatus(error, 501);

export const getApiErrorMessage = (error: unknown, fallback = "Unexpected error"): string => {
  if (isAxiosError<ErrorPayload>(error)) {
    const status = error.response?.status;
    const payload = error.response?.data;
    const message =
      payload?.error ??
      payload?.message ??
      payload?.response?.message ??
      error.message;

    if (status === 401) {
      return message || "Your session has expired. Please sign in again.";
    }

    if (status === 403) {
      return message || "You do not have permission to perform this action.";
    }

    if (status === 422 || status === 400) {
      return message || "The request data is invalid.";
    }

    if (status === 501) {
      return message || NOT_IMPLEMENTED_MESSAGE;
    }

    if (status && status >= 500) {
      return message || "The server could not process this request.";
    }

    return message || fallback;
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return fallback;
};
