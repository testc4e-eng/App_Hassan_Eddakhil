export type UserRole = "ADMIN" | "USER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface CurrentUserResponse {
  user: AuthUser;
  expiresIn: string;
}

export interface AdminUserPayload {
  full_name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
