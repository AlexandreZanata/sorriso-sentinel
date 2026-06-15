-- Occurrence audit log + enforce RLS for table owner (API runtime user)

CREATE TABLE IF NOT EXISTS occurrence_audit (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  city_id UUID NOT NULL,
  occurrence_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_ref TEXT,
  before_state JSONB,
  after_state JSONB,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT occurrence_audit_action_check
    CHECK (action IN ('occurrence_created', 'occurrence_status_changed', 'occurrence_updated')),
  CONSTRAINT occurrence_audit_actor_type_check
    CHECK (actor_type IN ('contributor', 'user_account', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_occurrence_audit_city_created
  ON occurrence_audit (city_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_occurrence_audit_occurrence_id
  ON occurrence_audit (occurrence_id);

ALTER TABLE occurrence_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS occurrence_audit_city_isolation ON occurrence_audit;
CREATE POLICY occurrence_audit_city_isolation ON occurrence_audit
  USING (city_id = current_setting('app.city_id', true)::uuid)
  WITH CHECK (city_id = current_setting('app.city_id', true)::uuid);

-- Table owner must respect RLS (sentinel runtime user)
ALTER TABLE contributors FORCE ROW LEVEL SECURITY;
ALTER TABLE occurrences FORCE ROW LEVEL SECURITY;
ALTER TABLE occurrence_comments FORCE ROW LEVEL SECURITY;
ALTER TABLE occurrence_audit FORCE ROW LEVEL SECURITY;
