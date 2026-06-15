export interface UserAccountErasureRequestedPayload {
  userAccountId: string;
  cityId: string;
  requestedAt: string;
}

export class UserAccountErasureRequestedEvent {
  readonly type = 'UserAccountErasureRequested' as const;

  constructor(readonly payload: UserAccountErasureRequestedPayload) {}
}
