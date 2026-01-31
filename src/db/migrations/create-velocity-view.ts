import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Creating Materialized View: ranking_velocity...");

    // 1. Create CTE logic or View definition
    // We want 7-day and 30-day deltas.
    // Since search_analytics partitions by query/date, calculating lag on the fly is expensive.
    // A materialized view is perfect.

    /*
      View Logic:
      For each (property_id, query) pair on the LATEST date:
      - Get Current Position
      - Get Position 7 days ago
      - Get Position 30 days ago
      - Calculate Velocities
    */

    await db.execute(sql`
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
            -- Ideally we join on exact date - 7, but data might be missing.
            -- Window function LAG approach is better if we have continuous data, 
            -- but with GSC lag, we might just look for date >= target.
            -- Let's stick to simple efficient lookups for now.
            -- JOIN optimization: We can just grab the rows that are closest to target dates?
            -- To strictly follow instruction "Use window functions (LAG)":
            -- Let's use LAG on the whole dataset? That's huge. 
            -- Better: Filter to last 35 days, then use Window functions.
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

        -- Create Index for fast retrieval
        CREATE UNIQUE INDEX idx_mv_velocity_pk ON ranking_velocity (property_id, query);
    `);

    console.log("Materialized View Created Successfully.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Migration Failed:", err);
    process.exit(1);
});
