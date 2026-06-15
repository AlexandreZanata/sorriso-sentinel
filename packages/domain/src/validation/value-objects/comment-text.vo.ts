const MAX_COMMENT_TEXT_LENGTH = 1000;

export class InvalidCommentTextError extends Error {
  constructor(reason: string) {
    super(`Invalid comment text: ${reason}`);
    this.name = 'InvalidCommentTextError';
  }
}

export function parseCommentText(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new InvalidCommentTextError('must not be empty');
  }

  if (trimmed.length > MAX_COMMENT_TEXT_LENGTH) {
    throw new InvalidCommentTextError('must be at most 1000 characters');
  }

  return trimmed;
}
