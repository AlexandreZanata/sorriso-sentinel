export class EvidenceAttachedEvent {
  readonly type = 'EvidenceAttached' as const;

  constructor(
    readonly mediaId: string,
    readonly occurrenceId: string,
    readonly cityId: string,
  ) {}
}
