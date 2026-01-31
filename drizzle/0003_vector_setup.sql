-- Custom migration to add semantic_search function
-- Hybrid Scoring: 0.8 * Cosine Similarity + 0.2 * Recency Decay

CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  property_id_param uuid
)
RETURNS TABLE (
  id uuid,
  content_text text,
  metadata jsonb,
  similarity float,
  recency_score float,
  final_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mem.id,
    mem.content_text,
    mem.metadata,
    (1 - (mem.embedding <=> query_embedding))::float AS similarity,
    -- Recency Score: Decentralized decay (1.0 = now, 0.0 = old)
    -- Using 30-day half-life approximation
    (
        GREATEST(0, 1 - (EXTRACT(EPOCH FROM (NOW() - mem.created_at)) / (86400 * 30)))
    )::float AS recency_score,
    -- Hybrid Score formula
    (
        0.8 * (1 - (mem.embedding <=> query_embedding)) + 
        0.2 * GREATEST(0, 1 - (EXTRACT(EPOCH FROM (NOW() - mem.created_at)) / (86400 * 30)))
    )::float AS final_score
  FROM memory_store mem
  WHERE mem.property_id = property_id_param
  AND 1 - (mem.embedding <=> query_embedding) > match_threshold
  ORDER BY final_score DESC
  LIMIT match_count;
END;
$$;
