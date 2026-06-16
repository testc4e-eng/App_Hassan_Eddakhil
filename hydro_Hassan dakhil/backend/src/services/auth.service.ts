import bcrypt from "bcrypt";
import { AppError } from "../middleware/errorHandler";
import { signAuthToken, JWT_EXPIRES_IN } from "../config/jwt.config";
import { usersService } from "./users.service";
import type { PublicUser } from "../types/auth";

function getSaltRounds(): number {
  const parsed = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 10) : 12;
}

export class AuthService {
  async login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
    const user = await usersService.findByEmail(email);

    if (!user || user.status !== "ACTIVE") {
      throw new AppError("Email ou mot de passe invalide", 401);
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      throw new AppError("Email ou mot de passe invalide", 401);
    }

    const updatedUser = await usersService.touchLastLogin(user.id);
    const publicUser = updatedUser || {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    const token = signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
    });

    return { token, user: publicUser };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<PublicUser> {
    const user = await usersService.findById(userId);
    if (!user || user.status !== "ACTIVE") {
      throw new AppError("Session invalide", 401);
    }

    const passwordOk = await bcrypt.compare(oldPassword, user.password_hash);
    if (!passwordOk) {
      throw new AppError("Ancien mot de passe invalide", 400);
    }

    const updated = await usersService.changePassword(userId, newPassword, getSaltRounds());
    if (!updated) {
      throw new AppError("Impossible de modifier le mot de passe", 500);
    }
    return updated;
  }

  getTokenExpiry(): string {
    return JWT_EXPIRES_IN;
  }
}

export const authService = new AuthService();
export { getSaltRounds };
