DROP MATERIALIZED VIEW IF EXISTS ranking_velocity;

CREATE MATERIALIZED VIEW ranking_velocity AS
WITH latest_dates AS (
    SELECT property_id, query, MAX(date) as last_date
    FROM search_analytics
    GROUP BY property_id, query
),
current_stats AS (
    SELECT sa.property_id, sa.query, sa.position as current_pos, sa.date
    FROM search_analytics sa
    INNER JOIN latest_dates ld 
    ON sa.property_id = ld.property_id 
    AND sa.query = ld.query 
    AND sa.date = ld.last_date
),
hist_7d AS (
    SELECT sa.property_id, sa.query, sa.position as pos_7d
    FROM search_analytics sa
    WHERE sa.date > CURRENT_DATE - INTERVAL '60 days' 
),
velocity_calc AS (
    SELECT 
        property_id, 
        query, 
        date,
        position,
        LAG(position, 7) OVER (PARTITION BY property_id, query ORDER BY date) as pos_7d_lag,
        LAG(date, 7) OVER (PARTITION BY property_id, query ORDER BY date) as date_7d_lag,
        LAG(position, 30) OVER (PARTITION BY property_id, query ORDER BY date) as pos_30d_lag
    FROM search_analytics
    WHERE date > CURRENT_DATE - INTERVAL '60 days'
)
SELECT 
    vc.property_id,
    vc.query,
    MAX(vc.date) as report_date,
    
    -- Current Position (Last available)
    (ARRAY_AGG(vc.position ORDER BY vc.date DESC))[1] as current_pos,
    
    -- 7 Day Metrics
    (ARRAY_AGG(vc.pos_7d_lag ORDER BY vc.date DESC))[1] as pos_7_days_ago,
    
    -- 30 Day Metrics
    (ARRAY_AGG(vc.pos_30d_lag ORDER BY vc.date DESC))[1] as pos_30_days_ago
    
FROM velocity_calc vc
GROUP BY vc.property_id, vc.query;

CREATE UNIQUE INDEX idx_mv_velocity_pk ON ranking_velocity (property_id, query);
