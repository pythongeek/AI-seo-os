import { db } from "@/lib/db";
import { searchAnalytics, urlMetrics, gscProperties } from "@/db/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { calculatePriorityScore } from "@/lib/algorithms/seo-priority";
import { subDays } from "date-fns";

export const urlService = {
    /**
     * Aggregates performance data and recalculates SEO Priority Scores for all URLs
     * in a property. Upserts results to url_metrics.
     */
    async scoreUrlPriorities(propertyId: string) {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];

        // 1. Aggregate Search Analytics (Clicks, CTR) per Page
        // Use raw SQL for performant aggregation
        const analyticsStats = await db.select({
            page: searchAnalytics.page,
            totalClicks: sql<number>`sum(${searchAnalytics.clicks})`,
            avgCtr: sql<number>`avg(${searchAnalytics.ctr})`,
            // avgPosition: sql<number>`avg(${searchAnalytics.position})` 
        })
            .from(searchAnalytics)
            .where(and(
                eq(searchAnalytics.propertyId, propertyId),
                gte(searchAnalytics.date, thirtyDaysAgo)
            ))
            .groupBy(searchAnalytics.page);

        // Map for O(1) lookup
        const statsMap = new Map(analyticsStats.map(s => [s.page, s]));

        // 2. Fetch existing URL Metrics to preserve crawl/link data
        // (In a full system, Link/Crawl data would come from a Crawler integration)
        const existingMetrics = await db.query.urlMetrics.findMany({
            where: eq(urlMetrics.propertyId, propertyId)
        });

        const metricsMap = new Map(existingMetrics.map(m => [m.url, m]));

        // 3. Merge Lists (Analytics URLs + Existing Known URLs)
        const allUrls = new Set([...statsMap.keys(), ...metricsMap.keys()]);
        const updates: any[] = [];

        for (const url of allUrls) {
            const stats = statsMap.get(url);
            const meta = metricsMap.get(url);

            const clicks = Number(stats?.totalClicks || 0);
            const ctr = Number(stats?.avgCtr || 0);

            // Fallbacks if crawl data missing (Phase 3 crawler handles this)
            const crawlFrequency = meta?.crawlFrequency || 1; // Default low
            const internalLinks = meta?.internalLinksCount || 1;
            const lastCrawled = meta?.lastCrawled ? new Date(meta.lastCrawled) : null;

            const score = calculatePriorityScore({
                clicks,
                ctr,
                crawlFrequency,
                internalLinks,
                lastCrawled
            });

            updates.push({
                propertyId,
                url,
                seoPriorityScore: score.toString(), // numeric cast
                trafficPotential: 0, // Placeholder
                updatedAt: new Date()
                // We preserve other fields or upsert defaults
            });
        }

        // 4. Bulk Upsert
        // Chunking handled here if needed, keeping simple for MPV
        if (updates.length > 0) {
            const CHUNK = 500;
            for (let i = 0; i < updates.length; i += CHUNK) {
                const batch = updates.slice(i, i + CHUNK);
                await db.insert(urlMetrics)
                    .values(batch)
                    .onConflictDoUpdate({
                        target: [urlMetrics.propertyId, urlMetrics.url],
                        set: {
                            seoPriorityScore: sql`EXCLUDED.seo_priority_score`,
                            updatedAt: new Date()
                        }
                    });
            }
        }

        return { urlCount: updates.length };
    }
};
