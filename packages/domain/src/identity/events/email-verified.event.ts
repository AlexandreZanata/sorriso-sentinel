export interface EmailVerifiedPayload {
  userAccountId: string;
  cityId: string;
  contributorId: string;
}

export class EmailVerifiedEvent {
  readonly type = 'EmailVerified' as const;

  constructor(readonly payload: EmailVerifiedPayload) {}
}
