export interface UserAccountCreatedPayload {
  userAccountId: string;
  cityId: string;
  contributorId: string;
  status: string;
}

export class UserAccountCreatedEvent {
  readonly type = 'UserAccountCreated' as const;

  constructor(readonly payload: UserAccountCreatedPayload) {}
}
