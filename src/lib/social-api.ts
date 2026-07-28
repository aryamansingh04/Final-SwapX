import { apiFetch } from "./api";

export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  timestamp: string;
  link?: string;
  userId?: string;
  chatId?: string;
}

export interface ApiMeeting {
  id: string;
  from_user_id: string;
  to_user_id: string;
  date: string;
  mode: "online" | "offline";
  location: string | null;
  link: string | null;
  created_at: string;
}

export interface ApiCall {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_name?: string;
  to_name?: string;
  from_avatar?: string;
  to_avatar?: string;
  link: string;
  status: string;
  type: string;
  created_at: string;
}

export async function getNotifications(): Promise<ApiNotification[]> {
  return apiFetch<ApiNotification[]>("/api/notifications");
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/notifications/read-all", { method: "POST" });
}

export async function getMeetings(): Promise<ApiMeeting[]> {
  return apiFetch<ApiMeeting[]>("/api/meetings");
}

export async function createMeeting(data: {
  to_user_id: string;
  date: string;
  mode: "online" | "offline";
  location?: string | null;
  link?: string | null;
}): Promise<ApiMeeting> {
  return apiFetch<ApiMeeting>("/api/meetings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getIncomingCalls(): Promise<ApiCall[]> {
  return apiFetch<ApiCall[]>("/api/calls/incoming");
}

export async function initiateCall(data: {
  to_user_id: string;
  link: string;
  type?: string;
}): Promise<ApiCall> {
  return apiFetch<ApiCall>("/api/calls", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCallStatus(id: string, status: string): Promise<ApiCall> {
  return apiFetch<ApiCall>(`/api/calls/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
