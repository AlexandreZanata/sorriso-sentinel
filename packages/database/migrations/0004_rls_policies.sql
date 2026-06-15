-- Row Level Security policies (tenant isolation via app.city_id session setting)

ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrence_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contributors_city_isolation ON contributors;
CREATE POLICY contributors_city_isolation ON contributors
  USING (city_id = current_setting('app.city_id', true)::uuid)
  WITH CHECK (city_id = current_setting('app.city_id', true)::uuid);

DROP POLICY IF EXISTS occurrences_city_isolation ON occurrences;
CREATE POLICY occurrences_city_isolation ON occurrences
  USING (city_id = current_setting('app.city_id', true)::uuid)
  WITH CHECK (city_id = current_setting('app.city_id', true)::uuid);

DROP POLICY IF EXISTS occurrence_comments_city_isolation ON occurrence_comments;
CREATE POLICY occurrence_comments_city_isolation ON occurrence_comments
  USING (city_id = current_setting('app.city_id', true)::uuid)
  WITH CHECK (city_id = current_setting('app.city_id', true)::uuid);

-- Sensitive occurrences: hide contributor reputation from non-service roles
DROP POLICY IF EXISTS occurrences_hide_sensitive_contributor ON occurrences;
CREATE POLICY occurrences_hide_sensitive_contributor ON occurrences
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT is_sensitive
    OR current_setting('app.bypass_sensitive', true) = 'true'
  );
