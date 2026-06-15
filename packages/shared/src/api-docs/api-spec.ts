import type { ApiDocumentationSpec } from './types.js';

const EXAMPLE_CITY_ID = '01932f1a-0000-7000-8000-000000000001';
const EXAMPLE_OCCURRENCE_ID = '01932f1a-0000-7000-8000-000000000042';
const EXAMPLE_CONTRIBUTOR_ID = '01932f1a-0000-7000-8000-000000000010';
const EXAMPLE_REPUTATION_ID = 'Rep-A1B2C';
const EXAMPLE_USER_ACCOUNT_ID = '01932f1a-0000-7000-8000-000000000099';
const EXAMPLE_MEDIA_SLOT_ID = '01932f1a-0000-7000-8000-000000000088';
const EXAMPLE_PQC_REF = 'a'.repeat(64);

export const API_DOCUMENTATION_SPEC: ApiDocumentationSpec = {
  title: 'Sorriso Sentinel API',
  version: '0.1.0',
  baseUrl: 'http://127.0.0.1:3010',
  description:
    'Civic occurrence platform API. All tenant-scoped routes enforce city isolation via the session token. English-only field names.',
  authNotes: [
    'Public routes do not require Authorization.',
    'Session routes require: Authorization: Bearer <sessionToken>',
    'Obtain a session token via POST /sessions/bootstrap (HMAC, 24h) or POST /auth/login (JWT access, 15 min).',
    'Refresh tokens from POST /auth/login rotate on POST /auth/refresh; revoke family via POST /auth/logout.',
    'Optional header x-city-id must match token city_id when present (403 CITY_MISMATCH).',
  ],
  exampleCityId: EXAMPLE_CITY_ID,
  endpoints: [
    {
      id: 'health',
      group: 'Health',
      method: 'GET',
      path: '/health',
      summary: 'Liveness probe',
      description: 'Returns ok when the process is running.',
      auth: 'public',
      statusCodes: [{ status: 200, description: 'Service is up' }],
      responseBody: {
        contentType: 'application/json',
        fields: [{ name: 'status', type: 'string', required: true, description: 'Always "ok"' }],
        example: { status: 'ok' },
      },
      errors: [],
    },
    {
      id: 'health-live',
      group: 'Health',
      method: 'GET',
      path: '/health/live',
      summary: 'Process liveness',
      description: 'Kubernetes-style liveness check.',
      auth: 'public',
      statusCodes: [{ status: 200, description: 'Process is live' }],
      responseBody: {
        contentType: 'application/json',
        fields: [{ name: 'status', type: 'string', required: true, description: 'Always "live"' }],
        example: { status: 'live' },
      },
      errors: [],
    },
    {
      id: 'health-ready',
      group: 'Health',
      method: 'GET',
      path: '/health/ready',
      summary: 'Readiness probe',
      description: 'Checks Postgres and Redis connectivity.',
      auth: 'public',
      statusCodes: [
        { status: 200, description: 'Dependencies healthy' },
        { status: 503, description: 'Postgres or Redis unavailable' },
      ],
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'status', type: 'string', required: true, description: '"ready" when healthy' },
          { name: 'redis', type: 'string', required: true, description: '"ok" or "error"' },
          { name: 'postgres', type: 'string', required: true, description: '"ok" or "error"' },
        ],
        example: { status: 'ready', redis: 'ok', postgres: 'ok' },
      },
      errors: [],
    },
    {
      id: 'sessions-bootstrap',
      group: 'Sessions',
      method: 'POST',
      path: '/sessions/bootstrap',
      summary: 'Bootstrap ghost session',
      description:
        'Creates or restores a contributor identity and returns a session token. Rate limit: 30/hour per cityId+localKeyRef.',
      auth: 'public',
      statusCodes: [
        { status: 201, description: 'Session created or restored' },
        { status: 400, description: 'Validation error' },
        { status: 429, description: 'Rate limit exceeded' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'cityId', type: 'uuid', required: true, description: 'Tenant city identifier' },
          {
            name: 'localKeyRef',
            type: 'string',
            required: true,
            description: 'Device-local key reference (8–128 chars)',
          },
        ],
        example: {
          cityId: EXAMPLE_CITY_ID,
          localKeyRef: 'fingerprint-docker-routes-abc123',
        },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'sessionToken', type: 'string', required: true, description: 'Bearer token for session routes' },
          { name: 'reputationId', type: 'string', required: true, description: 'Format Rep-XXXXX' },
          { name: 'contributorId', type: 'string', required: true, description: 'UUID v7 contributor id' },
          {
            name: 'identityMode',
            type: 'string',
            required: true,
            description: 'Always "ghost" on bootstrap',
            enumValues: ['ghost'],
          },
        ],
        example: {
          sessionToken: 'eyJjb250cmlidXRvcklkIjoiLi4uIn0.signature',
          reputationId: EXAMPLE_REPUTATION_ID,
          contributorId: EXAMPLE_CONTRIBUTOR_ID,
          identityMode: 'ghost',
        },
      },
      errors: [
        { status: 400, code: 'VALIDATION_ERROR', description: 'Invalid body or extra fields (strict schema)' },
        { status: 429, code: 'RATE_LIMIT_EXCEEDED', description: 'Too many bootstrap attempts' },
      ],
    },
    {
      id: 'occurrences-create',
      group: 'Occurrences',
      method: 'POST',
      path: '/occurrences',
      summary: 'Create occurrence',
      description:
        'Creates an unverified occurrence. Rate limit: 10/hour per reputationId. Sensitive categories force ghost author display.',
      auth: 'session',
      statusCodes: [
        { status: 201, description: 'Occurrence created' },
        { status: 400, description: 'Invalid category or doxxing in description' },
        { status: 401, description: 'Missing or invalid session' },
        { status: 403, description: 'City mismatch' },
        { status: 429, description: 'Rate limit exceeded' },
      ],
      headers: [
        {
          name: 'Authorization',
          type: 'string',
          required: true,
          description: 'Bearer <sessionToken>',
        },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'category', type: 'string', required: true, description: 'e.g. pothole, crime, lighting' },
          { name: 'latitude', type: 'number', required: true, description: '-90 to 90' },
          { name: 'longitude', type: 'number', required: true, description: '-180 to 180' },
          { name: 'cityId', type: 'uuid', required: false, description: 'Defaults to session cityId' },
          { name: 'description', type: 'string', required: false, description: 'Max 2000 chars, no PII' },
          {
            name: 'privacyLevel',
            type: 'string',
            required: false,
            description: 'Location storage privacy',
            enumValues: ['public', 'neighborhood', 'approximate', 'hidden'],
          },
          {
            name: 'occurrenceKind',
            type: 'string',
            required: false,
            description: 'Problem vs temporary event',
            enumValues: ['problem', 'temporary_event'],
          },
        ],
        example: {
          category: 'pothole',
          latitude: -12.5423,
          longitude: -55.7214,
        },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'id', type: 'uuid', required: true, description: 'Occurrence id (UUID v7)' },
          { name: 'cityId', type: 'uuid', required: true, description: 'Tenant city' },
          { name: 'category', type: 'string', required: true, description: 'Occurrence category' },
          {
            name: 'status',
            type: 'string',
            required: true,
            description: 'Initial status',
            enumValues: ['unverified'],
          },
          { name: 'confidenceLevel', type: 'number', required: true, description: 'Starts at 0' },
          { name: 'latitude', type: 'number', required: true, description: 'Stored map coordinate' },
          { name: 'longitude', type: 'number', required: true, description: 'Stored map coordinate' },
          { name: 'privacyLevel', type: 'string', required: true, description: 'Privacy level applied' },
          { name: 'description', type: 'string', required: false, description: 'Optional description' },
          { name: 'author', type: 'object', required: false, description: 'Omitted for sensitive + ghost' },
        ],
        example: {
          id: EXAMPLE_OCCURRENCE_ID,
          cityId: EXAMPLE_CITY_ID,
          category: 'pothole',
          status: 'unverified',
          confidenceLevel: 0,
          latitude: -12.5423,
          longitude: -55.7214,
          privacyLevel: 'public',
        },
      },
      errors: [
        { status: 401, code: 'SESSION_REQUIRED', description: 'No session token' },
        { status: 400, code: 'INVALID_CATEGORY', description: 'Unknown category' },
        { status: 400, code: 'DOXXING_DETECTED', description: 'Description contains PII pattern' },
        { status: 403, code: 'CITY_MISMATCH', description: 'Body cityId differs from session' },
      ],
    },
    {
      id: 'occurrences-list',
      group: 'Occurrences',
      method: 'GET',
      path: '/occurrences',
      summary: 'List occurrences in bbox',
      description:
        'Returns map feed for a bounding box. Excludes hidden privacy level. Max bbox span 0.5 degrees per axis.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Paginated occurrence summaries' },
        { status: 400, description: 'Invalid bbox or cursor' },
        { status: 401, description: 'Missing session' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      queryParams: [
        { name: 'minLatitude', type: 'number', required: true, description: 'South bound (-90 to 90)' },
        { name: 'maxLatitude', type: 'number', required: true, description: 'North bound (-90 to 90)' },
        { name: 'minLongitude', type: 'number', required: true, description: 'West bound (-180 to 180)' },
        { name: 'maxLongitude', type: 'number', required: true, description: 'East bound (-180 to 180)' },
        { name: 'limit', type: 'integer', required: false, description: 'Page size (1–100, default 50)' },
        { name: 'cursor', type: 'string', required: false, description: 'Opaque pagination cursor' },
        {
          name: 'status',
          type: 'string',
          required: false,
          description: 'Filter by status',
          enumValues: ['unverified', 'under_review', 'active', 'low_confidence', 'resolved'],
        },
        { name: 'category', type: 'string', required: false, description: 'Filter by category' },
      ],
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'items', type: 'OccurrenceReadDto[]', required: true, description: 'Occurrences in bbox' },
          { name: 'nextCursor', type: 'string', required: false, description: 'Present when more pages exist' },
        ],
        example: {
          items: [
            {
              id: EXAMPLE_OCCURRENCE_ID,
              cityId: EXAMPLE_CITY_ID,
              category: 'pothole',
              occurrenceKind: 'problem',
              status: 'unverified',
              confidenceLevel: 0,
              privacyLevel: 'public',
              location: { latitude: -12.5423, longitude: -55.7214 },
              createdAt: '2026-06-15T12:00:00.000Z',
              updatedAt: '2026-06-15T12:00:00.000Z',
            },
          ],
        },
      },
      errors: [
        { status: 400, code: 'VALIDATION_ERROR', description: 'Invalid query parameters' },
        { status: 400, code: 'INVALID_CURSOR', description: 'Malformed cursor' },
      ],
    },
    {
      id: 'occurrences-get',
      group: 'Occurrences',
      method: 'GET',
      path: '/occurrences/:id',
      summary: 'Get occurrence detail',
      description:
        'Returns a single occurrence with privacy-aware location and author fields. Sensitive rows may be hidden by RLS.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Occurrence found' },
        { status: 401, description: 'Missing session' },
        { status: 404, description: 'Not found in tenant' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      pathParams: [
        { name: 'id', type: 'uuid', required: true, description: 'Occurrence id' },
      ],
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'id', type: 'uuid', required: true, description: 'Occurrence id' },
          { name: 'cityId', type: 'uuid', required: true, description: 'Tenant city' },
          { name: 'category', type: 'string', required: true, description: 'Occurrence category' },
          { name: 'status', type: 'string', required: true, description: 'Lifecycle status' },
          { name: 'confidenceLevel', type: 'integer', required: true, description: '0–100' },
          { name: 'privacyLevel', type: 'string', required: true, description: 'Privacy level' },
          { name: 'location', type: 'object', required: false, description: 'Omitted for hidden/neighborhood' },
          { name: 'description', type: 'string', required: false, description: 'Omitted for sensitive categories' },
          { name: 'author', type: 'object', required: false, description: 'Omitted for sensitive/ghost' },
        ],
        example: {
          id: EXAMPLE_OCCURRENCE_ID,
          cityId: EXAMPLE_CITY_ID,
          category: 'pothole',
          occurrenceKind: 'problem',
          status: 'under_review',
          confidenceLevel: 42,
          privacyLevel: 'public',
          location: { latitude: -12.5423, longitude: -55.7214 },
          description: 'Large pothole near the bus stop',
          createdAt: '2026-06-15T12:00:00.000Z',
          updatedAt: '2026-06-15T12:05:00.000Z',
        },
      },
      errors: [{ status: 404, code: 'OCCURRENCE_NOT_FOUND', description: 'Missing or cross-tenant' }],
    },
    {
      id: 'occurrences-list-comments',
      group: 'Occurrences',
      method: 'GET',
      path: '/occurrences/:id/comments',
      summary: 'List comments',
      description:
        'Returns community comments for an occurrence in chronological order. Author pseudonym is shown only to the comment author.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Comment list' },
        { status: 401, description: 'Missing session' },
        { status: 404, description: 'Occurrence not found in city' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      pathParams: [
        { name: 'id', type: 'uuid', required: true, description: 'Occurrence id' },
      ],
      responseBody: {
        contentType: 'application/json',
        fields: [
          {
            name: 'items',
            type: 'array',
            required: true,
            description: 'Comments ordered by createdAt ascending',
          },
        ],
        example: {
          items: [
            {
              id: '01932f1a-0000-7000-8000-000000000088',
              text: 'Confirmed via docker routes.',
              createdAt: '2026-06-15T17:00:00.000Z',
              author: { displayPolicy: 'pseudonym', pseudonym: 'RtUser1a2b' },
            },
          ],
        },
      },
      errors: [{ status: 404, code: 'OCCURRENCE_NOT_FOUND', description: 'Unknown occurrence in tenant' }],
    },
    {
      id: 'occurrences-comment',
      group: 'Occurrences',
      method: 'POST',
      path: '/occurrences/:id/comments',
      summary: 'Add comment',
      description: 'Adds a community comment. Does not change occurrence confidence (INV-V4).',
      auth: 'session',
      statusCodes: [
        { status: 201, description: 'Comment created' },
        { status: 400, description: 'Validation or doxxing' },
        { status: 401, description: 'Missing session' },
        { status: 404, description: 'Occurrence not found in city' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      pathParams: [
        { name: 'id', type: 'uuid', required: true, description: 'Occurrence id' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'text', type: 'string', required: true, description: '1–1000 characters' },
          { name: 'parentCommentId', type: 'uuid', required: false, description: 'Reply target' },
        ],
        example: { text: 'Confirmed via docker routes.' },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'id', type: 'uuid', required: true, description: 'Comment id' },
          { name: 'occurrenceId', type: 'uuid', required: true, description: 'Parent occurrence' },
          { name: 'text', type: 'string', required: true, description: 'Sanitized comment text' },
          { name: 'createdAt', type: 'string', required: true, description: 'ISO 8601 timestamp' },
          { name: 'author', type: 'object', required: false, description: 'Present for pseudonym/public sessions' },
        ],
        example: {
          id: '01932f1a-0000-7000-8000-000000000088',
          occurrenceId: EXAMPLE_OCCURRENCE_ID,
          text: 'Confirmed via docker routes.',
          createdAt: '2026-06-15T17:00:00.000Z',
          author: { displayPolicy: 'pseudonym', pseudonym: 'RtUser1a2b' },
        },
      },
      errors: [
        { status: 404, code: 'OCCURRENCE_NOT_FOUND', description: 'Unknown occurrence in tenant' },
        { status: 400, code: 'DOXXING_DETECTED', description: 'Comment contains PII pattern' },
      ],
    },
    {
      id: 'occurrences-confirm',
      group: 'Validation',
      method: 'POST',
      path: '/occurrences/:id/confirm',
      summary: 'Confirm occurrence',
      description:
        'Casts a confirm vote. Requires optimistic lock version. Self-validation and duplicate votes return 403.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Vote recorded, occurrence updated' },
        { status: 403, description: 'Self-validation, duplicate vote, or closed occurrence' },
        { status: 409, description: 'Stale occurrence version' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      pathParams: [
        { name: 'id', type: 'uuid', required: true, description: 'Occurrence id' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'version', type: 'integer', required: true, description: 'Current occurrence version (optimistic lock)' },
          {
            name: 'reason',
            type: 'string',
            required: false,
            description: 'Optional confirmation reason',
            enumValues: ['still_there', 'verified_locally', 'other'],
          },
        ],
        example: { version: 1, reason: 'verified_locally' },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'occurrenceId', type: 'uuid', required: true, description: 'Occurrence id' },
          {
            name: 'status',
            type: 'string',
            required: true,
            description: 'Updated status',
            enumValues: ['under_review', 'active', 'low_confidence', 'unverified'],
          },
          { name: 'confidenceLevel', type: 'number', required: true, description: '0–100 after vote' },
          { name: 'version', type: 'integer', required: true, description: 'Incremented version' },
        ],
        example: {
          occurrenceId: EXAMPLE_OCCURRENCE_ID,
          status: 'under_review',
          confidenceLevel: 20,
          version: 2,
        },
      },
      errors: [
        { status: 403, code: 'SELF_VALIDATION_FORBIDDEN', description: 'Author cannot vote on own occurrence' },
        { status: 403, code: 'DUPLICATE_VOTE', description: 'Same reputation already voted' },
        { status: 409, code: 'OCCURRENCE_VERSION_CONFLICT', description: 'Version mismatch — refresh and retry' },
      ],
    },
    {
      id: 'occurrences-deny',
      group: 'Validation',
      method: 'POST',
      path: '/occurrences/:id/deny',
      summary: 'Deny occurrence',
      description: 'Casts a deny vote. Same rules as confirm.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Deny vote recorded' },
        { status: 403, description: 'Forbidden vote' },
        { status: 409, description: 'Version conflict' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      pathParams: [
        { name: 'id', type: 'uuid', required: true, description: 'Occurrence id' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'version', type: 'integer', required: true, description: 'Current occurrence version' },
          {
            name: 'reason',
            type: 'string',
            required: false,
            description: 'Optional denial reason',
            enumValues: ['false_alarm', 'duplicate', 'already_resolved', 'other'],
          },
        ],
        example: { version: 2, reason: 'false_alarm' },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'occurrenceId', type: 'uuid', required: true, description: 'Occurrence id' },
          { name: 'status', type: 'string', required: true, description: 'Updated status' },
          { name: 'confidenceLevel', type: 'number', required: true, description: '0–100' },
          { name: 'version', type: 'integer', required: true, description: 'New version' },
        ],
        example: {
          occurrenceId: EXAMPLE_OCCURRENCE_ID,
          status: 'under_review',
          confidenceLevel: 0,
          version: 3,
        },
      },
      errors: [
        { status: 403, code: 'SELF_VALIDATION_FORBIDDEN', description: 'Author cannot vote' },
        { status: 403, code: 'DUPLICATE_VOTE', description: 'Already voted' },
      ],
    },
    {
      id: 'media-upload-slot',
      group: 'Media',
      method: 'POST',
      path: '/occurrences/:id/media/upload-slots',
      summary: 'Request media upload slot',
      description:
        'Issues a presigned PUT URL for image upload. Rate limited per reputationId. Occurrence author only.',
      auth: 'session',
      statusCodes: [
        { status: 201, description: 'Slot created with presigned URL' },
        { status: 400, description: 'Invalid content type or size' },
        { status: 401, description: 'Missing session' },
        { status: 403, description: 'Not occurrence author or limit reached' },
        { status: 404, description: 'Occurrence not found' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      pathParams: [
        { name: 'id', type: 'uuid', required: true, description: 'Occurrence id' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'contentType', type: 'string', required: true, description: 'image/jpeg only (v1)' },
          { name: 'contentLength', type: 'integer', required: true, description: 'File size in bytes' },
        ],
        example: { contentType: 'image/jpeg', contentLength: 2048 },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'slotId', type: 'uuid', required: true, description: 'Media asset id' },
          { name: 'uploadUrl', type: 'string', required: true, description: 'Presigned PUT URL' },
          { name: 'expiresAt', type: 'string', required: true, description: 'ISO 8601 expiry' },
        ],
        example: {
          slotId: EXAMPLE_MEDIA_SLOT_ID,
          uploadUrl: 'http://127.0.0.1:9000/sorriso-sentinel-media/raw/...',
          expiresAt: '2026-06-15T12:15:00.000Z',
        },
      },
      errors: [
        { status: 403, code: 'MEDIA_LIMIT_REACHED', description: 'Max images per occurrence' },
        { status: 429, code: 'RATE_LIMIT_EXCEEDED', description: 'Upload slots per hour' },
      ],
    },
    {
      id: 'media-complete-upload',
      group: 'Media',
      method: 'POST',
      path: '/media/upload-slots/:slotId/complete',
      summary: 'Complete media upload',
      description:
        'Verifies object in storage and triggers inline EXIF stripping. Returns processing or ready status.',
      auth: 'session',
      statusCodes: [
        { status: 202, description: 'Upload accepted for processing' },
        { status: 400, description: 'Key mismatch' },
        { status: 401, description: 'Missing session' },
        { status: 404, description: 'Slot not found' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      pathParams: [
        { name: 'slotId', type: 'uuid', required: true, description: 'Upload slot id' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'uploadedKey', type: 'string', required: true, description: 'Raw storage key from slot' },
        ],
        example: { uploadedKey: 'raw/01932f1a-0000-7000-8000-000000000088.jpg' },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'id', type: 'uuid', required: true, description: 'Media asset id' },
          { name: 'status', type: 'string', required: true, description: 'processing or ready' },
        ],
        example: { id: EXAMPLE_MEDIA_SLOT_ID, status: 'ready' },
      },
      errors: [],
    },
    {
      id: 'media-list',
      group: 'Media',
      method: 'GET',
      path: '/occurrences/:id/media',
      summary: 'List occurrence media',
      description: 'Returns ready media items with public URLs. Quarantine keys are never exposed.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Media list' },
        { status: 401, description: 'Missing session' },
        { status: 404, description: 'Occurrence not found' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      pathParams: [
        { name: 'id', type: 'uuid', required: true, description: 'Occurrence id' },
      ],
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'items', type: 'array', required: true, description: 'Ready media assets' },
        ],
        example: {
          items: [
            {
              id: EXAMPLE_MEDIA_SLOT_ID,
              contentType: 'image/jpeg',
              status: 'ready',
              url: 'http://127.0.0.1:9000/sorriso-sentinel-media/ready/...',
            },
          ],
        },
      },
      errors: [],
    },
    {
      id: 'identity-mode',
      group: 'Identity',
      method: 'PATCH',
      path: '/identity/mode',
      summary: 'Change identity mode',
      description: 'Switch between ghost and pseudonym mode. Returns a new session token.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Mode updated' },
        { status: 400, description: 'Missing pseudonym for pseudonym mode' },
        { status: 401, description: 'Missing session' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          {
            name: 'mode',
            type: 'string',
            required: true,
            description: 'Contributor identity mode',
            enumValues: ['ghost', 'pseudonym'],
          },
          { name: 'pseudonym', type: 'string', required: false, description: 'Required when mode=pseudonym' },
        ],
        example: { mode: 'pseudonym', pseudonym: 'RtUser1a2b' },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'sessionToken', type: 'string', required: true, description: 'New bearer token' },
          { name: 'identityMode', type: 'string', required: true, description: 'Active mode' },
          { name: 'pseudonym', type: 'string | null', required: true, description: 'Pseudonym handle' },
          { name: 'reputationId', type: 'string', required: true, description: 'Unchanged reputation id' },
        ],
        example: {
          sessionToken: 'eyJ...new',
          identityMode: 'pseudonym',
          pseudonym: 'RtUser1a2b',
          reputationId: EXAMPLE_REPUTATION_ID,
        },
      },
      errors: [
        { status: 400, code: 'VALIDATION_ERROR', description: 'Invalid mode or missing pseudonym' },
      ],
    },
    {
      id: 'identity-rotate',
      group: 'Identity',
      method: 'POST',
      path: '/identity/rotate',
      summary: 'Rotate local key',
      description: 'Rotates device local key reference with HMAC rotation proof.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Key rotated' },
        { status: 401, description: 'Invalid session or proof' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'newLocalKeyRef', type: 'string', required: true, description: 'New device key reference' },
          { name: 'rotationProof', type: 'string', required: true, description: 'HMAC-SHA256 proof hex' },
        ],
        example: {
          newLocalKeyRef: 'fingerprint-docker-routes-abc123-rotated',
          rotationProof: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'sessionToken', type: 'string', required: true, description: 'New session token' },
          { name: 'reputationId', type: 'string', required: true, description: 'Reputation id' },
          { name: 'contributorId', type: 'string', required: true, description: 'Contributor id' },
        ],
        example: {
          sessionToken: 'eyJ...rotated',
          reputationId: EXAMPLE_REPUTATION_ID,
          contributorId: EXAMPLE_CONTRIBUTOR_ID,
        },
      },
      errors: [
        { status: 401, code: 'INVALID_ROTATION_PROOF', description: 'HMAC proof mismatch' },
      ],
    },
    {
      id: 'auth-login',
      group: 'Auth',
      method: 'POST',
      path: '/auth/login',
      summary: 'Login with email and password',
      description:
        'Authenticates verified active account. Returns short-lived JWT access token and revocable refresh token.',
      auth: 'public',
      statusCodes: [
        { status: 200, description: 'Tokens issued' },
        { status: 400, description: 'Validation error' },
        { status: 401, description: 'Invalid credentials' },
        { status: 403, description: 'Account not active or email unverified' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'cityId', type: 'uuid', required: true, description: 'Tenant city id' },
          { name: 'email', type: 'string', required: true, description: 'Account email' },
          { name: 'password', type: 'string', required: true, description: 'Min 12 characters' },
        ],
        example: {
          cityId: EXAMPLE_CITY_ID,
          email: 'civic.user@example.com',
          password: 'secure-password-12',
        },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'accessToken', type: 'string', required: true, description: 'JWT access token (15 min)' },
          { name: 'refreshToken', type: 'string', required: true, description: 'Opaque refresh token (7 days)' },
          { name: 'expiresInSeconds', type: 'integer', required: true, description: 'Access token TTL' },
          { name: 'tokenType', type: 'string', required: true, description: 'Bearer' },
        ],
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'xK9mP2nQ7vR4sT1wY6zA3bC',
          expiresInSeconds: 900,
          tokenType: 'Bearer',
        },
      },
      errors: [
        { status: 401, code: 'INVALID_CREDENTIALS', description: 'Wrong email or password' },
        { status: 403, code: 'ACCOUNT_NOT_ACTIVE', description: 'Pending verification or suspended' },
      ],
    },
    {
      id: 'auth-refresh',
      group: 'Auth',
      method: 'POST',
      path: '/auth/refresh',
      summary: 'Refresh access token',
      description: 'Rotates refresh token and issues new JWT access token. Old refresh token is revoked.',
      auth: 'public',
      statusCodes: [
        { status: 200, description: 'New token pair' },
        { status: 400, description: 'Validation error' },
        { status: 401, description: 'Invalid or revoked refresh token' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'refreshToken', type: 'string', required: true, description: 'Refresh token from login' },
        ],
        example: { refreshToken: 'xK9mP2nQ7vR4sT1wY6zA3bC' },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'accessToken', type: 'string', required: true, description: 'New JWT' },
          { name: 'refreshToken', type: 'string', required: true, description: 'Rotated refresh token' },
          { name: 'expiresInSeconds', type: 'integer', required: true, description: 'Access TTL' },
          { name: 'tokenType', type: 'string', required: true, description: 'Bearer' },
        ],
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'newRefreshTokenValue',
          expiresInSeconds: 900,
          tokenType: 'Bearer',
        },
      },
      errors: [{ status: 401, code: 'INVALID_REFRESH_TOKEN', description: 'Expired or revoked' }],
    },
    {
      id: 'auth-logout',
      group: 'Auth',
      method: 'POST',
      path: '/auth/logout',
      summary: 'Logout and revoke refresh tokens',
      description: 'Revokes entire refresh token family. Access token remains valid until expiry.',
      auth: 'public',
      statusCodes: [
        { status: 200, description: 'Refresh tokens revoked' },
        { status: 400, description: 'Validation error' },
        { status: 401, description: 'Unknown refresh token' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'refreshToken', type: 'string', required: true, description: 'Refresh token to revoke' },
        ],
        example: { refreshToken: 'xK9mP2nQ7vR4sT1wY6zA3bC' },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [{ name: 'revoked', type: 'boolean', required: true, description: 'Always true' }],
        example: { revoked: true },
      },
      errors: [{ status: 401, code: 'INVALID_REFRESH_TOKEN', description: 'Token not found' }],
    },
    {
      id: 'user-register',
      group: 'User accounts',
      method: 'POST',
      path: '/user-accounts/register',
      summary: 'Register user account',
      description:
        'Optional account linked to current contributor. Requires PQC device proof (dev: signature = base64url("valid-dev-signature")). Returns one-time verification token.',
      auth: 'session',
      statusCodes: [
        { status: 201, description: 'Account pending verification' },
        { status: 400, description: 'Invalid proof or consent' },
        { status: 409, description: 'Email, device, or contributor conflict' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'email', type: 'string', required: true, description: 'Email address (max 254)' },
          { name: 'displayName', type: 'string', required: true, description: '2–64 chars' },
          { name: 'password', type: 'string', required: true, description: 'Min 12 characters (bcrypt hashed)' },
          { name: 'deviceNonce', type: 'string', required: true, description: '8–128 chars' },
          { name: 'pqcPublicKeyRef', type: 'string', required: true, description: '64 hex chars (ML-DSA fingerprint)' },
          { name: 'pqcSignature', type: 'string', required: true, description: 'Device signature (base64url or hex)' },
          { name: 'lgpdConsent', type: 'object', required: true, description: 'LGPD consent block' },
        ],
        example: {
          email: 'civic.user@example.com',
          displayName: 'Civic User',
          password: 'secure-password-12',
          deviceNonce: 'nonce-docker-001',
          pqcPublicKeyRef: EXAMPLE_PQC_REF,
          pqcSignature: 'dmFsaWQtZGV2LXNpZ25hdHVyZQ',
          lgpdConsent: {
            termsVersion: '1.0.0',
            privacyVersion: '1.0.0',
            consentedAt: '2026-06-15T12:00:00.000Z',
            purposes: ['account_creation', 'email_communication'],
          },
        },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'userAccountId', type: 'uuid', required: true, description: 'New account id' },
          { name: 'status', type: 'string', required: true, description: 'Account lifecycle status', enumValues: ['pending_verification'] },
          { name: 'emailVerificationState', type: 'string', required: true, description: 'Email verification state', enumValues: ['pending'] },
          { name: 'verificationToken', type: 'string', required: true, description: 'One-time email token (dev only in response)' },
        ],
        example: {
          userAccountId: EXAMPLE_USER_ACCOUNT_ID,
          status: 'pending_verification',
          emailVerificationState: 'pending',
          verificationToken: 'xK9mP2nQ7vR4sT1wY6zA3bC',
        },
      },
      errors: [
        { status: 409, code: 'EMAIL_ALREADY_USED', description: 'Email taken in city' },
        { status: 409, code: 'DEVICE_ALREADY_REGISTERED', description: 'Device binding exists' },
        { status: 400, code: 'INVALID_DEVICE_PROOF', description: 'PQC signature invalid' },
      ],
    },
    {
      id: 'user-verify-email',
      group: 'User accounts',
      method: 'POST',
      path: '/user-accounts/verify-email',
      summary: 'Verify email',
      description: 'Activates account and links publicProfileId on contributor identity.',
      auth: 'public',
      statusCodes: [
        { status: 200, description: 'Account activated' },
        { status: 400, description: 'Invalid or expired token' },
        { status: 404, description: 'Account not found' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'userAccountId', type: 'uuid', required: true, description: 'Account id from register' },
          { name: 'cityId', type: 'uuid', required: true, description: 'Tenant city' },
          { name: 'token', type: 'string', required: true, description: 'Verification token (min 8 chars)' },
        ],
        example: {
          userAccountId: EXAMPLE_USER_ACCOUNT_ID,
          cityId: EXAMPLE_CITY_ID,
          token: 'xK9mP2nQ7vR4sT1wY6zA3bC',
        },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'userAccountId', type: 'uuid', required: true, description: 'Account id' },
          { name: 'status', type: 'string', required: true, description: 'Account lifecycle status', enumValues: ['active'] },
          { name: 'emailVerificationState', type: 'string', required: true, description: 'Email verification state', enumValues: ['verified'] },
        ],
        example: {
          userAccountId: EXAMPLE_USER_ACCOUNT_ID,
          status: 'active',
          emailVerificationState: 'verified',
        },
      },
      errors: [
        { status: 400, code: 'TOKEN_INVALID_OR_EXPIRED', description: 'Bad or expired token' },
        { status: 404, code: 'USER_ACCOUNT_NOT_FOUND', description: 'Unknown account' },
      ],
    },
    {
      id: 'user-me-get',
      group: 'User accounts',
      method: 'GET',
      path: '/user-accounts/me',
      summary: 'Get my account',
      description: 'Returns profile, contributor session info, and reputation label (no raw trust score).',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Profile returned' },
        { status: 401, description: 'Missing session' },
        { status: 404, description: 'No account for contributor' },
      ],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'id', type: 'uuid', required: true, description: 'User account id' },
          { name: 'email', type: 'string', required: true, description: 'Account email' },
          { name: 'displayName', type: 'string', required: true, description: 'Display name' },
          { name: 'status', type: 'string', required: true, description: 'Account status' },
          { name: 'profilePhoto', type: 'object', required: true, description: 'visibility + url' },
          { name: 'contributor', type: 'object', required: true, description: 'Linked contributor identity' },
          { name: 'reputation', type: 'object', required: true, description: 'Public reputation label only' },
        ],
        example: {
          id: EXAMPLE_USER_ACCOUNT_ID,
          email: 'civic.user@example.com',
          displayName: 'Docker Civic User',
          status: 'active',
          emailVerificationState: 'verified',
          showIdentityOnReports: true,
          profilePhoto: {
            visibility: 'public',
            url: '/media/profile/profiles/docker-user.jpg',
          },
          contributor: {
            contributorId: EXAMPLE_CONTRIBUTOR_ID,
            reputationId: EXAMPLE_REPUTATION_ID,
            identityMode: 'pseudonym',
            pseudonym: 'RtUser1a2b',
          },
          reputation: {
            trustedSourceLabel: 'new_source',
          },
        },
      },
      errors: [{ status: 404, code: 'USER_ACCOUNT_NOT_FOUND', description: 'Contributor has no account' }],
    },
    {
      id: 'user-me-patch',
      group: 'User accounts',
      method: 'PATCH',
      path: '/user-accounts/me',
      summary: 'Update my profile',
      description: 'Updates display name and/or showIdentityOnReports flag.',
      auth: 'session',
      statusCodes: [{ status: 200, description: 'Profile updated' }],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'displayName', type: 'string', required: false, description: '2–64 chars' },
          { name: 'showIdentityOnReports', type: 'boolean', required: false, description: 'Show identity on reports' },
        ],
        example: { displayName: 'Docker Civic User', showIdentityOnReports: true },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'id', type: 'uuid', required: true, description: 'Account id' },
          { name: 'displayName', type: 'string', required: true, description: 'Updated name' },
          { name: 'showIdentityOnReports', type: 'boolean', required: true, description: 'Visibility flag' },
          { name: 'version', type: 'integer', required: true, description: 'Optimistic lock version' },
        ],
        example: {
          id: EXAMPLE_USER_ACCOUNT_ID,
          displayName: 'Docker Civic User',
          showIdentityOnReports: true,
          version: 3,
        },
      },
      errors: [],
    },
    {
      id: 'user-me-profile-photo',
      group: 'User accounts',
      method: 'PATCH',
      path: '/user-accounts/me/profile-photo',
      summary: 'Update profile photo',
      description: 'Sets storage key and optional public/private visibility.',
      auth: 'session',
      statusCodes: [{ status: 200, description: 'Photo settings updated' }],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      requestBody: {
        contentType: 'application/json',
        fields: [
          { name: 'storageKey', type: 'string', required: true, description: 'Object storage key (max 256)' },
          {
            name: 'visibility',
            type: 'string',
            required: false,
            description: 'Profile photo visibility',
            enumValues: ['public', 'private'],
          },
        ],
        example: { storageKey: 'profiles/docker-user.jpg', visibility: 'public' },
      },
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'profilePhoto', type: 'object', required: true, description: 'visibility + url' },
          { name: 'version', type: 'integer', required: true, description: 'Account version' },
        ],
        example: {
          profilePhoto: {
            visibility: 'public',
            url: '/media/profile/profiles/docker-user.jpg',
          },
          version: 4,
        },
      },
      errors: [],
    },
    {
      id: 'user-me-delete',
      group: 'User accounts',
      method: 'DELETE',
      path: '/user-accounts/me',
      summary: 'Request LGPD erasure',
      description: 'Soft-deletes account and anonymizes email. Returns 204 with empty body.',
      auth: 'session',
      statusCodes: [{ status: 204, description: 'Erasure completed' }],
      headers: [
        { name: 'Authorization', type: 'string', required: true, description: 'Bearer <sessionToken>' },
      ],
      errors: [{ status: 404, code: 'USER_ACCOUNT_NOT_FOUND', description: 'No account linked' }],
    },
    {
      id: 'admin-audit-summary',
      group: 'Admin',
      method: 'GET',
      path: '/admin/audit-summary',
      summary: 'Admin audit summary',
      description:
        'Returns aggregated audit log metrics for the tenant. Requires security_audit or city_admin role in JWT access token.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Summary returned' },
        { status: 401, description: 'Missing or invalid token' },
        { status: 403, description: 'Insufficient role' },
      ],
      headers: [
        {
          name: 'Authorization',
          type: 'string',
          required: true,
          description: 'Bearer <accessToken or sessionToken>',
        },
      ],
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'status', type: 'string', required: true, description: 'ok' },
          { name: 'cityId', type: 'string', required: true, description: 'Tenant city UUID' },
          {
            name: 'totalEntries',
            type: 'number',
            required: true,
            description: 'Total audit log entries for the city',
          },
          {
            name: 'sensitiveEntries',
            type: 'number',
            required: true,
            description: 'Audit entries flagged as sensitive',
          },
          {
            name: 'lastRecordedAt',
            type: 'string | null',
            required: true,
            description: 'ISO timestamp of the latest audit entry',
          },
          {
            name: 'actionCounts',
            type: 'object',
            required: true,
            description: 'Counts grouped by audit action',
          },
        ],
        example: {
          status: 'ok',
          cityId: '01932f1a-0000-7000-8000-000000000001',
          totalEntries: 2,
          sensitiveEntries: 1,
          lastRecordedAt: '2026-06-15T12:00:00.000Z',
          actionCounts: { occurrence_created: 2 },
        },
      },
      errors: [
        {
          status: 403,
          code: 'INSUFFICIENT_ROLE',
          description: 'Requires security_audit or city_admin',
        },
      ],
    },
    {
      id: 'admin-moderation-queue',
      group: 'Admin',
      method: 'GET',
      path: '/admin/moderation-queue',
      summary: 'Moderation queue summary',
      description:
        'Returns pending review counts for the tenant. Requires moderator or city_admin role in JWT access token.',
      auth: 'session',
      statusCodes: [
        { status: 200, description: 'Queue summary returned' },
        { status: 401, description: 'Missing or invalid token' },
        { status: 403, description: 'Insufficient role' },
      ],
      headers: [
        {
          name: 'Authorization',
          type: 'string',
          required: true,
          description: 'Bearer <accessToken or sessionToken>',
        },
      ],
      responseBody: {
        contentType: 'application/json',
        fields: [
          { name: 'status', type: 'string', required: true, description: 'ok' },
          { name: 'cityId', type: 'string', required: true, description: 'Tenant city UUID' },
          {
            name: 'pendingReviewCount',
            type: 'number',
            required: true,
            description: 'Occurrences awaiting moderator review',
          },
        ],
        example: {
          status: 'ok',
          cityId: '01932f1a-0000-7000-8000-000000000001',
          pendingReviewCount: 3,
        },
      },
      errors: [
        {
          status: 403,
          code: 'INSUFFICIENT_ROLE',
          description: 'Requires moderator or city_admin',
        },
      ],
    },
  ],
  baseUrlPresets: [
    { id: 'docker', label: 'Local Docker (port 3010)', url: 'http://127.0.0.1:3010' },
    { id: 'dev', label: 'Local dev (port 3000)', url: 'http://127.0.0.1:3000' },
    { id: 'custom', label: 'Custom URL', url: '' },
  ],
  seedGroups: [
    {
      title: 'Tenant & identifiers',
      items: [
        {
          id: 'cityId',
          label: 'cityId',
          value: EXAMPLE_CITY_ID,
          description: 'Default tenant UUID used in Docker scripts and local dev',
        },
        {
          id: 'occurrenceId',
          label: 'occurrenceId',
          value: EXAMPLE_OCCURRENCE_ID,
          description: 'Replace :id on confirm/deny/comment routes after creating an occurrence',
        },
        {
          id: 'contributorId',
          label: 'contributorId',
          value: EXAMPLE_CONTRIBUTOR_ID,
          description: 'Returned by POST /sessions/bootstrap',
        },
        {
          id: 'userAccountId',
          label: 'userAccountId',
          value: EXAMPLE_USER_ACCOUNT_ID,
          description: 'Returned by POST /user-accounts/register',
        },
        {
          id: 'reputationId',
          label: 'reputationId',
          value: EXAMPLE_REPUTATION_ID,
          description: 'Format Rep-XXXXX (5 alphanumeric chars)',
        },
      ],
    },
    {
      title: 'Session bootstrap',
      items: [
        {
          id: 'localKeyRef',
          label: 'localKeyRef',
          value: 'fingerprint-dev-local-001',
          description: 'Opaque device key reference (8–128 chars) for POST /sessions/bootstrap',
        },
        {
          id: 'bootstrapBody',
          label: 'Bootstrap JSON body',
          value: JSON.stringify(
            { cityId: EXAMPLE_CITY_ID, localKeyRef: 'fingerprint-dev-local-001' },
            null,
            2,
          ),
          description: 'Copy into POST /sessions/bootstrap — response contains sessionToken',
        },
      ],
    },
    {
      title: 'Identity & crypto',
      items: [
        {
          id: 'pqcPublicKeyRef',
          label: 'pqcPublicKeyRef',
          value: EXAMPLE_PQC_REF,
          description: '64-char hex ML-DSA-65 public key reference for user registration',
        },
        {
          id: 'deviceProof',
          label: 'deviceProof (dev stub)',
          value: 'dev-proof-stub',
          description: 'Dev-only device binding proof accepted by the local PQC stub',
        },
      ],
    },
    {
      title: 'Sample occurrence body',
      items: [
        {
          id: 'createOccurrenceBody',
          label: 'Create occurrence JSON',
          value: JSON.stringify(
            {
              category: 'pothole',
              description: 'Large pothole near the bus stop — test seed',
              latitude: -12.5423,
              longitude: -55.7219,
              privacyLevel: 'approximate',
            },
            null,
            2,
          ),
          description: 'Requires session token — POST /occurrences',
        },
      ],
    },
    {
      title: 'Quick test flow',
      items: [
        {
          id: 'flow1',
          label: '1. Bootstrap session',
          value: 'POST /sessions/bootstrap (public)',
          description: 'Copy sessionToken from response into the Bearer token field above',
        },
        {
          id: 'flow2',
          label: '2. Create occurrence',
          value: 'POST /occurrences',
          description: 'Use session token; save returned id for confirm/deny/comment',
        },
        {
          id: 'flow3',
          label: '3. Validate',
          value: 'POST /occurrences/:id/confirm or /deny',
          description: 'Use a different session (second bootstrap) to avoid self-validation',
        },
      ],
    },
  ],
};

export function getApiDocumentationSpec(baseUrl?: string): ApiDocumentationSpec {
  if (!baseUrl) {
    return API_DOCUMENTATION_SPEC;
  }

  return { ...API_DOCUMENTATION_SPEC, baseUrl };
}
