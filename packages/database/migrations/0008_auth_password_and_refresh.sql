-- Phase 6: password credentials, refresh tokens, and account roles

ALTER TABLE user_accounts
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  city_id UUID NOT NULL,
  user_account_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  family_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_account
  ON refresh_tokens (user_account_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family
  ON refresh_tokens (family_id);

CREATE TABLE IF NOT EXISTS user_account_roles (
  user_account_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  city_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('city_admin', 'moderator', 'security_audit', 'lgpd_officer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_account_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_account_roles_city
  ON user_account_roles (city_id, role);
