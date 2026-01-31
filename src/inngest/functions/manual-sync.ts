import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { gscProperties, backgroundJobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { gscService } from "@/lib/gsc/client";
import { analyticsService } from "@/lib/db/services/analytics-service";
import { subDays, format } from "date-fns";

export const manualSync = inngest.createFunction(
    { id: "manual-gsc-sync" },
    { event: "gsc/manual-sync" },
    async ({ event, step }) => {
        const { propertyId, userId } = event.data;

        const property = await step.run("fetch-property", async () => {
            return await db.query.gscProperties.findFirst({
                where: and(
                    eq(gscProperties.id, propertyId),
                    eq(gscProperties.userId, userId)
                )
            });
        });

        if (!property) throw new Error("Property not found");

        const jobId = crypto.randomUUID();
        const today = new Date();
        // Manual sync fetches last 3 days by default per spec (or 'all' fresh preview?)
        // "Default to today - 3 days ... allow for dataState: 'all'"
        // Use same 3-day window for consistency
        const endDate = format(subDays(today, 3), 'yyyy-MM-dd');
        const startDate = format(subDays(today, 6), 'yyyy-MM-dd');

        await step.run("sync-gsc-data", async () => {
            // Log job
            await db.insert(backgroundJobs).values({
                id: jobId,
                jobType: 'manual_sync',
                propertyId: property.id,
                status: 'RUNNING',
                payload: { startDate, endDate },
                startedAt: new Date(),
            });

            try {
                const dimensions: any[] = ['date', 'query', 'page', 'country', 'device'];
                const rows = await gscService.fetchSearchAnalytics(
                    property.userId,
                    property.id,
                    property.propertyUrl,
                    startDate,
                    endDate,
                    dimensions
                );

                const dbRows = rows.map((r: any) => ({
                    propertyId: property.id,
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
            } catch (error: any) {
                await db.update(backgroundJobs)
                    .set({ status: 'FAILED', errorMessage: error.message, completedAt: new Date() })
                    .where(eq(backgroundJobs.id, jobId));
                throw error;
            }
        });

        return { success: true };
    }
);
