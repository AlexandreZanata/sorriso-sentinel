import {
  DEFAULT_IDENTITY_MODE,
  type IdentityMode,
  parseIdentityMode,
} from './value-objects/identity-mode.vo.js';
import { parseLocalKeyReference } from './value-objects/local-key-reference.vo.js';
import { parsePseudonym } from './value-objects/pseudonym.vo.js';
import { parseReputationId } from './value-objects/reputation-id.vo.js';

export interface ContributorIdentityProps {
  id: string;
  cityId: string;
  reputationId: string;
  identityMode: IdentityMode;
  pseudonym: string | null;
  publicProfileId: string | null;
  localKeyRef: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class IdentityRotationProofError extends Error {
  constructor() {
    super('Invalid identity rotation proof');
    this.name = 'IdentityRotationProofError';
  }
}

export class InvalidIdentityModeChangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidIdentityModeChangeError';
  }
}

export class ContributorIdentity {
  private constructor(private props: ContributorIdentityProps) {}

  static bootstrap(params: {
    id: string;
    cityId: string;
    reputationId: string;
    localKeyRef: string;
    clock: () => Date;
  }): ContributorIdentity {
    const createdAt = params.clock();

    return new ContributorIdentity({
      id: params.id,
      cityId: params.cityId,
      reputationId: parseReputationId(params.reputationId),
      identityMode: DEFAULT_IDENTITY_MODE,
      pseudonym: null,
      publicProfileId: null,
      localKeyRef: parseLocalKeyReference(params.localKeyRef),
      version: 1,
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(props: ContributorIdentityProps): ContributorIdentity {
    return new ContributorIdentity({
      ...props,
      reputationId: parseReputationId(props.reputationId),
      identityMode: parseIdentityMode(props.identityMode),
      localKeyRef: parseLocalKeyReference(props.localKeyRef),
      pseudonym: props.pseudonym ? parsePseudonym(props.pseudonym) : null,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get cityId(): string {
    return this.props.cityId;
  }

  get reputationId(): string {
    return this.props.reputationId;
  }

  get identityMode(): IdentityMode {
    return this.props.identityMode;
  }

  get pseudonym(): string | null {
    return this.props.pseudonym;
  }

  get publicProfileId(): string | null {
    return this.props.publicProfileId;
  }

  get localKeyRef(): string {
    return this.props.localKeyRef;
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

  changeMode(
    mode: IdentityMode,
    pseudonym: string | undefined,
    clock: () => Date,
  ): void {
    const nextMode = parseIdentityMode(mode);

    if (nextMode === 'pseudonym' && !pseudonym) {
      throw new InvalidIdentityModeChangeError(
        'Pseudonym handle is required for pseudonym mode',
      );
    }

    this.props.identityMode = nextMode;
    this.props.pseudonym =
      nextMode === 'pseudonym' ? parsePseudonym(pseudonym!) : null;
    this.props.version += 1;
    this.props.updatedAt = clock();
  }

  rotate(params: {
    newLocalKeyRef: string;
    verifyProof: () => boolean;
    clock: () => Date;
  }): void {
    if (!params.verifyProof()) {
      throw new IdentityRotationProofError();
    }

    this.props.localKeyRef = parseLocalKeyReference(params.newLocalKeyRef);
    this.props.version += 1;
    this.props.updatedAt = params.clock();
  }

  toProps(): ContributorIdentityProps {
    return { ...this.props };
  }
}
