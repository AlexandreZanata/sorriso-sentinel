import type { OccurrenceStatus } from './occurrence-status.vo.js';

export interface OccurrenceProps {
  id: string;
  cityId: string;
  category: string;
  status: OccurrenceStatus;
  confidenceLevel: number;
  problemLocation: { latitude: number; longitude: number };
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Occurrence {
  private constructor(private readonly props: OccurrenceProps) {}

  static create(props: OccurrenceProps): Occurrence {
    if (props.confidenceLevel < 0 || props.confidenceLevel > 100) {
      throw new Error('Confidence level must be between 0 and 100');
    }
    return new Occurrence(props);
  }

  get id(): string {
    return this.props.id;
  }

  get cityId(): string {
    return this.props.cityId;
  }

  get status(): OccurrenceStatus {
    return this.props.status;
  }

  get confidenceLevel(): number {
    return this.props.confidenceLevel;
  }

  get version(): number {
    return this.props.version;
  }
}
