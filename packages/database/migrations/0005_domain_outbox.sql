CREATE TABLE IF NOT EXISTS domain_outbox (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  city_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_domain_outbox_unpublished
  ON domain_outbox (created_at)
  WHERE published_at IS NULL;
