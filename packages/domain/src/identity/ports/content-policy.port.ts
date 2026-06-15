import type { ContentPolicyResult } from '../services/content-policy.service.js';

export interface ContentPolicyPort {
  scanForDoxxing(text: string): ContentPolicyResult;
  validatePseudonym(text: string): ContentPolicyResult;
}
