import type {
  AdminUserPayload,
  AuthUser,
  ChangePasswordPayload,
  CurrentUserResponse,
  LoginResponse,
} from "@/types/auth";

export const AUTH_TOKEN_KEY = "hydro_auth_token";
export const AUTH_LOGOUT_EVENT = "hydro-auth-logout";

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
  const res = await fetch(path, {
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
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMeApi(): Promise<CurrentUserResponse> {
  return request<CurrentUserResponse>("/api/auth/me", { method: "GET" });
}

export async function changePasswordApi(
  payload: ChangePasswordPayload
): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutApi(): Promise<void> {
  await request<{ message: string }>("/api/auth/logout", { method: "POST" }).catch(() => null);
  clearStoredToken();
  emitLogoutEvent();
}

export async function fetchAdminUsersApi(): Promise<AuthUser[]> {
  return request<AuthUser[]>("/api/admin/users", { method: "GET" });
}

export async function createAdminUserApi(payload: AdminUserPayload): Promise<AuthUser> {
  return request<AuthUser>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUserApi(
  id: string,
  payload: AdminUserPayload
): Promise<AuthUser> {
  return request<AuthUser>(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUserStatusApi(
  id: string,
  status: "ACTIVE" | "INACTIVE"
): Promise<AuthUser> {
  return request<AuthUser>(`/api/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function resetAdminUserPasswordApi(
  id: string,
  newPassword: string
): Promise<AuthUser> {
  const response = await request<{ user: AuthUser }>(
    `/api/admin/users/${id}/reset-password`,
    {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }
  );
  return response.user;
}

export async function deleteAdminUserApi(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`/api/admin/users/${id}`, { method: "DELETE" });
}
