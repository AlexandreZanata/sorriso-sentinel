import { z } from 'zod';

export const loginSchema = z
  .object({
    cityId: z.string().uuid(),
    email: z.string().email().max(254),
    password: z.string().min(12).max(128),
  })
  .strict();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(16).max(512),
  })
  .strict();

export const logoutSchema = refreshTokenSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
