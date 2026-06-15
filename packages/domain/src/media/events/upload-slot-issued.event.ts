export class UploadSlotIssuedEvent {
  readonly type = 'UploadSlotIssued' as const;

  constructor(
    readonly mediaId: string,
    readonly occurrenceId: string,
    readonly cityId: string,
    readonly expiresAt: Date,
  ) {}
}
