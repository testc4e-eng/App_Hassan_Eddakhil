import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .refine((value) => /[A-Za-zÀ-ÿ]/.test(value), {
    message: "Le mot de passe doit contenir au moins une lettre",
  })
  .refine((value) => /\d/.test(value), {
    message: "Le mot de passe doit contenir au moins un chiffre",
  });

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Ancien mot de passe requis"),
  newPassword: strongPasswordSchema,
});

export const createUserSchema = z.object({
  full_name: z.string().min(2).max(150),
  email: z.string().email().max(150),
  password: strongPasswordSchema,
  role: z.enum(["ADMIN", "USER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(150),
  email: z.string().email().max(150),
  role: z.enum(["ADMIN", "USER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const resetPasswordSchema = z.object({
  newPassword: strongPasswordSchema,
});

export const statusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
