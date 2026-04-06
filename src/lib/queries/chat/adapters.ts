import { ChatHistoryMessage, ChatHistoryResponse, ChatSendResult, ChatThread, ChatThreadsResponse } from "./types";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
};

const readString = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

const readBoolean = (value: unknown): boolean => {
  return typeof value === "boolean" ? value : false;
};

const extractMessageText = (message: unknown): string => {
  if (!message) {
    return "";
  }

  if (typeof message === "string") {
    return message;
  }

  const record = asRecord(message);
  if (!record) {
    return "";
  }

  const conversation = readString(record.conversation);
  if (conversation) {
    return conversation;
  }

  const extended = asRecord(record.extendedTextMessage);
  if (extended) {
    return readString(extended.text);
  }

  const image = asRecord(record.imageMessage);
  if (image) {
    return readString(image.caption);
  }

  const video = asRecord(record.videoMessage);
  if (video) {
    return readString(video.caption);
  }

  const document = asRecord(record.documentMessage);
  if (document) {
    return readString(document.caption) || readString(document.fileName);
  }

  return readString(record.text);
};

const normalizeTimestamp = (value: unknown): string => {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? new Date(value).toISOString() : new Date(value * 1000).toISOString();
  }

  const record = asRecord(value);
  if (record) {
    const seconds = typeof record.seconds === "number" ? record.seconds : typeof record.low === "number" ? record.low : null;
    if (seconds !== null) {
      return new Date(seconds * 1000).toISOString();
    }
  }

  return "";
};

export const normalizeChatThreads = (payload: unknown): ChatThreadsResponse => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item, index) => {
    const record = asRecord(item) ?? {};
    const lastMessage = asRecord(record.lastMessage);

    return {
      id: readString(record.id) || readString(record.remoteJid) || `chat-${index}`,
      remoteJid: readString(record.remoteJid),
      pushName: readString(record.pushName) || readString(record.remoteJid).split("@")[0] || "Unknown contact",
      profilePicUrl: readString(record.profilePicUrl),
      labels: Array.isArray(record.labels) ? record.labels.filter((value): value is string => typeof value === "string") : [],
      createdAt: readString(record.createdAt),
      updatedAt: readString(record.updatedAt),
      instanceId: readString(record.instanceId),
      lastMessageAt: readString(lastMessage?.messageTimestamp),
    } satisfies ChatThread;
  });
};

const normalizeChatHistoryArray = (payload: unknown): ChatHistoryResponse => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item, index) => {
    const record = asRecord(item) ?? {};
    const key = asRecord(record.key) ?? {};
    const message = record.message;

    return {
      id: readString(record.id) || readString(key.id) || `message-${index}`,
      remoteJid: readString(key.remoteJid),
      fromMe: readBoolean(key.fromMe),
      pushName: readString(record.pushName),
      messageType: readString(record.messageType) || "unknown",
      text: extractMessageText(message),
      timestamp: normalizeTimestamp(record.messageTimestamp),
      raw: item,
    } satisfies ChatHistoryMessage;
  });
};

export const normalizeChatHistory = (payload: unknown): ChatHistoryResponse => {
  const root = asRecord(payload);
  if (!root) {
    return normalizeChatHistoryArray(payload);
  }

  const nestedMessages = asRecord(root.messages);
  if (nestedMessages) {
    if (Array.isArray(nestedMessages.records)) {
      return normalizeChatHistoryArray(nestedMessages.records);
    }

    if (Array.isArray(nestedMessages.items)) {
      return normalizeChatHistoryArray(nestedMessages.items);
    }
  }

  if (Array.isArray(root.data)) {
    return normalizeChatHistoryArray(root.data);
  }

  return normalizeChatHistoryArray(payload);
};

export const normalizeChatSendResult = (payload: unknown): ChatSendResult => {
  const record = asRecord(payload) ?? {};
  const nested = asRecord(record.data) ?? {};

  return {
    message: readString(record.message),
    instance_id: readString(record.instance_id),
    instanceName: readString(record.instanceName),
    engine_instance_id: readString(record.engine_instance_id),
    message_id: readString(record.message_id) || readString(nested.messageId),
    server_id:
      typeof record.server_id === "number"
        ? record.server_id
        : typeof nested.serverId === "number"
          ? nested.serverId
          : undefined,
    chat: readString(record.chat) || readString(nested.chat),
    messageType: readString(record.messageType) || readString(nested.messageType),
    timestamp: readString(record.timestamp) || readString(nested.timestamp),
    data: {
      messageId: readString(nested.messageId),
      serverId: typeof nested.serverId === "number" ? nested.serverId : undefined,
      chat: readString(nested.chat),
      messageType: readString(nested.messageType),
      timestamp: readString(nested.timestamp),
    },
  };
};
