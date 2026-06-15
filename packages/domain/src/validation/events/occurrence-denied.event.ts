export interface OccurrenceDeniedPayload {
  occurrenceId: string;
  cityId: string;
  newConfidence: number;
}

export class OccurrenceDeniedEvent {
  readonly type = 'OccurrenceDenied' as const;

  constructor(readonly payload: OccurrenceDeniedPayload) {}
}
