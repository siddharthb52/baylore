-- Create function for vector similarity search on historical chunks
CREATE OR REPLACE FUNCTION match_historical_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  chunk_text text,
  section_title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    hc.id,
    hc.source_id,
    hc.chunk_text,
    hc.section_title,
    1 - (hc.embedding <=> query_embedding) AS similarity
  FROM historical_chunks hc
  WHERE 1 - (hc.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION match_historical_chunks IS 'Search historical chunks using vector similarity for RAG queries';
