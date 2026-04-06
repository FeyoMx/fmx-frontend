import { Chat, Message } from "@/types/evolution.types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FindChatResponse = Chat;

export type FindChatsResponse = Chat[];

export type FindMessagesResponse = Message[];

export type ChatCapabilityState = "available" | "pending_backend" | "checking" | "unavailable" | "error";

export type ChatThread = {
  id: string;
  remoteJid: string;
  pushName: string;
  profilePicUrl: string;
  labels: string[];
  createdAt?: string;
  updatedAt?: string;
  instanceId?: string;
  lastMessageAt?: string;
};

export type ChatHistoryMessage = {
  id: string;
  remoteJid: string;
  fromMe: boolean;
  pushName: string;
  messageType: string;
  contentType: "text" | "image" | "video" | "audio" | "document" | "unknown";
  text: string;
  caption?: string;
  fileName?: string;
  mimeType?: string;
  mediaUrl?: string;
  status?: string;
  timestamp: string;
  isPartial: boolean;
  raw: unknown;
};

export type ChatThreadsResponse = ChatThread[];

export type ChatHistoryResponse = ChatHistoryMessage[];

export type ChatHistorySearchPayload = {
  where: Record<string, unknown>;
};

export type ChatSendMediaInput = {
  number: string;
  mediatype: "image" | "video" | "audio" | "document";
  mimetype: string;
  caption?: string;
  media: string;
  fileName?: string;
  delay?: number;
};

export type ChatSendAudioInput = {
  number: string;
  audio: string;
  delay?: number;
};

export type ChatSendResult = {
  message: string;
  instance_id?: string;
  instanceName?: string;
  engine_instance_id?: string;
  message_id?: string;
  server_id?: number;
  chat?: string;
  messageType?: string;
  timestamp?: string;
  data?: {
    messageId?: string;
    serverId?: number;
    chat?: string;
    messageType?: string;
    timestamp?: string;
  };
};

export type ChatCapabilities = {
  chatList: ChatCapabilityState;
  messageHistory: ChatCapabilityState;
  textSend: ChatCapabilityState;
  mediaSend: ChatCapabilityState;
  audioSend: ChatCapabilityState;
};
