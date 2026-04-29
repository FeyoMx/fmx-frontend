import { ChatHistoryMessage, ChatHistoryResponse, ChatListMetadata, ChatSendResult, ChatThread, ChatThreadsResponse, ChatThreadsView } from "./types";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
};

const readString = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

const readBoolean = (value: unknown): boolean => {
  return typeof value === "boolean" ? value : false;
};

const readNumber = (value: unknown): number | undefined => {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const firstString = (...values: unknown[]): string => {
  for (const value of values) {
    const parsed = readString(value);
    if (parsed) {
      return parsed;
    }
  }

  return "";
};

const normalizeChatListMetadata = (payload: unknown): ChatListMetadata => {
  const root = asRecord(payload) ?? {};
  const meta = asRecord(root.meta) ?? asRecord(root.metadata) ?? {};

  return {
    cached: readBoolean(root.cached) || readBoolean(meta.cached),
    stale: readBoolean(root.stale) || readBoolean(meta.stale),
    source: firstString(root.source, meta.source),
    refreshedAt: normalizeTimestamp(firstString(root.refreshed_at, root.refreshedAt, meta.refreshed_at, meta.refreshedAt)),
  };
};

const extractMessageRecord = (message: unknown): Record<string, unknown> => asRecord(message) ?? {};

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

const detectContentType = (messageType: string, message: unknown): ChatHistoryMessage["contentType"] => {
  const record = extractMessageRecord(message);

  if (record.imageMessage || messageType === "imageMessage") {
    return "image";
  }

  if (record.videoMessage || messageType === "videoMessage") {
    return "video";
  }

  if (record.audioMessage || messageType === "audioMessage") {
    return "audio";
  }

  if (record.documentMessage || messageType === "documentMessage") {
    return "document";
  }

  if (extractMessageText(message)) {
    return "text";
  }

  return "unknown";
};

const extractMediaDetails = (
  messageType: string,
  message: unknown,
): Pick<ChatHistoryMessage, "caption" | "fileName" | "mimeType" | "mediaUrl" | "isPartial"> => {
  const record = extractMessageRecord(message);
  const image = asRecord(record.imageMessage);
  const video = asRecord(record.videoMessage);
  const audio = asRecord(record.audioMessage);
  const document = asRecord(record.documentMessage);
  const selected = image ?? video ?? audio ?? document ?? {};

  const mimeType = firstString(selected.mimetype, selected.mimeType, record.mimetype, record.mimeType);
  const mediaUrl = firstString(
    record.mediaUrl,
    record.url,
    selected.url,
    selected.mediaUrl,
    selected.directPath,
    selected.thumbnailDirectPath,
  );
  const caption = firstString(selected.caption, record.caption);
  const fileName = firstString(selected.fileName, selected.title, record.fileName, messageType === "audioMessage" ? "Audio" : undefined);
  const hasPartialMedia =
    messageType === "imageMessage" || messageType === "videoMessage" || messageType === "audioMessage" || messageType === "documentMessage"
      ? !mediaUrl
      : false;

  return {
    caption: caption || undefined,
    fileName: fileName || undefined,
    mimeType: mimeType || undefined,
    mediaUrl: mediaUrl || undefined,
    isPartial: hasPartialMedia,
  };
};

const normalizeStatus = (record: Record<string, unknown>): string | undefined => {
  const status = firstString(record.status, record.delivery_status, record.messageStatus);
  if (status) {
    return status;
  }

  const ack = readNumber(record.statusAck) ?? readNumber(record.ack);
  switch (ack) {
    case 1:
      return "sent";
    case 2:
      return "delivered";
    case 3:
      return "read";
    default:
      return undefined;
  }
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

const normalizeChatThreadArray = (payload: unknown): ChatThreadsResponse => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item, index) => {
    const record = asRecord(item) ?? {};
    const lastMessage = asRecord(record.lastMessage);
    const previewType = detectContentType(readString(lastMessage?.messageType) || "unknown", lastMessage?.message);
    const unreadCount = readNumber(record.unreadCount) ?? readNumber(record.unreadMessages) ?? readNumber(record.unread);

    return {
      id: readString(record.id) || readString(record.remoteJid) || `chat-${index}`,
      remoteJid: readString(record.remoteJid),
      pushName: readString(record.pushName) || readString(record.remoteJid).split("@")[0] || "Unknown contact",
      profilePicUrl: readString(record.profilePicUrl),
      labels: Array.isArray(record.labels) ? record.labels.filter((value): value is string => typeof value === "string") : [],
      previewText: extractMessageText(lastMessage?.message) || readString(record.lastMessageText) || undefined,
      previewType,
      unreadCount,
      createdAt: readString(record.createdAt),
      updatedAt: readString(record.updatedAt),
      instanceId: readString(record.instanceId),
      lastMessageAt: normalizeTimestamp(lastMessage?.messageTimestamp || record.updatedAt),
    } satisfies ChatThread;
  });
};

export const normalizeChatThreads = (payload: unknown): ChatThreadsView => {
  const root = asRecord(payload);
  const items =
    root && Array.isArray(root.items)
      ? root.items
      : root && Array.isArray(root.chats)
        ? root.chats
        : root && Array.isArray(root.data)
          ? root.data
          : payload;

  return {
    items: normalizeChatThreadArray(items),
    metadata: normalizeChatListMetadata(payload),
  };
};

const normalizeChatHistoryArray = (payload: unknown): ChatHistoryResponse => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item, index) => {
    const record = asRecord(item) ?? {};
    const key = asRecord(record.key) ?? {};
    const message = record.message;
    const messageType = readString(record.messageType) || "unknown";
    const media = extractMediaDetails(messageType, message);
    const text = extractMessageText(message);

    return {
      id: readString(record.id) || readString(key.id) || `message-${index}`,
      remoteJid: readString(key.remoteJid),
      fromMe: readBoolean(key.fromMe),
      pushName: readString(record.pushName),
      messageType,
      contentType: detectContentType(messageType, message),
      text,
      caption: media.caption,
      fileName: media.fileName,
      mimeType: media.mimeType,
      mediaUrl: media.mediaUrl,
      status: normalizeStatus(record),
      timestamp: normalizeTimestamp(record.messageTimestamp),
      isPartial: media.isPartial || (!text && messageType === "unknown"),
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
