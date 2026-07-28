export interface StoredChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  timestamp: Date | string;
  isOwn: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
  isStarred?: boolean;
}

export interface StoredChat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  lastSeen?: string;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isTyping?: boolean;
  connectionStatus?: "connected" | "pending-sent" | "pending-received" | "not-connected";
  connectionId?: number;
  messages: StoredChatMessage[];
}

export function normalizeMessageTimestamp(timestamp: Date | string | undefined): Date {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
}

export function parseStoredChats(raw: string | null): StoredChat[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StoredChat[];
    return parsed.map((chat) => ({
      ...chat,
      messages: (chat.messages || []).map((msg) => ({
        ...msg,
        timestamp: normalizeMessageTimestamp(msg.timestamp),
      })),
    }));
  } catch (error) {
    console.error("Error parsing chats from localStorage:", error);
    return [];
  }
}

export function serializeChatsForStorage(chats: StoredChat[]): string {
  return JSON.stringify(
    chats.map((chat) => ({
      ...chat,
      messages: (chat.messages || []).map((msg) => ({
        ...msg,
        timestamp:
          msg.timestamp instanceof Date
            ? msg.timestamp.toISOString()
            : typeof msg.timestamp === "string"
              ? msg.timestamp
              : new Date().toISOString(),
      })),
    }))
  );
}

export function mergeChatState<T extends StoredChat>(base: T, saved: StoredChat): T {
  const messageMap = new Map<string, StoredChatMessage>();

  [...(base.messages || []), ...(saved.messages || [])].forEach((msg) => {
    const id = msg.id?.toString();
    if (!id) return;
    messageMap.set(id, {
      ...msg,
      timestamp: normalizeMessageTimestamp(msg.timestamp),
    });
  });

  const messages = Array.from(messageMap.values()).sort(
    (a, b) =>
      normalizeMessageTimestamp(a.timestamp).getTime() -
      normalizeMessageTimestamp(b.timestamp).getTime()
  );

  const lastMessage = messages[messages.length - 1];

  return {
    ...base,
    ...saved,
    messages,
    lastMessage: lastMessage?.text ?? saved.lastMessage ?? base.lastMessage,
    lastMessageTime: lastMessage?.time ?? saved.lastMessageTime ?? base.lastMessageTime,
    connectionId: saved.connectionId ?? base.connectionId,
    connectionStatus: saved.connectionStatus ?? base.connectionStatus,
    unreadCount: saved.unreadCount ?? base.unreadCount,
    isPinned: saved.isPinned ?? base.isPinned,
    isMuted: saved.isMuted ?? base.isMuted,
    isArchived: saved.isArchived ?? base.isArchived,
  };
}

export function mergeChatLists<T extends StoredChat>(defaults: T[], savedChats: StoredChat[]): T[] {
  const chatMap = new Map<string, T>();

  defaults.forEach((chat) => {
    chatMap.set(chat.id, {
      ...chat,
      messages: [...(chat.messages || [])],
    });
  });

  savedChats.forEach((savedChat) => {
    const existing = chatMap.get(savedChat.id);
    if (existing) {
      chatMap.set(savedChat.id, mergeChatState(existing, savedChat));
    } else {
      chatMap.set(savedChat.id, savedChat as T);
    }
  });

  return Array.from(chatMap.values());
}

export function sortChatsByRecent<T extends StoredChat>(chats: T[]): T[] {
  return [...chats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const timeA =
      a.messages.length > 0
        ? normalizeMessageTimestamp(a.messages[a.messages.length - 1].timestamp).getTime()
        : 0;
    const timeB =
      b.messages.length > 0
        ? normalizeMessageTimestamp(b.messages[b.messages.length - 1].timestamp).getTime()
        : 0;

    return timeB - timeA;
  });
}
