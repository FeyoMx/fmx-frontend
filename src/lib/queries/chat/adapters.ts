import { ChatHistoryMessage, ChatHistoryResponse, ChatListMetadata, ChatSendResult, ChatThread, ChatThreadsResponse, ChatThreadsView } from "./types";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
};

const readString = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
};

const readBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
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

const readPath = (value: unknown, ...path: string[]): unknown => {
  let current: unknown = value;
  for (const segment of path) {
    const record = asRecord(current);
    if (!record) {
      return undefined;
    }
    current = record[segment];
  }

  return current;
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

const textFieldCandidates = (record?: Record<string, unknown>): unknown[] => {
  if (!record) {
    return [];
  }

  return [record.text, record.body, record.message, record.content, record.caption, record.message_text, record.text_message];
};

const extractMessageText = (message: unknown, fallback?: Record<string, unknown>): string => {
  if (!message) {
    return firstString(...textFieldCandidates(fallback));
  }

  if (typeof message === "string") {
    return message;
  }

  const record = asRecord(message);
  if (!record) {
    return "";
  }

  const directText = firstString(record.conversation, ...textFieldCandidates(record));

  const extended = asRecord(record.extendedTextMessage);
  if (extended) {
    const extendedText = firstString(extended.text, extended.body, extended.caption);
    if (extendedText) {
      return extendedText;
    }
  }

  const image = asRecord(record.imageMessage);
  if (image) {
    return firstString(image.caption, directText, ...textFieldCandidates(fallback));
  }

  const video = asRecord(record.videoMessage);
  if (video) {
    return firstString(video.caption, directText, ...textFieldCandidates(fallback));
  }

  const document = asRecord(record.documentMessage);
  if (document) {
    return firstString(document.caption, directText, document.fileName, ...textFieldCandidates(fallback));
  }

  const audio = asRecord(record.audioMessage);
  if (audio) {
    return firstString(audio.caption, directText, ...textFieldCandidates(fallback));
  }

  return firstString(directText, ...textFieldCandidates(fallback));
};

const detectContentType = (messageType: string, message: unknown, fallback?: Record<string, unknown>): ChatHistoryMessage["contentType"] => {
  const record = extractMessageRecord(message);
  const normalizedType = messageType.toLowerCase();
  const mimeType = firstString(record.mimetype, record.mimeType, fallback?.mimetype, fallback?.mimeType).toLowerCase();
  const mediaType = firstString(record.mediatype, record.mediaType, fallback?.mediatype, fallback?.mediaType).toLowerCase();

  if (record.imageMessage || normalizedType === "imagemessage" || normalizedType === "image" || mediaType === "image" || mimeType.startsWith("image/")) {
    return "image";
  }

  if (record.videoMessage || normalizedType === "videomessage" || normalizedType === "video" || mediaType === "video" || mimeType.startsWith("video/")) {
    return "video";
  }

  if (record.audioMessage || normalizedType === "audiomessage" || normalizedType === "audio" || normalizedType === "ptt" || mediaType === "audio" || mimeType.startsWith("audio/")) {
    return "audio";
  }

  if (record.documentMessage || normalizedType === "documentmessage" || normalizedType === "document" || mediaType === "document" || !!mimeType) {
    return "document";
  }

  if (extractMessageText(message, fallback)) {
    return "text";
  }

  return "unknown";
};

const extractMediaDetails = (
  messageType: string,
  message: unknown,
  fallback?: Record<string, unknown>,
): Pick<ChatHistoryMessage, "caption" | "fileName" | "mimeType" | "mediaUrl" | "isPartial"> => {
  const record = extractMessageRecord(message);
  const image = asRecord(record.imageMessage);
  const video = asRecord(record.videoMessage);
  const audio = asRecord(record.audioMessage);
  const document = asRecord(record.documentMessage);
  const selected = image ?? video ?? audio ?? document ?? {};

  const mediaType = firstString(record.mediatype, record.mediaType, fallback?.mediatype, fallback?.mediaType).toLowerCase();
  const mimeType = firstString(selected.mimetype, selected.mimeType, record.mimetype, record.mimeType, fallback?.mimetype, fallback?.mimeType);
  const mediaUrl = firstString(
    record.mediaUrl,
    record.media_url,
    record.url,
    fallback?.mediaUrl,
    fallback?.media_url,
    fallback?.url,
    selected.url,
    selected.mediaUrl,
    selected.media_url,
    selected.directPath,
    selected.thumbnailDirectPath,
  );
  const caption = firstString(selected.caption, record.caption, fallback?.caption);
  const fileName = firstString(selected.fileName, selected.file_name, selected.title, record.fileName, record.file_name, fallback?.fileName, fallback?.file_name, messageType === "audioMessage" ? "Audio" : undefined);
  const normalizedType = messageType.toLowerCase();
  const hasPartialMedia =
    !!image ||
    !!video ||
    !!audio ||
    !!document ||
    mediaType === "image" ||
    mediaType === "video" ||
    mediaType === "audio" ||
    mediaType === "document" ||
    normalizedType === "imagemessage" ||
    normalizedType === "videomessage" ||
    normalizedType === "audiomessage" ||
    normalizedType === "documentmessage" ||
    normalizedType === "image" ||
    normalizedType === "video" ||
    normalizedType === "audio" ||
    normalizedType === "document";

  return {
    caption: caption || undefined,
    fileName: fileName || undefined,
    mimeType: mimeType || undefined,
    mediaUrl: mediaUrl || undefined,
    isPartial: hasPartialMedia && !mediaUrl,
  };
};

const normalizeStatus = (record: Record<string, unknown>): string | undefined => {
  const status = firstString(record.status, record.delivery_status, record.messageStatus, record.deliveryStatus);
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
    const previewType = detectContentType(readString(lastMessage?.messageType) || "unknown", lastMessage?.message, lastMessage ?? undefined);
    const unreadCount = readNumber(record.unreadCount) ?? readNumber(record.unreadMessages) ?? readNumber(record.unread);
    const remoteJid = firstString(record.remoteJid, record.remote_jid, record.chat_jid, record.chatJid, record.jid);

    return {
      id: firstString(record.id, record.chat_id, remoteJid) || `chat-${index}`,
      remoteJid,
      pushName: firstString(record.pushName, record.push_name, record.name) || remoteJid.split("@")[0] || "Contacto pendiente",
      profilePicUrl: firstString(record.profilePicUrl, record.profile_pic_url),
      labels: Array.isArray(record.labels) ? record.labels.filter((value): value is string => typeof value === "string") : [],
      previewText: extractMessageText(lastMessage?.message, lastMessage ?? undefined) || firstString(record.lastMessageText, record.last_message_text, record.body, record.text) || undefined,
      previewType,
      unreadCount,
      createdAt: firstString(record.createdAt, record.created_at),
      updatedAt: firstString(record.updatedAt, record.updated_at),
      instanceId: firstString(record.instanceId, record.instance_id),
      lastMessageAt: normalizeTimestamp(lastMessage?.messageTimestamp || record.lastMessageAt || record.last_message_at || record.updatedAt || record.updated_at),
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
    const message = record.message ?? record.content ?? record;
    const messageType =
      firstString(record.messageType, record.message_type, record.type, record.mediatype, record.mediaType) ||
      (firstString(...textFieldCandidates(record)) ? "conversation" : "unknown");
    const media = extractMediaDetails(messageType, message, record);
    const text = extractMessageText(message, record);
    const remoteJid = firstString(key.remoteJid, record.remoteJid, record.remote_jid, record.chat_jid, record.chatJid, record.jid);
    const id = firstString(record.id, record.message_id, record.messageId, key.id) || `message-${index}`;
    const direction = firstString(record.direction, record.from);
    const fromMe = readBoolean(key.fromMe) || readBoolean(record.fromMe) || readBoolean(record.from_me) || direction.toLowerCase() === "outbound";

    return {
      id,
      remoteJid,
      fromMe,
      pushName: firstString(record.pushName, record.push_name, record.sender_name) || remoteJid.split("@")[0],
      messageType,
      contentType: detectContentType(messageType, message, record),
      text,
      caption: media.caption,
      fileName: media.fileName,
      mimeType: media.mimeType,
      mediaUrl: media.mediaUrl,
      status: normalizeStatus(record),
      timestamp: normalizeTimestamp(firstString(record.messageTimestamp, record.message_timestamp, record.timestamp, record.created_at, record.createdAt) || readPath(record, "timestamp")),
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

  if (Array.isArray(root.messages)) {
    return normalizeChatHistoryArray(root.messages);
  }

  if (Array.isArray(root.records)) {
    return normalizeChatHistoryArray(root.records);
  }

  if (Array.isArray(root.items)) {
    return normalizeChatHistoryArray(root.items);
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
