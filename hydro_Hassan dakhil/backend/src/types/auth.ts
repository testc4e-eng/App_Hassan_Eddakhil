export type UserRole = "ADMIN" | "USER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}
