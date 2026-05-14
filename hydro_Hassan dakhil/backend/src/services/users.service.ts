import crypto from "crypto";
import bcrypt from "bcrypt";
import { databaseService } from "./database.service";
import type { PublicUser, UserRecord, UserRole, UserStatus } from "../types/auth";

type CreateUserInput = {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
};

type UpdateUserInput = {
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    status: user.status,
    last_login: user.last_login,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export class UsersService {
  async findByEmail(email: string): Promise<UserRecord | null> {
    return databaseService.queryOne<UserRecord>(
      `SELECT id, full_name, email, password_hash, role, status, last_login, created_at, updated_at
       FROM public.users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()]
    );
  }

  async findById(id: string): Promise<UserRecord | null> {
    return databaseService.queryOne<UserRecord>(
      `SELECT id, full_name, email, password_hash, role, status, last_login, created_at, updated_at
       FROM public.users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
  }

  async listUsers(): Promise<PublicUser[]> {
    const rows = await databaseService.query<UserRecord>(
      `SELECT id, full_name, email, password_hash, role, status, last_login, created_at, updated_at
       FROM public.users
       ORDER BY created_at DESC, full_name ASC`
    );
    return rows.map(toPublicUser);
  }

  async countUsers(): Promise<{ total: number; active: number; inactive: number }> {
    const total = await databaseService.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public.users`
    );
    const active = await databaseService.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public.users WHERE status = 'ACTIVE'`
    );
    const inactive = await databaseService.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public.users WHERE status = 'INACTIVE'`
    );

    return {
      total: Number(total?.count || 0),
      active: Number(active?.count || 0),
      inactive: Number(inactive?.count || 0),
    };
  }

  async createUser(input: CreateUserInput, saltRounds: number): Promise<PublicUser> {
    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(input.password, saltRounds);
    const row = await databaseService.queryOne<UserRecord>(
      `INSERT INTO public.users (id, full_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, password_hash, role, status, last_login, created_at, updated_at`,
      [id, input.full_name.trim(), input.email.trim().toLowerCase(), passwordHash, input.role, input.status || "ACTIVE"]
    );
    if (!row) {
      throw new Error("Unable to create user");
    }
    return toPublicUser(row);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<PublicUser | null> {
    const row = await databaseService.queryOne<UserRecord>(
      `UPDATE public.users
       SET full_name = $2,
           email = $3,
           role = $4,
           status = $5,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, password_hash, role, status, last_login, created_at, updated_at`,
      [id, input.full_name.trim(), input.email.trim().toLowerCase(), input.role, input.status]
    );
    return row ? toPublicUser(row) : null;
  }

  async updateStatus(id: string, status: UserStatus): Promise<PublicUser | null> {
    const row = await databaseService.queryOne<UserRecord>(
      `UPDATE public.users
       SET status = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, password_hash, role, status, last_login, created_at, updated_at`,
      [id, status]
    );
    return row ? toPublicUser(row) : null;
  }

  async updatePassword(id: string, password: string, saltRounds: number): Promise<PublicUser | null> {
    const hash = await bcrypt.hash(password, saltRounds);
    const row = await databaseService.queryOne<UserRecord>(
      `UPDATE public.users
       SET password_hash = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, password_hash, role, status, last_login, created_at, updated_at`,
      [id, hash]
    );
    return row ? toPublicUser(row) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const affected = await databaseService.execute(`DELETE FROM public.users WHERE id = $1`, [id]);
    return affected > 0;
  }

  async touchLastLogin(id: string): Promise<PublicUser | null> {
    const row = await databaseService.queryOne<UserRecord>(
      `UPDATE public.users
       SET last_login = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, password_hash, role, status, last_login, created_at, updated_at`,
      [id]
    );
    return row ? toPublicUser(row) : null;
  }

  async changePassword(id: string, password: string, saltRounds: number): Promise<PublicUser | null> {
    return this.updatePassword(id, password, saltRounds);
  }
}

export const usersService = new UsersService();
export { toPublicUser };
