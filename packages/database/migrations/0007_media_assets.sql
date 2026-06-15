-- Media assets for occurrence photo evidence (Phase 5)

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id),
  city_id UUID NOT NULL,
  requested_by_reputation_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  declared_content_length INT NOT NULL,
  raw_storage_key TEXT NOT NULL,
  sanitized_storage_key TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  width INT,
  height INT,
  slot_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_media_occurrence ON media_assets(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_media_status ON media_assets(processing_status)
  WHERE processing_status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_media_requested_by_created
  ON media_assets(requested_by_reputation_id, created_at);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_assets_city_isolation ON media_assets;
CREATE POLICY media_assets_city_isolation ON media_assets
  USING (city_id = current_setting('app.city_id', true)::uuid)
  WITH CHECK (city_id = current_setting('app.city_id', true)::uuid);
