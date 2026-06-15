-- Initial extensions and occurrences table (PostgreSQL 18.1 + PostGIS)
-- Run via migration tool when database package is wired to CI.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS occurrences (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  city_id UUID NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unverified',
  confidence_level INTEGER NOT NULL DEFAULT 0 CHECK (confidence_level BETWEEN 0 AND 100),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  privacy_level TEXT NOT NULL DEFAULT 'public',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_occurrences_city_id ON occurrences (city_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON occurrences (status) WHERE deleted_at IS NULL;
