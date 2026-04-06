import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { InstanceTextMessageInput, InstanceTextMessageJobStatus, InstanceTextMessageResult } from "@/types/evolution.types";

import { apiGlobal } from "../api";
import { getApiErrorMessage, isApiStatus } from "../errors";
import { useManageMutation } from "../mutateQuery";
import { UseQueryParams } from "../types";
import { normalizeChatHistory, normalizeChatSendResult, normalizeChatThreads } from "./adapters";
import { ChatCapabilities, ChatCapabilityState, ChatHistoryResponse, ChatHistorySearchPayload, ChatSendAudioInput, ChatSendMediaInput, ChatSendResult, ChatThreadsResponse } from "./types";

type ChatQueryParams = {
  instanceId: string;
};

type ChatHistoryParams = ChatQueryParams & {
  remoteJid: string;
};

type SendTextResponse = InstanceTextMessageResult & {
  httpStatus: number;
};

export const chatThreadsKey = (instanceId?: string, search?: string) => ["chat", "threads", instanceId ?? "", search ?? ""];
export const chatHistoryKey = (instanceId?: string, remoteJid?: string) => ["chat", "history", instanceId ?? "", remoteJid ?? ""];

const buildChatListPayload = (search: string): ChatHistorySearchPayload => ({
  where: search.trim() ? { query: search.trim() } : {},
});

const buildChatHistoryPayload = (remoteJid: string): ChatHistorySearchPayload => ({
  where: {
    remoteJid,
    key: {
      remoteJid,
    },
  },
});

export const fetchChatThreads = async ({ instanceId, search = "" }: ChatQueryParams & { search?: string }): Promise<ChatThreadsResponse> => {
  const response = await apiGlobal.post(`/instance/${instanceId}/chats/search`, buildChatListPayload(search));
  return normalizeChatThreads(response.data);
};

export const fetchChatHistory = async ({ instanceId, remoteJid }: ChatHistoryParams): Promise<ChatHistoryResponse> => {
  const response = await apiGlobal.post(`/instance/${instanceId}/messages/search`, buildChatHistoryPayload(remoteJid));
  return normalizeChatHistory(response.data);
};

export const sendTenantChatText = async ({ instanceId, data }: { instanceId: string; data: InstanceTextMessageInput }): Promise<SendTextResponse> => {
  const response = await apiGlobal.post(`/instance/${instanceId}/messages/text`, {
    number: data.number,
    text: data.text,
    delay: data.delay ?? 0,
  });

  return {
    ...response.data,
    httpStatus: response.status,
  };
};

export const fetchTenantChatTextStatus = async (statusEndpoint: string): Promise<InstanceTextMessageJobStatus> => {
  const response = await apiGlobal.get(statusEndpoint);
  return response.data;
};

export const sendTenantChatMedia = async ({ instanceId, data }: { instanceId: string; data: ChatSendMediaInput }): Promise<ChatSendResult> => {
  const response = await apiGlobal.post(`/instance/${instanceId}/messages/media`, {
    number: data.number,
    mediatype: data.mediatype,
    mimetype: data.mimetype,
    caption: data.caption,
    media: data.media,
    fileName: data.fileName,
    delay: data.delay ?? 0,
  });

  return normalizeChatSendResult(response.data);
};

export const sendTenantChatAudio = async ({ instanceId, data }: { instanceId: string; data: ChatSendAudioInput }): Promise<ChatSendResult> => {
  const response = await apiGlobal.post(`/instance/${instanceId}/messages/audio`, {
    number: data.number,
    delay: data.delay ?? 0,
    audioMessage: {
      audio: data.audio,
    },
  });

  return normalizeChatSendResult(response.data);
};

const capabilityFromHistoryQuery = (enabled: boolean, isLoading: boolean, error: unknown, hasData: boolean): ChatCapabilityState => {
  if (!enabled) {
    return "pending_backend";
  }

  if (isLoading) {
    return "checking";
  }

  if (hasData) {
    return "available";
  }

  if (isApiStatus(error, 501)) {
    return "pending_backend";
  }

  if (isApiStatus(error, 404)) {
    return "unavailable";
  }

  if (error) {
    return "error";
  }

  return "pending_backend";
};

export const useChatThreads = (props: UseQueryParams<ChatThreadsResponse> & Partial<ChatQueryParams> & { search?: string }) => {
  const { instanceId, search = "", ...rest } = props;

  return useQuery<ChatThreadsResponse>({
    ...rest,
    queryKey: chatThreadsKey(instanceId, search),
    queryFn: () => fetchChatThreads({ instanceId: instanceId!, search }),
    enabled: !!instanceId,
  });
};

export const useChatHistory = (props: UseQueryParams<ChatHistoryResponse> & Partial<ChatHistoryParams>) => {
  const { instanceId, remoteJid, ...rest } = props;

  return useQuery<ChatHistoryResponse>({
    ...rest,
    queryKey: chatHistoryKey(instanceId, remoteJid),
    queryFn: () => fetchChatHistory({ instanceId: instanceId!, remoteJid: remoteJid! }),
    enabled: !!instanceId && !!remoteJid,
    retry: false,
  });
};

export const useChatCapabilities = ({
  threadsAvailable,
  historyEnabled,
  historyLoading,
  historyError,
  historyMessages,
}: {
  threadsAvailable: boolean;
  historyEnabled: boolean;
  historyLoading: boolean;
  historyError: unknown;
  historyMessages: ChatHistoryResponse | undefined;
}): ChatCapabilities => {
  return useMemo(() => {
    const chatList: ChatCapabilityState = threadsAvailable ? "available" : "checking";
    const messageHistory = capabilityFromHistoryQuery(historyEnabled, historyLoading, historyError, Array.isArray(historyMessages));

    return {
      chatList,
      messageHistory,
      textSend: "available",
      mediaSend: "available",
      audioSend: "available",
    };
  }, [historyEnabled, historyError, historyLoading, historyMessages, threadsAvailable]);
};

export const useTenantChatText = () => {
  return useManageMutation(sendTenantChatText, {
    invalidateKeys: [["chat", "threads"]],
  });
};

export const useTenantChatMedia = () => {
  return useManageMutation(sendTenantChatMedia, {
    invalidateKeys: [["chat", "threads"]],
  });
};

export const useTenantChatAudio = () => {
  return useManageMutation(sendTenantChatAudio, {
    invalidateKeys: [["chat", "threads"]],
  });
};

export const getChatHistoryCapabilityMessage = (error: unknown): string => {
  if (!error) {
    return "Conversation history is active for this route. Older or inbound messages may still be missing when the runtime never captured them.";
  }

  return getApiErrorMessage(error, "Conversation history is still unavailable.");
};
