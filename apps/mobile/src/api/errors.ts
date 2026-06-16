import { I18N_KEYS } from '../i18n/keys';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
    readonly i18nKey: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function mapStatusToI18nKey(status: number, code?: string): string {
  if (status === 429 || code === 'RATE_LIMIT_EXCEEDED') {
    return I18N_KEYS.errors.rateLimitExceeded;
  }

  if (status === 400) {
    return I18N_KEYS.errors.validation;
  }

  if (status === 401) {
    return I18N_KEYS.errors.sessionExpired;
  }

  if (status === 403) {
    return I18N_KEYS.errors.forbidden;
  }

  if (status === 404) {
    return I18N_KEYS.errors.notFound;
  }

  if (status >= 500) {
    return I18N_KEYS.errors.serverError;
  }

  return I18N_KEYS.errors.networkUnavailable;
}
