-- Identity + occurrence creation extensions (PostgreSQL 18)

CREATE TABLE IF NOT EXISTS contributors (
  id UUID PRIMARY KEY,
  city_id UUID NOT NULL,
  reputation_id TEXT NOT NULL,
  identity_mode TEXT NOT NULL DEFAULT 'ghost',
  pseudonym TEXT,
  public_profile_id UUID,
  local_key_fingerprint TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contributors_identity_mode_check
    CHECK (identity_mode IN ('ghost', 'pseudonym', 'public'))
);

CREATE UNIQUE INDEX IF NOT EXISTS contributors_city_local_key_unique
  ON contributors (city_id, local_key_fingerprint);

CREATE UNIQUE INDEX IF NOT EXISTS contributors_city_pseudonym_unique
  ON contributors (city_id, lower(pseudonym))
  WHERE pseudonym IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contributors_city_id ON contributors (city_id);

ALTER TABLE occurrences
  ADD COLUMN IF NOT EXISTS contributor_reputation_id TEXT,
  ADD COLUMN IF NOT EXISTS occurrence_kind TEXT NOT NULL DEFAULT 'problem',
  ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS author_display_policy TEXT NOT NULL DEFAULT 'ghost',
  ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE occurrences
SET contributor_reputation_id = 'legacy-unknown'
WHERE contributor_reputation_id IS NULL;

ALTER TABLE occurrences
  ALTER COLUMN contributor_reputation_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_occurrences_city_created
  ON occurrences (city_id, created_at DESC);
