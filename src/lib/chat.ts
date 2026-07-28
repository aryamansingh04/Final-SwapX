import { apiFetch } from "./api";

export interface Message {
  id: number;
  connection_id: number;
  sender: string;
  content: string;
  created_at?: string;
}

export async function sendMessage(connectionId: number, content: string): Promise<Message> {
  if (!connectionId || connectionId <= 0) {
    throw new Error("Valid connection ID is required.");
  }

  if (!content?.trim()) {
    throw new Error("Message content is required.");
  }

  return apiFetch<Message>(`/api/connections/${connectionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: content.trim() }),
  });
}

export async function getMessages(connectionId: number): Promise<Message[]> {
  if (!connectionId || connectionId <= 0) {
    throw new Error("Valid connection ID is required.");
  }

  return apiFetch<Message[]>(`/api/connections/${connectionId}/messages`);
}
