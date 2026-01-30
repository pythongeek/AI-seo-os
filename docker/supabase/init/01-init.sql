-- AI SEO Operating System - Database Initialization
-- Run this script to set up the database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create n8n database
CREATE DATABASE IF NOT EXISTS n8n;

-- Create main application database
CREATE DATABASE IF NOT EXISTS ai_seo_os;

\c ai_seo_os;

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth accounts (encrypted tokens)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  token_type TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user ON accounts(user_id);

-- GSC Properties
CREATE TABLE IF NOT EXISTS gsc_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_url TEXT NOT NULL,
  verification_method TEXT,
  permission_level TEXT DEFAULT 'siteOwner',
  last_synced TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_url)
);

CREATE INDEX idx_properties_user ON gsc_properties(user_id);
CREATE INDEX idx_properties_sync ON gsc_properties(last_synced) WHERE sync_status = 'active';

-- ==========================================
-- SEARCH ANALYTICS (Time-Series)
-- ==========================================

CREATE TABLE IF NOT EXISTS search_analytics (
  id BIGSERIAL,
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  query TEXT NOT NULL,
  page TEXT NOT NULL,
  country TEXT DEFAULT 'unknown',
  device TEXT DEFAULT 'DESKTOP',
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  position NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, date)
) PARTITION BY RANGE (date);

-- Create initial partitions
CREATE TABLE IF NOT EXISTS search_analytics_2026_01 PARTITION OF search_analytics
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS search_analytics_2026_02 PARTITION OF search_analytics
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS search_analytics_2026_03 PARTITION OF search_analytics
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE INDEX idx_sa_property_date ON search_analytics(property_id, date DESC);
CREATE INDEX idx_sa_query ON search_analytics USING gin(query gin_trgm_ops);
CREATE INDEX idx_sa_striking_distance ON search_analytics(property_id, position)
  WHERE position BETWEEN 7 AND 20;

-- ==========================================
-- URL METRICS
-- ==========================================

CREATE TABLE IF NOT EXISTS url_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  seo_priority_score NUMERIC(3,2) DEFAULT 0.5,
  traffic_potential INTEGER DEFAULT 0,
  crawl_frequency INTEGER DEFAULT 0,
  internal_links_count INTEGER DEFAULT 0,
  external_links_count INTEGER DEFAULT 0,
  indexing_state TEXT DEFAULT 'UNKNOWN',
  last_crawled TIMESTAMPTZ,
  last_indexed TIMESTAMPTZ,
  core_web_vitals_score NUMERIC(3,1),
  page_speed_score NUMERIC(3,1),
  content_score NUMERIC(3,2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, url)
);

CREATE INDEX idx_url_priority ON url_metrics(property_id, seo_priority_score DESC);
CREATE INDEX idx_url_indexing ON url_metrics(property_id, indexing_state);
CREATE INDEX idx_url_crawl ON url_metrics(property_id, crawl_frequency);

-- ==========================================
-- RANKING HISTORY
-- ==========================================

CREATE TABLE IF NOT EXISTS ranking_history (
  id BIGSERIAL PRIMARY KEY,
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  page TEXT NOT NULL,
  date DATE NOT NULL,
  position NUMERIC(5,2),
  position_change NUMERIC(5,2) DEFAULT 0,
  clicks_change INTEGER DEFAULT 0,
  impressions_change INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rh_trends ON ranking_history(property_id, query, date DESC);
CREATE INDEX idx_rh_velocity ON ranking_history(property_id, position_change DESC);

-- Materialized view for ranking velocity
CREATE MATERIALIZED VIEW IF NOT EXISTS ranking_velocity AS
SELECT 
  property_id,
  query,
  page,
  date,
  position,
  position - LAG(position, 7) OVER (
    PARTITION BY property_id, query ORDER BY date
  ) AS change_7d,
  position - LAG(position, 30) OVER (
    PARTITION BY property_id, query ORDER BY date
  ) AS change_30d
FROM ranking_history;

CREATE UNIQUE INDEX idx_rv_unique ON ranking_velocity(property_id, query, page, date);
CREATE INDEX idx_rv_velocity ON ranking_velocity(property_id, change_7d DESC);

-- ==========================================
-- INDEXING ISSUES
-- ==========================================

CREATE TABLE IF NOT EXISTS indexing_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  issue_details JSONB DEFAULT '{}',
  discovered_date DATE DEFAULT CURRENT_DATE,
  resolved_date DATE,
  severity TEXT DEFAULT 'WARNING',
  auto_fix_attempted BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issues_open ON indexing_issues(property_id, resolved_date)
  WHERE resolved_date IS NULL;
CREATE INDEX idx_issues_severity ON indexing_issues(property_id, severity)
  WHERE resolved_date IS NULL;

-- ==========================================
-- AGENT ACTIONS (Episodic Memory)
-- ==========================================

CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  context_summary TEXT,
  affected_urls TEXT[] DEFAULT '{}',
  related_queries TEXT[] DEFAULT '{}',
  action_details JSONB NOT NULL DEFAULT '{}',
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  measured_impact JSONB,
  impact_measured_at TIMESTAMPTZ,
  success_score NUMERIC(3,2),
  notes TEXT
);

CREATE INDEX idx_actions_property ON agent_actions(property_id, executed_at DESC);
CREATE INDEX idx_actions_success ON agent_actions(agent_type, success_score DESC)
  WHERE success_score > 0.7;
CREATE INDEX idx_actions_type ON agent_actions(action_type, executed_at DESC);

-- ==========================================
-- MEMORY STORE (Vector Embeddings)
-- ==========================================

CREATE TABLE IF NOT EXISTS memory_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL DEFAULT 'EPISODIC',
  content_text TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  importance_weight NUMERIC(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  decayed_weight NUMERIC(3,2) GENERATED ALWAYS AS (
    importance_weight * EXP(-EXTRACT(EPOCH FROM (NOW() - created_at)) / 2592000)
  ) STORED
);

-- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS memory_embedding_idx ON memory_store
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_memory_property ON memory_store(property_id, memory_type, last_accessed DESC);
CREATE INDEX idx_memory_importance ON memory_store(importance_weight DESC);

-- ==========================================
-- SKILL LIBRARY
-- ==========================================

CREATE TABLE IF NOT EXISTS skill_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  strategy_description TEXT,
  context_pattern TEXT NOT NULL,
  action_steps JSONB NOT NULL DEFAULT '[]',
  success_rate NUMERIC(4,3) DEFAULT 0,
  times_applied INTEGER DEFAULT 0,
  avg_impact_score NUMERIC(3,2) DEFAULT 0,
  promoted_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_skills_success ON skill_library(success_rate DESC, times_applied DESC);
CREATE INDEX idx_skills_pattern ON skill_library USING gin(context_pattern gin_trgm_ops);
CREATE INDEX idx_skills_tags ON skill_library USING gin(tags);

-- ==========================================
-- AI INSIGHTS
-- ==========================================

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  severity TEXT DEFAULT 'INFO',
  affected_urls TEXT[] DEFAULT '{}',
  recommended_actions JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  acted_upon BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_active ON ai_insights(property_id, dismissed_at, severity)
  WHERE dismissed_at IS NULL;
CREATE INDEX idx_insights_type ON ai_insights(property_id, insight_type, generated_at DESC);

-- ==========================================
-- BACKGROUND JOBS
-- ==========================================

CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING',
  payload JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  worker_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON background_jobs(status, created_at);
CREATE INDEX idx_jobs_property ON background_jobs(property_id, status);
CREATE INDEX idx_jobs_type ON background_jobs(job_type, status);

-- ==========================================
-- CRAWL STATS
-- ==========================================

CREATE TABLE IF NOT EXISTS crawl_stats (
  id BIGSERIAL PRIMARY KEY,
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  crawl_requests_count INTEGER DEFAULT 0,
  crawl_response_time_avg INTEGER DEFAULT 0,
  crawl_errors_count INTEGER DEFAULT 0,
  crawled_bytes BIGINT DEFAULT 0,
  robots_txt_blocked_count INTEGER DEFAULT 0,
  sitemap_urls_submitted INTEGER DEFAULT 0,
  sitemap_urls_indexed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crawl_property_date ON crawl_stats(property_id, date DESC);

-- ==========================================
-- BACKLINKS (Phase 2)
-- ==========================================

CREATE TABLE IF NOT EXISTS backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES gsc_properties(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  link_type TEXT DEFAULT 'dofollow',
  domain_authority NUMERIC(3,1),
  first_seen DATE,
  last_seen DATE,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, source_url, target_url)
);

CREATE INDEX idx_backlinks_property ON backlinks(property_id, status);
CREATE INDEX idx_backlinks_source ON backlinks(source_url);
CREATE INDEX idx_backlinks_target ON backlinks(target_url);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Semantic search function
CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding VECTOR(1536),
  p_property_id UUID,
  result_limit INTEGER DEFAULT 10
) RETURNS TABLE(
  memory_id UUID,
  content TEXT,
  similarity NUMERIC,
  recency_score NUMERIC,
  combined_score NUMERIC
) AS $$
SELECT 
  id AS memory_id,
  content_text AS content,
  1 - (embedding <=> query_embedding) AS similarity,
  EXP(-EXTRACT(EPOCH FROM (NOW() - created_at)) / 2592000) AS recency_score,
  (
    0.8 * (1 - (embedding <=> query_embedding)) +
    0.2 * EXP(-EXTRACT(EPOCH FROM (NOW() - created_at)) / 2592000)
  ) AS combined_score
FROM memory_store
WHERE property_id = p_property_id
  AND memory_type IN ('SEMANTIC', 'EPISODIC')
ORDER BY combined_score DESC
LIMIT result_limit;
$$ LANGUAGE SQL;

-- Calculate SEO priority score
CREATE OR REPLACE FUNCTION calculate_priority_score(
  p_clicks_30d INTEGER,
  p_max_clicks_site INTEGER,
  p_crawl_frequency INTEGER,
  p_internal_links INTEGER,
  p_days_since_update INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  traffic_weight NUMERIC;
  crawl_efficiency NUMERIC;
  internal_link_weight NUMERIC;
  freshness_weight NUMERIC;
BEGIN
  traffic_weight := LEAST(p_clicks_30d::NUMERIC / NULLIF(p_max_clicks_site, 0), 1.0);
  crawl_efficiency := 1.0 / NULLIF(p_crawl_frequency::NUMERIC / 7.0, 0);
  internal_link_weight := LEAST(p_internal_links::NUMERIC / 50.0, 1.0);
  freshness_weight := EXP(-p_days_since_update::NUMERIC / 90.0);
  
  RETURN (
    0.35 * traffic_weight +
    0.25 * crawl_efficiency +
    0.20 * internal_link_weight +
    0.20 * freshness_weight
  );
END;
$$ LANGUAGE plpgsql;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_url_metrics_updated_at BEFORE UPDATE ON url_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_indexing_issues_updated_at BEFORE UPDATE ON indexing_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_backlinks_updated_at BEFORE UPDATE ON backlinks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_background_jobs_updated_at BEFORE UPDATE ON background_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh ranking velocity materialized view
CREATE OR REPLACE FUNCTION refresh_ranking_velocity()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ranking_velocity;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert default skill library entries
INSERT INTO skill_library (strategy_name, strategy_description, context_pattern, action_steps, tags)
VALUES 
  (
    'ctr_title_optimization',
    'When CTR drops but ranking remains stable, optimize title tag',
    'CTR dropped >20% but position stable (±1)',
    '[
      {"step": 1, "action": "Identify primary query from GSC data"},
      {"step": 2, "action": "Add primary keyword to title if missing"},
      {"step": 3, "action": "Include number, year, or benefit in title"}
    ]'::jsonb,
    '{"ctr", "title", "optimization"}'
  ),
  (
    'internal_link_boost',
    'For pages with low indexation, increase internal links',
    'Page crawled but not indexed with <5 internal links',
    '[
      {"step": 1, "action": "Find semantically related pages"},
      {"step": 2, "action": "Add 3-5 contextual internal links"},
      {"step": 3, "action": "Submit for re-indexing"}
    ]'::jsonb,
    '{"indexing", "internal_links", "crawl"}'
  ),
  (
    'striking_distance_push',
    'For keywords ranking 7-20, optimize to reach page 1',
    'Position between 7-20 with >100 impressions',
    '[
      {"step": 1, "action": "Analyze top 3 ranking pages"},
      {"step": 2, "action": "Improve content depth to match/exceed"},
      {"step": 3, "action": "Add FAQ schema for snippet opportunity"}
    ]'::jsonb,
    '{"striking_distance", "ranking", "content"}'
  )
ON CONFLICT DO NOTHING;
