export type TrustedSourceLabel =
  | 'new_source'
  | 'trusted_source'
  | 'trusted_local_source';

export interface ReputationPort {
  getTrustWeight(reputationId: string, cityId: string): Promise<number>;
  getPublicLabel(
    reputationId: string,
    cityId: string,
  ): Promise<TrustedSourceLabel>;
}
