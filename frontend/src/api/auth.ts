import type {
  AdminUserPayload,
  AuthUser,
  ChangePasswordPayload,
  CurrentUserResponse,
  LoginResponse,
} from "@/types/auth";

export const AUTH_TOKEN_KEY = "hydro_auth_token";
export const AUTH_LOGOUT_EVENT = "hydro-auth-logout";

const DEFAULT_AUTH_API_BASE = "/api";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function emitLogoutEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}

function normalizeAuthApiBase(raw?: string): string {
  if (!raw) return DEFAULT_AUTH_API_BASE;

  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_AUTH_API_BASE;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/api\/v1$/i, "/api").replace(/\/v1$/i, "");
  }

  const relative = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (relative.startsWith("/api/v1")) {
    return relative.replace(/\/api\/v1/i, "/api");
  }
  if (relative.startsWith("/api")) {
    return relative;
  }

  return DEFAULT_AUTH_API_BASE;
}

const AUTH_API_BASE = normalizeAuthApiBase(
  (import.meta.env.VITE_AUTH_API_BASE_URL as string | undefined) ||
    (import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    (import.meta.env.VITE_API_BASE as string | undefined)
);

function buildAuthUrl(path: string): string {
  const relativePath = path.startsWith("/") ? path.slice(1) : path;
  if (AUTH_API_BASE.startsWith("/")) {
    const base = AUTH_API_BASE.replace(/\/+$/, "");
    return `${base}/${relativePath}`;
  }
  return new URL(relativePath, `${AUTH_API_BASE}/`).toString();
}

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: string }).error)
        : `HTTP ${res.status}`;
    const error = new Error(message);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as { success: boolean; data?: T; error?: string };
    if (envelope.success === false) {
      throw new Error(envelope.error || "API error");
    }
    return envelope.data as T;
  }

  return payload as T;
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const token = options.auth === false ? null : getStoredToken();
  const res = await fetch(buildAuthUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    clearStoredToken();
    emitLogoutEvent();
  }

  return parseResponse<T>(res);
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMeApi(): Promise<CurrentUserResponse> {
  return request<CurrentUserResponse>("auth/me", { method: "GET" });
}

export async function changePasswordApi(
  payload: ChangePasswordPayload
): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutApi(): Promise<void> {
  await request<{ message: string }>("auth/logout", { method: "POST" }).catch(() => null);
  clearStoredToken();
  emitLogoutEvent();
}

export async function fetchAdminUsersApi(): Promise<AuthUser[]> {
  return request<AuthUser[]>("admin/users", { method: "GET" });
}

export async function createAdminUserApi(payload: AdminUserPayload): Promise<AuthUser> {
  return request<AuthUser>("admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUserApi(
  id: string,
  payload: AdminUserPayload
): Promise<AuthUser> {
  return request<AuthUser>(`admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUserStatusApi(
  id: string,
  status: "ACTIVE" | "INACTIVE"
): Promise<AuthUser> {
  return request<AuthUser>(`admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function resetAdminUserPasswordApi(
  id: string,
  newPassword: string
): Promise<AuthUser> {
  const response = await request<{ user: AuthUser }>(
    `admin/users/${id}/reset-password`,
    {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }
  );
  return response.user;
}

export async function deleteAdminUserApi(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`admin/users/${id}`, { method: "DELETE" });
}
