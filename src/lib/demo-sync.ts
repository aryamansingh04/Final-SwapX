import { format } from "date-fns";
import {
  DEMO_ACCOUNTS,
  getDemoAccountById,
  isDemoUserId,
  type DemoAccount,
} from "@/lib/demo-accounts";

const REGISTRY_KEY = "swapx:demo:registry";

export interface DemoConnectionRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  fromAvatar: string;
  toAvatar: string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  skill?: string;
  sentAt: string;
}

export interface DemoMeeting {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  fromAvatar: string;
  toAvatar: string;
  date: string;
  mode: "online" | "offline";
  location: string | null;
  link: string | null;
  createdAt: string;
}

export interface DemoCall {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  fromAvatar: string;
  toAvatar: string;
  link: string;
  status: "ringing" | "answered" | "missed" | "ended";
  type: "video" | "voice";
  createdAt: string;
  answeredAt?: string;
  endedAt?: string;
}

export interface DemoChatMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface DemoNotification {
  id: string;
  title: string;
  message: string;
  type: "connection" | "message" | "meeting" | "call";
  isRead: boolean;
  timestamp: string;
  link?: string;
  userId?: string;
  chatId?: string;
}

export interface ConnectionRequestView {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  skill?: string;
  message?: string;
  sentAt: string;
  status?: "pending" | "accepted" | "rejected";
}

interface DemoRegistry {
  version: 1;
  connections: DemoConnectionRecord[];
  meetings: DemoMeeting[];
  calls: DemoCall[];
  messages: Record<string, DemoChatMessage[]>;
  notifications: Record<string, DemoNotification[]>;
}

function createEmptyRegistry(): DemoRegistry {
  return {
    version: 1,
    connections: [],
    meetings: [],
    calls: [],
    messages: {},
    notifications: {},
  };
}

function readRegistry(): DemoRegistry {
  if (typeof window === "undefined") return createEmptyRegistry();

  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return createEmptyRegistry();
    const parsed = JSON.parse(raw) as DemoRegistry;
    return {
      ...createEmptyRegistry(),
      ...parsed,
      connections: parsed.connections ?? [],
      meetings: parsed.meetings ?? [],
      calls: parsed.calls ?? [],
      messages: parsed.messages ?? {},
      notifications: parsed.notifications ?? {},
    };
  } catch {
    return createEmptyRegistry();
  }
}

function writeRegistry(registry: DemoRegistry): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  notifyDemoSyncUpdated();
}

function notifyDemoSyncUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("demoSyncUpdated"));
  window.dispatchEvent(new Event("connectionRequestsUpdated"));
  window.dispatchEvent(new Event("meetingsUpdated"));
  window.dispatchEvent(new Event("chatsUpdated"));
  window.dispatchEvent(new Event("notificationsUpdated"));
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === REGISTRY_KEY) {
      notifyDemoSyncUpdated();
    }
  });
}

function pairKey(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join(":");
}

function getUserRef(userId: string): Pick<DemoAccount, "id" | "name" | "avatar"> {
  const account = getDemoAccountById(userId);
  if (account) {
    return { id: account.id, name: account.name, avatar: account.avatar };
  }
  return {
    id: userId,
    name: "User",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
  };
}

function pushNotification(
  registry: DemoRegistry,
  userId: string,
  notification: Omit<DemoNotification, "id" | "isRead" | "timestamp"> & {
    id?: string;
    isRead?: boolean;
    timestamp?: string;
  }
): void {
  const entry: DemoNotification = {
    id: notification.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead ?? false,
    timestamp: notification.timestamp ?? new Date().toISOString(),
    link: notification.link,
    userId: notification.userId,
    chatId: notification.chatId,
  };

  const existing = registry.notifications[userId] ?? [];
  registry.notifications[userId] = [entry, ...existing].slice(0, 50);
}

export function getConnectionRequestsSent(userId: string): ConnectionRequestView[] {
  if (!isDemoUserId(userId)) return [];

  return readRegistry()
    .connections.filter((conn) => conn.fromUserId === userId)
    .map((conn) => ({
      id: conn.id,
      userId: conn.toUserId,
      name: conn.toName,
      avatar: conn.toAvatar,
      skill: conn.skill,
      message: conn.message,
      sentAt: conn.sentAt,
      status: conn.status,
    }));
}

export function getConnectionRequestsReceived(userId: string): ConnectionRequestView[] {
  if (!isDemoUserId(userId)) return [];

  return readRegistry()
    .connections.filter((conn) => conn.toUserId === userId && conn.status === "pending")
    .map((conn) => ({
      id: conn.id,
      userId: conn.fromUserId,
      name: conn.fromName,
      avatar: conn.fromAvatar,
      skill: conn.skill,
      message: conn.message ?? `${conn.fromName} wants to connect with you`,
      sentAt: conn.sentAt,
      status: conn.status,
    }));
}

export function getAcceptedPartnerIds(userId: string): string[] {
  if (!isDemoUserId(userId)) return [];

  return readRegistry()
    .connections.filter(
      (conn) =>
        conn.status === "accepted" &&
        (conn.fromUserId === userId || conn.toUserId === userId)
    )
    .map((conn) => (conn.fromUserId === userId ? conn.toUserId : conn.fromUserId));
}

export function isDemoUsersConnected(userId: string, partnerId: string): boolean {
  return getAcceptedPartnerIds(userId).includes(partnerId);
}

export function getDemoConnectionStatus(
  userId: string,
  partnerId: string
): "connected" | "pending-sent" | "pending-received" | "not-connected" {
  if (isDemoUsersConnected(userId, partnerId)) return "connected";

  const connection = readRegistry().connections.find(
    (conn) =>
      (conn.fromUserId === userId && conn.toUserId === partnerId) ||
      (conn.fromUserId === partnerId && conn.toUserId === userId)
  );

  if (!connection || connection.status === "rejected") return "not-connected";
  if (connection.status === "accepted") return "connected";
  return connection.fromUserId === userId ? "pending-sent" : "pending-received";
}

export function sendDemoConnectionRequest(
  fromUserId: string,
  toUserId: string,
  options?: { message?: string; skill?: string }
): DemoConnectionRecord {
  const registry = readRegistry();
  const from = getUserRef(fromUserId);
  const to = getUserRef(toUserId);

  const existing = registry.connections.find(
    (conn) =>
      (conn.fromUserId === fromUserId && conn.toUserId === toUserId) ||
      (conn.fromUserId === toUserId && conn.toUserId === fromUserId)
  );

  if (existing?.status === "accepted") {
    throw new Error("You are already connected with this user.");
  }

  if (existing?.status === "pending") {
    throw new Error("Connection request already sent.");
  }

  const record: DemoConnectionRecord = {
    id: `conn-${Date.now()}`,
    fromUserId,
    toUserId,
    fromName: from.name,
    toName: to.name,
    fromAvatar: from.avatar,
    toAvatar: to.avatar,
    status: "pending",
    message: options?.message,
    skill: options?.skill,
    sentAt: new Date().toISOString(),
  };

  registry.connections = registry.connections.filter((conn) => conn.id !== existing?.id);
  registry.connections.push(record);

  pushNotification(registry, toUserId, {
    title: "New Connection Request",
    message: `${from.name} wants to connect with you`,
    type: "connection",
    link: "/dashboard",
    userId: fromUserId,
  });

  writeRegistry(registry);
  return record;
}

export function acceptDemoConnectionRequest(
  connectionId: string,
  userId: string
): DemoConnectionRecord | null {
  const registry = readRegistry();
  const connection = registry.connections.find((conn) => conn.id === connectionId);

  if (!connection || connection.toUserId !== userId) return null;

  connection.status = "accepted";

  pushNotification(registry, connection.fromUserId, {
    title: "Connection Accepted",
    message: `${connection.toName} accepted your connection request`,
    type: "connection",
    link: `/chat/${connection.toUserId}`,
    userId: connection.toUserId,
  });

  writeRegistry(registry);
  return connection;
}

export function rejectDemoConnectionRequest(
  connectionId: string,
  userId: string
): DemoConnectionRecord | null {
  const registry = readRegistry();
  const connection = registry.connections.find((conn) => conn.id === connectionId);

  if (!connection || connection.toUserId !== userId) return null;

  connection.status = "rejected";
  writeRegistry(registry);
  return connection;
}

export function cancelDemoConnectionRequest(
  connectionId: string,
  userId: string
): boolean {
  const registry = readRegistry();
  const connection = registry.connections.find((conn) => conn.id === connectionId);

  if (!connection || connection.fromUserId !== userId || connection.status !== "pending") {
    return false;
  }

  registry.connections = registry.connections.filter((conn) => conn.id !== connectionId);
  writeRegistry(registry);
  return true;
}

export function getDemoMessages(userId: string, partnerId: string): DemoChatMessage[] {
  const key = pairKey(userId, partnerId);
  return readRegistry().messages[key] ?? [];
}

export function sendDemoChatMessage(
  fromUserId: string,
  toUserId: string,
  text: string
): DemoChatMessage {
  const registry = readRegistry();
  const from = getUserRef(fromUserId);
  const key = pairKey(fromUserId, toUserId);

  const message: DemoChatMessage = {
    id: `msg-${Date.now()}`,
    fromUserId,
    toUserId,
    senderName: from.name,
    text,
    timestamp: new Date().toISOString(),
  };

  registry.messages[key] = [...(registry.messages[key] ?? []), message];

  pushNotification(registry, toUserId, {
    title: "New Message",
    message: `${from.name}: ${text.length > 50 ? `${text.slice(0, 50)}...` : text}`,
    type: "message",
    link: `/chat/${fromUserId}`,
    chatId: fromUserId,
    userId: fromUserId,
  });

  writeRegistry(registry);
  return message;
}

export function scheduleDemoMeeting(input: {
  fromUserId: string;
  toUserId: string;
  date: string;
  mode: "online" | "offline";
  location?: string | null;
  link?: string | null;
}): DemoMeeting {
  const registry = readRegistry();
  const from = getUserRef(input.fromUserId);
  const to = getUserRef(input.toUserId);

  const meeting: DemoMeeting = {
    id: `meeting-${Date.now()}`,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    fromName: from.name,
    toName: to.name,
    fromAvatar: from.avatar,
    toAvatar: to.avatar,
    date: input.date,
    mode: input.mode,
    location: input.location ?? null,
    link: input.link ?? null,
    createdAt: new Date().toISOString(),
  };

  registry.meetings.push(meeting);

  const meetingDate = new Date(input.date);
  const meetingText =
    input.mode === "online"
      ? `📅 Meeting scheduled for ${format(meetingDate, "MMM d, yyyy 'at' h:mm a")}${input.link ? `\n\nMeeting Link: ${input.link}` : ""}`
      : `📅 Meeting scheduled for ${format(meetingDate, "MMM d, yyyy 'at' h:mm a")}\n\n📍 Location: ${input.location || "To be determined"}`;

  const key = pairKey(input.fromUserId, input.toUserId);
  const chatMessage: DemoChatMessage = {
    id: `msg-${Date.now()}`,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    senderName: from.name,
    text: meetingText,
    timestamp: new Date().toISOString(),
  };
  registry.messages[key] = [...(registry.messages[key] ?? []), chatMessage];

  pushNotification(registry, input.toUserId, {
    title: "Meeting Scheduled",
    message: `${from.name} scheduled a meeting with you for ${format(meetingDate, "MMM d, yyyy 'at' h:mm a")}`,
    type: "meeting",
    link: input.link ?? `/chat/${input.fromUserId}`,
    userId: input.fromUserId,
  });

  writeRegistry(registry);
  return meeting;
}

export function getDemoMeetingsForUser(userId: string): DemoMeeting[] {
  if (!isDemoUserId(userId)) return [];

  const now = new Date();
  return readRegistry()
    .meetings.filter(
      (meeting) =>
        (meeting.fromUserId === userId || meeting.toUserId === userId) &&
        new Date(meeting.date) >= now
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function initiateDemoCall(input: {
  fromUserId: string;
  toUserId: string;
  link: string;
  type?: "video" | "voice";
}): DemoCall {
  const registry = readRegistry();
  const from = getUserRef(input.fromUserId);
  const to = getUserRef(input.toUserId);

  registry.calls = registry.calls.map((call) =>
    call.toUserId === input.toUserId && call.status === "ringing"
      ? { ...call, status: "missed", endedAt: new Date().toISOString() }
      : call
  );

  const call: DemoCall = {
    id: `call-${Date.now()}`,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    fromName: from.name,
    toName: to.name,
    fromAvatar: from.avatar,
    toAvatar: to.avatar,
    link: input.link,
    status: "ringing",
    type: input.type ?? "video",
    createdAt: new Date().toISOString(),
  };

  registry.calls.unshift(call);

  pushNotification(registry, input.toUserId, {
    title: "Incoming Call",
    message: `${from.name} is calling you`,
    type: "call",
    link: input.link,
    userId: input.fromUserId,
  });

  writeRegistry(registry);
  return call;
}

export function getIncomingDemoCalls(userId: string): DemoCall[] {
  if (!isDemoUserId(userId)) return [];

  return readRegistry().calls.filter(
    (call) => call.toUserId === userId && call.status === "ringing"
  );
}

export function answerDemoCall(callId: string, userId: string): DemoCall | null {
  const registry = readRegistry();
  const call = registry.calls.find((item) => item.id === callId);

  if (!call || call.toUserId !== userId || call.status !== "ringing") return null;

  call.status = "answered";
  call.answeredAt = new Date().toISOString();
  writeRegistry(registry);
  return call;
}

export function endDemoCall(callId: string, userId: string): DemoCall | null {
  const registry = readRegistry();
  const call = registry.calls.find((item) => item.id === callId);

  if (!call || (call.fromUserId !== userId && call.toUserId !== userId)) return null;

  call.status = call.status === "ringing" ? "missed" : "ended";
  call.endedAt = new Date().toISOString();
  writeRegistry(registry);
  return call;
}

export function getDemoCallHistory(userId: string): DemoCall[] {
  if (!isDemoUserId(userId)) return [];

  return readRegistry().calls.filter(
    (call) => call.fromUserId === userId || call.toUserId === userId
  );
}

export function getDemoNotifications(userId: string): DemoNotification[] {
  if (!isDemoUserId(userId)) return [];
  return readRegistry().notifications[userId] ?? [];
}

export function markDemoNotificationRead(userId: string, notificationId: string): void {
  const registry = readRegistry();
  const notifications = registry.notifications[userId] ?? [];
  registry.notifications[userId] = notifications.map((notification) =>
    notification.id === notificationId ? { ...notification, isRead: true } : notification
  );
  writeRegistry(registry);
}

export function markAllDemoNotificationsRead(userId: string): void {
  const registry = readRegistry();
  registry.notifications[userId] = (registry.notifications[userId] ?? []).map((notification) => ({
    ...notification,
    isRead: true,
  }));
  writeRegistry(registry);
}

export function listDiscoverableDemoAccounts(currentUserId: string): DemoAccount[] {
  return DEMO_ACCOUNTS.filter((account) => account.id !== currentUserId);
}
