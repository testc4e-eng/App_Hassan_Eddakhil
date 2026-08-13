// frontend/src/api/adminDbConfig.ts
import { AUTH_TOKEN_KEY } from "@/api/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export type DbConfigPublic = {
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
};

export type DbConfigTestPayload = DbConfigPublic & {
  password: string;
};

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchDbConfig(): Promise<{ success: boolean; data: DbConfigPublic; note: string }> {
  const response = await fetch(`${API_BASE}/admin/db-config`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch DB config: ${response.status}`);
  }
  return response.json();
}

export async function testDbConnection(payload: DbConfigTestPayload): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/admin/db-config/test`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok && !data.success) {
    throw new Error(data.message || `Failed to test DB connection: ${response.status}`);
  }
  return data;
}
