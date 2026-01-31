import { z } from "zod";
import { db } from "@/lib/db";
import { searchAnalytics, rankingHistory, urlMetrics, rankingVelocity } from "@/db/schema"; // rankingVelocity might be a view, need to handle if View object exists or use raw SQL
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { subDays, format } from "date-fns";

/**
 * Tool: get_search_analytics
 * Fetches time-series data for a property, optionally filtered by URL or Query.
 */
export const getSearchAnalyticsTool = {
    name: "get_search_analytics",
    description: "Get daily search analytics (clicks, impressions, position, ctr) for the last 90 days. Useful for detecting trends.",
    parameters: z.object({
        propertyId: z.string().describe("The ID of the GSC property"),
        url: z.string().optional().describe("Filter by specific Page URL"),
        query: z.string().optional().describe("Filter by specific Search Query"),
        days: z.number().default(30).describe("Number of days to look back (default 30, max 90)"),
    }),
    execute: async ({ propertyId, url, query, days }: { propertyId: string, url?: string, query?: string, days: number }) => {
        const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

        // Construct query filters
        const filters = [
            eq(searchAnalytics.propertyId, propertyId),
            gte(searchAnalytics.date, startDate)
        ];
        if (url) filters.push(eq(searchAnalytics.page, url));
        if (query) filters.push(eq(searchAnalytics.query, query));

        const data = await db.select({
            date: searchAnalytics.date,
            clicks: searchAnalytics.clicks,
            impressions: searchAnalytics.impressions,
            position: searchAnalytics.position,
            ctr: searchAnalytics.ctr,
            // If no filter, this might aggregate excessively? 
            // If url/query NOT provided, this returns RAW rows for the property which is HUGE (millions).
            // Constraint: The Analyst should query AGGREGATES if no specific dimension provided?
            // Or limit to Top X?
            // Let's enforce: If no URL/Query, return Top 50 grouped by Date Only?
            // Actually, "Analyst should ingest... dense CSV". 
            // Let's limit rows to prevent crash. 5000 rows?
        })
            .from(searchAnalytics)
            .where(and(...filters))
            .orderBy(desc(searchAnalytics.date))
            .limit(5000); // Safety cap

        return data;
    },
};

/**
 * Tool: get_ranking_velocity
 * Fetches velocity metrics from the Materialized View (or calculates them).
 */
export const getRankingVelocityTool = {
    name: "get_ranking_velocity",
    description: "Get ranking velocity (momentum) for keywords. Identifies fast-rising or dropping terms.",
    parameters: z.object({
        propertyId: z.string(),
        limit: z.number().default(20).describe("Limit results (default 20)"),
        sort: z.enum(["DROP", "RISE", "VOLATILE"]).default("DROP")
    }),
    execute: async ({ propertyId, limit, sort }: { propertyId: string, limit: number, sort: string }) => {
        // Query the materialized view 'ranking_velocity' (Raw SQL since it's a view)
        // We want to return rows with 'current_pos', 'pos_7d', 'pos_30d'

        let orderByClause = "(current_pos - pos_30_days_ago) DESC"; // Default DROP (positive delta = decline)
        if (sort === "RISE") orderByClause = "(pos_30_days_ago - current_pos) DESC"; // (negative delta reversed)
        if (sort === "VOLATILE") orderByClause = "ABS(current_pos - pos_30_days_ago) DESC";

        const rows = await db.execute(sql`
        SELECT * FROM ranking_velocity 
        WHERE property_id = ${propertyId}
        ORDER BY ${sql.raw(orderByClause)}
        LIMIT ${limit}
    `);

        return rows;
    }
};

/**
 * Tool: get_url_metrics
 * Fetches SPS scores and crawl stats for URLs.
 */
export const getUrlMetricsTool = {
    name: "get_url_metrics",
    description: "Get SEO Priority Scores and technical metrics (crawl frequency) for URLs.",
    parameters: z.object({
        propertyId: z.string(),
        minScore: z.number().optional().describe("Filter by minimum SPS score"),
        limit: z.number().default(20)
    }),
    execute: async ({ propertyId, minScore, limit }: { propertyId: string, minScore?: number, limit: number }) => {
        const filters = [eq(urlMetrics.propertyId, propertyId)];
        if (minScore) filters.push(gte(urlMetrics.seoPriorityScore, minScore.toString()));

        const data = await db.select()
            .from(urlMetrics)
            .where(and(...filters))
            .orderBy(desc(urlMetrics.seoPriorityScore))
            .limit(limit);

        return data;
    }
};
