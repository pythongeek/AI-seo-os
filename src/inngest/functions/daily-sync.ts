import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { gscProperties, backgroundJobs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { gscService } from "@/lib/gsc/client";
import { analyticsService } from "@/lib/db/services/analytics-service";
import { urlService } from "@/lib/db/services/url-service";
import { subDays, format } from "date-fns";

export const dailySync = inngest.createFunction(
    { id: "daily-gsc-sync" },
    { cron: "0 0 * * *" }, // Run daily at midnight
    async ({ step }) => {

        // 1. Fetch active properties
        const properties = await step.run("fetch-active-properties", async () => {
            return await db.query.gscProperties.findMany({
                where: eq(gscProperties.syncStatus, "active"),
            });
        });

        if (properties.length === 0) {
            return { message: "No active properties to sync" };
        }

        const results = [];

        // 2. Iterate and sync each property
        for (const prop of properties) {
            const result = await step.run(`sync-property-${prop.id}`, async () => {
                const jobId = crypto.randomUUID();
                const today = new Date();
                const endDate = format(subDays(today, 3), 'yyyy-MM-dd'); // 3 days lag
                const startDate = format(subDays(today, 6), 'yyyy-MM-dd'); // 3 day window

                await db.insert(backgroundJobs).values({
                    id: jobId,
                    jobType: 'daily_sync',
                    propertyId: prop.id,
                    status: 'RUNNING',
                    payload: { startDate, endDate },
                    startedAt: new Date(),
                });

                try {
                    console.log(`Syncing ${prop.propertyUrl} for ${startDate} to ${endDate}`);
                    const dimensions: any[] = ['date', 'query', 'page', 'country', 'device'];
                    const rows = await gscService.fetchSearchAnalytics(
                        prop.userId,
                        prop.id,
                        prop.propertyUrl,
                        startDate,
                        endDate,
                        dimensions
                    );

                    const dbRows = rows.map((r: any) => ({
                        propertyId: prop.id,
                        date: r.keys[0],
                        query: r.keys[1],
                        page: r.keys[2],
                        country: r.keys[3],
                        device: r.keys[4],
                        clicks: r.clicks,
                        impressions: r.impressions,
                        ctr: r.ctr,
                        position: r.position
                    }));

                    const { count } = await analyticsService.bulkUpsertAnalytics(dbRows);

                    await db.update(backgroundJobs)
                        .set({
                            status: 'COMPLETED',
                            result: { rowsSynced: count },
                            completedAt: new Date()
                        })
                        .where(eq(backgroundJobs.id, jobId));

                    return { property: prop.propertyUrl, rows: count, success: true };

                } catch (error: any) {
                    console.error(`Sync failed for ${prop.propertyUrl}`, error);
                    await db.update(backgroundJobs)
                        .set({ status: 'FAILED', errorMessage: error.message, completedAt: new Date() })
                        .where(eq(backgroundJobs.id, jobId));

                    return { property: prop.propertyUrl, error: error.message, success: false };
                }
            });
            results.push(result);

            // 3. Score URLs (if sync successful)
            // Check for success flag explicitly to avoid TS error on 'error' property access
            if (result && (result as any).success) {
                await step.run(`score-urls-${prop.id}`, async () => {
                    await urlService.scoreUrlPriorities(prop.id);
                });
            }
        }

        // 4. Refresh Ranking Velocity View (Concurrent to allow reads)
        await step.run("refresh-velocity-view", async () => {
            // Drizzle raw execute
            await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ranking_velocity`);
            return { success: true };
        });

        return { results };
    }
);
