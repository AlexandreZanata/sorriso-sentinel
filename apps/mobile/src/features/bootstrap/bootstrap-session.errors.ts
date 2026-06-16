import { ApiError } from '../../api/errors';

export function resolveBootstrapErrorMessage(
  error: unknown,
  translate: (key: string) => string,
): string {
  if (error instanceof ApiError) {
    return translate(error.i18nKey);
  }

  return translate('bootstrap.error');
}
