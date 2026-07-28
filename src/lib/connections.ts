import { apiFetch } from "./api";

export interface Connection {
  id: number;
  user_id: string;
  partner_id: string;
  status: "pending" | "accepted" | "rejected";
  message?: string | null;
  skill?: string | null;
  created_at?: string;
}

export async function requestConnection(partnerId: string): Promise<Connection> {
  if (!partnerId?.trim()) {
    throw new Error("Partner ID is required.");
  }

  return apiFetch<Connection>("/api/connections", {
    method: "POST",
    body: JSON.stringify({
      partner_id: partnerId,
      message: "Would like to swap skills on SwapX!",
      skill: "Skill Swap",
    }),
  });
}

export async function acceptConnection(id: number): Promise<Connection> {
  return apiFetch<Connection>(`/api/connections/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "accepted" }),
  });
}

export async function rejectConnection(id: number): Promise<Connection> {
  return apiFetch<Connection>(`/api/connections/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "rejected" }),
  });
}

export async function myConnections(): Promise<Connection[]> {
  return apiFetch<Connection[]>("/api/connections");
}
