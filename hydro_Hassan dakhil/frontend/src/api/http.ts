// frontend/src/api/http.ts
export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type ApiEnvelope<T> =
  | { success: true; data: T; count?: number }
  | { success: false; error: string; stack?: string };

const DEFAULT_BASE = "http://localhost:5000/api/v1";

export function getApiBase(): string {
  const envBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";
  return (envBase || DEFAULT_BASE).replace(/\/+$/, "");
}

async function parsePayload(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isEnvelope<T>(p: unknown): p is ApiEnvelope<T> {
  return !!p && typeof p === "object" && "success" in (p as any);
}

export async function httpGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  init?: RequestInit
): Promise<T> {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;

  const url = new URL(`${base}${p}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parsePayload(res);

  if (!res.ok) {
    const msg =
      typeof payload === "object" && payload && "error" in (payload as any)
        ? String((payload as any).error)
        : `HTTP ${res.status} ${res.statusText}`;
    throw new ApiError(msg, res.status, payload);
  }

  if (isEnvelope<T>(payload)) {
    if (payload.success === false) {
      throw new ApiError(payload.error || "API error", res.status, payload);
    }
    return payload.data;
  }

  return payload as T;
}
