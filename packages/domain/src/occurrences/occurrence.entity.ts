import type { OccurrenceStatus } from './occurrence-status.vo.js';
import type { AuthorDisplayPolicy } from '../identity/value-objects/author-display-policy.vo.js';
import type { ContributorRef } from '../identity/value-objects/contributor-ref.vo.js';
import type { IdentityMode } from '../identity/value-objects/identity-mode.vo.js';
import { ContentPolicyService } from '../identity/services/content-policy.service.js';
import type { ContentPolicyPort } from '../identity/ports/content-policy.port.js';
import {
  SensitiveCategoryPolicy,
} from '../identity/services/sensitive-category-policy.js';
import { isSensitiveCategory } from '../identity/value-objects/sensitive-category.vo.js';
import { OccurrenceCreatedEvent } from './occurrence-created.event.js';
import { initialConfidenceLevel } from './value-objects/confidence-level.vo.js';
import { parseOccurrenceCategory } from './value-objects/occurrence-category.vo.js';
import { parseOccurrenceDescription } from './value-objects/occurrence-description.vo.js';
import {
  resolveOccurrenceKind,
  type OccurrenceKind,
} from './value-objects/occurrence-kind.vo.js';
import {
  defaultPrivacyLevel,
  parsePrivacyLevel,
  type PrivacyLevel,
} from './value-objects/privacy-level.vo.js';
import { parseProblemLocation, type ProblemLocation } from './value-objects/problem-location.vo.js';
import { parseContributorRef } from '../identity/value-objects/contributor-ref.vo.js';
import { LocationPrivacyService } from './services/location-privacy.service.js';
import { ConfidenceCalculator } from '../validation/services/confidence-calculator.js';
import { StatusTransitionService } from '../validation/services/status-transition.service.js';
import type { ValidationPolicy } from '../validation/value-objects/validation-policy.vo.js';
import type { ValidationVote } from '../validation/validation-vote.entity.js';
import type { ValidationVoteStats } from '../validation/services/validation-vote-stats.service.js';
import { OccurrenceConfirmedEvent } from '../validation/events/occurrence-confirmed.event.js';
import { OccurrenceDeniedEvent } from '../validation/events/occurrence-denied.event.js';
import { OccurrenceConfidenceChangedEvent } from '../validation/events/occurrence-confidence-changed.event.js';

export interface OccurrenceProps {
  id: string;
  cityId: string;
  category: string;
  occurrenceKind: OccurrenceKind;
  status: OccurrenceStatus;
  confidenceLevel: number;
  problemLocation: ProblemLocation;
  storedMapLocation: ProblemLocation;
  privacyLevel: PrivacyLevel;
  description: string | null;
  contributorRef: ContributorRef;
  authorDisplayPolicy: AuthorDisplayPolicy;
  isSensitive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNewOccurrenceParams {
  cityId: string;
  category: string;
  occurrenceKind?: string;
  problemLocation: ProblemLocation;
  privacyLevel?: string;
  description?: string;
  contributorRef: ContributorRef;
  identityMode: IdentityMode;
  idGenerator: () => string;
  clock: () => Date;
  contentPolicy?: ContentPolicyPort;
  sensitiveCategoryPolicy?: SensitiveCategoryPolicy;
  locationPrivacy?: LocationPrivacyService;
  random?: () => number;
}

export interface CreateNewOccurrenceResult {
  occurrence: Occurrence;
  event: OccurrenceCreatedEvent;
}

export class OccurrenceValidationClosedError extends Error {
  constructor() {
    super('Occurrence is not open for validation');
    this.name = 'OccurrenceValidationClosedError';
  }
}

export class OccurrenceVersionMismatchError extends Error {
  constructor() {
    super('Occurrence version mismatch');
    this.name = 'OccurrenceVersionMismatchError';
  }
}

export interface RecordValidationVoteParams {
  vote: ValidationVote;
  voteStats: ValidationVoteStats;
  policy: ValidationPolicy;
  expectedVersion: number;
  clock: () => Date;
}

export type OccurrenceValidationEvent =
  | OccurrenceConfirmedEvent
  | OccurrenceDeniedEvent
  | OccurrenceConfidenceChangedEvent;

export interface OccurrenceValidationResult {
  occurrence: Occurrence;
  events: OccurrenceValidationEvent[];
}

export class Occurrence {
  private constructor(private props: OccurrenceProps) {}

  static create(props: OccurrenceProps): Occurrence {
    if (props.confidenceLevel < 0 || props.confidenceLevel > 100) {
      throw new Error('Confidence level must be between 0 and 100');
    }

    return new Occurrence(props);
  }

  static rehydrate(props: OccurrenceProps): Occurrence {
    return Occurrence.create(props);
  }

  static createNew(params: CreateNewOccurrenceParams): CreateNewOccurrenceResult {
    const contributorRef = parseContributorRef(params.contributorRef);
    const category = parseOccurrenceCategory(params.category);
    const occurrenceKind = resolveOccurrenceKind(category, params.occurrenceKind);
    const privacyLevel = params.privacyLevel
      ? parsePrivacyLevel(params.privacyLevel)
      : defaultPrivacyLevel();
    const problemLocation = parseProblemLocation(params.problemLocation);
    const contentPolicy = params.contentPolicy ?? ContentPolicyService.default();
    const sensitiveCategoryPolicy =
      params.sensitiveCategoryPolicy ?? SensitiveCategoryPolicy.default();
    const locationPrivacy = params.locationPrivacy ?? new LocationPrivacyService();
    const now = params.clock();
    const isSensitive = isSensitiveCategory(category);
    const authorDisplayPolicy = sensitiveCategoryPolicy.applyAuthorDisplay(
      category,
      params.identityMode,
    );

    let description: string | null = null;

    if (params.description !== undefined) {
      const parsedDescription = parseOccurrenceDescription(params.description);
      const descriptionCheck = contentPolicy.scanForDoxxing(parsedDescription);

      if (!descriptionCheck.ok) {
        throw new Error('Description contains disallowed personal data pattern');
      }

      description = descriptionCheck.value;
    }

    const storedMapLocation = locationPrivacy.applyForStorage(
      problemLocation,
      privacyLevel,
      params.random,
    );

    const occurrence = new Occurrence({
      id: params.idGenerator(),
      cityId: params.cityId,
      category,
      occurrenceKind,
      status: 'unverified',
      confidenceLevel: initialConfidenceLevel(),
      problemLocation,
      storedMapLocation,
      privacyLevel,
      description,
      contributorRef,
      authorDisplayPolicy,
      isSensitive,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    const event = new OccurrenceCreatedEvent({
      occurrenceId: occurrence.id,
      cityId: occurrence.cityId,
      category: occurrence.category,
      occurrenceKind: occurrence.occurrenceKind,
      status: occurrence.status,
      confidenceLevel: occurrence.confidenceLevel,
      privacyLevel: occurrence.privacyLevel,
      isSensitive: occurrence.isSensitive,
      occurredAt: occurrence.createdAt,
    });

    return { occurrence, event };
  }

  get id(): string {
    return this.props.id;
  }

  get cityId(): string {
    return this.props.cityId;
  }

  get category(): string {
    return this.props.category;
  }

  get occurrenceKind(): OccurrenceKind {
    return this.props.occurrenceKind;
  }

  get status(): OccurrenceStatus {
    return this.props.status;
  }

  get confidenceLevel(): number {
    return this.props.confidenceLevel;
  }

  get problemLocation(): ProblemLocation {
    return this.props.problemLocation;
  }

  get storedMapLocation(): ProblemLocation {
    return this.props.storedMapLocation;
  }

  get privacyLevel(): PrivacyLevel {
    return this.props.privacyLevel;
  }

  get description(): string | null {
    return this.props.description;
  }

  get contributorRef(): ContributorRef {
    return this.props.contributorRef;
  }

  get authorDisplayPolicy(): AuthorDisplayPolicy {
    return this.props.authorDisplayPolicy;
  }

  get isSensitive(): boolean {
    return this.props.isSensitive;
  }

  get version(): number {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  recordConfirmation(
    params: RecordValidationVoteParams,
  ): OccurrenceValidationResult {
    if (params.vote.voteType !== 'confirm') {
      throw new Error('Expected confirm vote');
    }

    return this.applyValidationVote(params);
  }

  recordDenial(params: RecordValidationVoteParams): OccurrenceValidationResult {
    if (params.vote.voteType !== 'deny') {
      throw new Error('Expected deny vote');
    }

    return this.applyValidationVote(params);
  }

  toProps(): OccurrenceProps {
    return {
      ...this.props,
      problemLocation: { ...this.props.problemLocation },
      storedMapLocation: { ...this.props.storedMapLocation },
      contributorRef: { ...this.props.contributorRef },
    };
  }

  private applyValidationVote(
    params: RecordValidationVoteParams,
  ): OccurrenceValidationResult {
    if (params.expectedVersion !== this.props.version) {
      throw new OccurrenceVersionMismatchError();
    }

    if (
      this.props.status === 'resolved' ||
      this.props.status === 'evolved'
    ) {
      throw new OccurrenceValidationClosedError();
    }

    const voteType = params.vote.voteType;
    const previousConfidence = this.props.confidenceLevel;
    const previousStatus = this.props.status;

    const newConfidence = ConfidenceCalculator.calculate({
      currentLevel: previousConfidence,
      voteType,
      trustWeight: params.vote.trustWeightApplied,
      policy: params.policy,
    });

    const newStatus = StatusTransitionService.resolveStatus({
      currentStatus: previousStatus,
      confidence: newConfidence,
      distinctConfirms: params.voteStats.distinctConfirms,
      weightedConfirmScore: params.voteStats.weightedConfirmScore,
      policy: params.policy,
      isFirstVoteOnOccurrence: params.voteStats.totalVoteCount === 1,
    });

    this.props.confidenceLevel = newConfidence;
    this.props.status = newStatus;
    this.props.version += 1;
    this.props.updatedAt = params.clock();

    const events: OccurrenceValidationEvent[] = [];

    if (voteType === 'confirm') {
      events.push(
        new OccurrenceConfirmedEvent({
          occurrenceId: this.id,
          cityId: this.cityId,
          newConfidence,
          distinctConfirms: params.voteStats.distinctConfirms,
        }),
      );
    } else {
      events.push(
        new OccurrenceDeniedEvent({
          occurrenceId: this.id,
          cityId: this.cityId,
          newConfidence,
        }),
      );
    }

    if (
      previousConfidence !== newConfidence ||
      previousStatus !== newStatus
    ) {
      events.push(
        new OccurrenceConfidenceChangedEvent({
          occurrenceId: this.id,
          cityId: this.cityId,
          fromConfidence: previousConfidence,
          toConfidence: newConfidence,
          status: newStatus,
        }),
      );
    }

    return { occurrence: this, events };
  }
}
