-- ============================================================
-- Saya RAG Knowledge Base
-- Paste this entire block into Supabase Studio → SQL Editor
-- ============================================================

-- Table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  title     TEXT    NOT NULL,
  content   TEXT    NOT NULL,
  category  TEXT    NOT NULL DEFAULT 'general',
  source    TEXT    NOT NULL DEFAULT 'atlas',
  fts       tsvector GENERATED ALWAYS AS (
              to_tsvector('english', title || ' ' || content)
            ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_fts_idx ON knowledge_base USING GIN(fts);

-- Search function — called from the Saya backend on every chat message
CREATE OR REPLACE FUNCTION search_knowledge(query_text text, match_limit int DEFAULT 2)
RETURNS TABLE(title text, content text, category text)
LANGUAGE sql STABLE AS $$
  SELECT title, content, category
  FROM knowledge_base
  WHERE fts @@ plainto_tsquery('english', query_text)
  ORDER BY ts_rank(fts, plainto_tsquery('english', query_text)) DESC
  LIMIT match_limit;
$$;
