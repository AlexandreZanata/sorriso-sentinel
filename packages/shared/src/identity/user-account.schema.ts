import { z } from 'zod';
import { LGPD_CONSENT_PURPOSES } from '@sorriso-sentinel/domain';

const lgpdConsentSchema = z
  .object({
    termsVersion: z.string().min(1),
    privacyVersion: z.string().min(1),
    consentedAt: z.string().datetime(),
    purposes: z.array(z.enum(LGPD_CONSENT_PURPOSES)).min(1),
  })
  .strict();

export const registerUserAccountSchema = z
  .object({
    email: z.string().email().max(254),
    displayName: z.string().min(2).max(64),
    deviceNonce: z.string().min(8).max(128),
    pqcPublicKeyRef: z.string().regex(/^[a-f0-9]{64}$/i),
    pqcSignature: z.string().min(1),
    lgpdConsent: lgpdConsentSchema,
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    userAccountId: z.string().uuid(),
    cityId: z.string().uuid(),
    token: z.string().min(8),
  })
  .strict();

export const updateMyAccountSchema = z
  .object({
    displayName: z.string().min(2).max(64).optional(),
    showIdentityOnReports: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.displayName !== undefined ||
      value.showIdentityOnReports !== undefined,
    { message: 'At least one field must be provided' },
  );

export const updateProfilePhotoSchema = z
  .object({
    storageKey: z.string().min(1).max(256),
    visibility: z.enum(['public', 'private']).optional(),
  })
  .strict();

export type RegisterUserAccountInput = z.infer<typeof registerUserAccountSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type UpdateMyAccountInput = z.infer<typeof updateMyAccountSchema>;
export type UpdateProfilePhotoInput = z.infer<typeof updateProfilePhotoSchema>;
