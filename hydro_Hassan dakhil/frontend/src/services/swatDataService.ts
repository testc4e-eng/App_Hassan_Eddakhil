import type {
  SwatAvailability,
  SwatBatch,
  SwatDeletePayload,
  SwatImportPayload,
  SwatSummary,
} from "@/types/simulatedData";
import { AUTH_TOKEN_KEY } from "@/api/auth";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "SWAT API request failed");
  }
  return payload.data;
}

export const swatDataService = {
  summary: () => request<SwatSummary>("/hydro/swat/summary"),
  import: (payload: SwatImportPayload) =>
    request<Record<string, unknown>>("/hydro/swat/import", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  batches: () => request<SwatBatch[]>("/hydro/swat/batches"),
  availability: () => request<SwatAvailability[]>("/hydro/swat/availability"),

  data: (filters: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        search.set(key, String(value));
      }
    });
    return request<Record<string, unknown>[]>(`/hydro/swat/data?${search.toString()}`);
  },

  deleteByFilter: (payload: SwatDeletePayload) =>
    request<Record<string, unknown>>("/hydro/swat/delete-by-filter", {
      method: "DELETE",
      body: JSON.stringify(payload),
    }),
};
