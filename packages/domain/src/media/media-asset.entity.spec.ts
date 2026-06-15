import { describe, expect, it } from 'vitest';
import { MediaAsset } from './media-asset.entity.js';
import { DEFAULT_MEDIA_UPLOAD_POLICY } from './value-objects/media-upload-policy.vo.js';
import {
  InvalidUploadKeyError,
  UnauthorizedMediaCompleterError,
  UploadSlotValidator,
} from './services/upload-slot.validator.js';

describe('MediaAsset', () => {
  const baseParams = {
    id: '01932f1a-0000-7000-8000-000000000101',
    occurrenceId: '01932f1a-0000-7000-8000-000000000099',
    cityId: '01932f1a-0000-7000-8000-000000000001',
    requestedBy: { reputationId: 'Rep-ABCDE' },
    contentType: 'image/jpeg',
    contentLength: 1024,
    existingActiveCount: 0,
    sessionSlotCountLastHour: 0,
    policy: DEFAULT_MEDIA_UPLOAD_POLICY,
    clock: () => new Date('2026-06-15T12:00:00.000Z'),
  };

  it('should_issue_slot_with_pending_status', () => {
    const { asset } = MediaAsset.issueUploadSlot(baseParams);

    expect(asset.processingStatus).toBe('pending');
    expect(asset.rawStorageKey).toContain('quarantine/');
  });

  it('should_emit_upload_slot_issued_event', () => {
    const { event } = MediaAsset.issueUploadSlot(baseParams);

    expect(event.type).toBe('UploadSlotIssued');
    expect(event.mediaId).toBe(baseParams.id);
  });

  it('should_transition_to_processing_on_complete', () => {
    const { asset } = MediaAsset.issueUploadSlot(baseParams);
    const processing = asset.markProcessing();

    expect(processing.processingStatus).toBe('processing');
  });

  it('should_transition_to_ready_and_emit_evidence_attached', () => {
    const { asset } = MediaAsset.issueUploadSlot(baseParams);
    const processing = asset.markProcessing();
    const { asset: ready, event } = processing.markReady(
      processing.buildExpectedSanitizedKey(),
      800,
      600,
    );

    expect(ready.processingStatus).toBe('ready');
    expect(ready.canServePublicly()).toBe(true);
    expect(event.type).toBe('EvidenceAttached');
  });

  it('should_not_serve_publicly_when_pending', () => {
    const { asset } = MediaAsset.issueUploadSlot(baseParams);

    expect(asset.canServePublicly()).toBe(false);
  });
});

describe('UploadSlotValidator', () => {
  const validator = new UploadSlotValidator();
  const clock = () => new Date('2026-06-15T12:00:00.000Z');

  it('should_reject_complete_with_wrong_storage_key', () => {
    const { asset } = MediaAsset.issueUploadSlot({
      id: '01932f1a-0000-7000-8000-000000000101',
      occurrenceId: '01932f1a-0000-7000-8000-000000000099',
      cityId: '01932f1a-0000-7000-8000-000000000001',
      requestedBy: { reputationId: 'Rep-ABCDE' },
      contentType: 'image/jpeg',
      contentLength: 1024,
      existingActiveCount: 0,
      sessionSlotCountLastHour: 0,
      policy: DEFAULT_MEDIA_UPLOAD_POLICY,
      clock,
    });

    expect(() =>
      validator.validateComplete(
        asset,
        { reputationId: 'Rep-ABCDE' },
        'quarantine/wrong/key',
        clock,
      ),
    ).toThrow(InvalidUploadKeyError);
  });

  it('should_reject_complete_by_different_reputation_id', () => {
    const { asset } = MediaAsset.issueUploadSlot({
      id: '01932f1a-0000-7000-8000-000000000101',
      occurrenceId: '01932f1a-0000-7000-8000-000000000099',
      cityId: '01932f1a-0000-7000-8000-000000000001',
      requestedBy: { reputationId: 'Rep-ABCDE' },
      contentType: 'image/jpeg',
      contentLength: 1024,
      existingActiveCount: 0,
      sessionSlotCountLastHour: 0,
      policy: DEFAULT_MEDIA_UPLOAD_POLICY,
      clock,
    });

    expect(() =>
      validator.validateComplete(
        asset,
        { reputationId: 'Rep-OTHER' },
        asset.rawStorageKey,
        clock,
      ),
    ).toThrow(UnauthorizedMediaCompleterError);
  });
});
