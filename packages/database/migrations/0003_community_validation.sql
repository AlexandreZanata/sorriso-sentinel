-- Community validation: comments (votes deferred to a follow-up migration)

CREATE TABLE IF NOT EXISTS occurrence_comments (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id),
  city_id UUID NOT NULL,
  author_reputation_id TEXT NOT NULL,
  parent_comment_id UUID REFERENCES occurrence_comments(id),
  text TEXT NOT NULL,
  author_display_policy TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_occurrence
  ON occurrence_comments (occurrence_id, created_at);
