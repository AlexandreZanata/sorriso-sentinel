export interface OccurrenceConfirmedPayload {
  occurrenceId: string;
  cityId: string;
  newConfidence: number;
  distinctConfirms: number;
}

export class OccurrenceConfirmedEvent {
  readonly type = 'OccurrenceConfirmed' as const;

  constructor(readonly payload: OccurrenceConfirmedPayload) {}
}
