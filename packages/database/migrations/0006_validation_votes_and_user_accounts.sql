-- Validation votes and user accounts

CREATE TABLE IF NOT EXISTS validation_votes (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id),
  city_id UUID NOT NULL,
  voter_reputation_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('confirm', 'deny')),
  reason TEXT,
  trust_weight_applied DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (occurrence_id, voter_reputation_id)
);

CREATE INDEX IF NOT EXISTS idx_validation_votes_occurrence
  ON validation_votes (occurrence_id);

CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  city_id UUID NOT NULL,
  contributor_id TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  email_ciphertext TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL,
  email_verification_state TEXT NOT NULL,
  show_identity_on_reports BOOLEAN NOT NULL DEFAULT false,
  profile_photo_storage_key TEXT,
  profile_photo_visibility TEXT NOT NULL DEFAULT 'private',
  pqc_public_key_ref TEXT NOT NULL,
  lgpd_consent JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (city_id, email_normalized),
  UNIQUE (city_id, contributor_id)
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  user_account_id UUID PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
