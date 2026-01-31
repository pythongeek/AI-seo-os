import { db } from "@/lib/db";
import { searchAnalytics } from "@/db/schema";
import { sql } from "drizzle-orm";

export const analyticsService = {
    /**
     * Upsert search analytics data in bulk.
     * Uses composite key constraint for conflict resolution.
     */
    async bulkUpsertAnalytics(rows: {
        propertyId: string;
        date: string;
        query: string;
        page: string;
        country?: string;
        device?: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
    }[]) {
        if (rows.length === 0) return { count: 0 };

        const CHUNK_SIZE = 1000;
        let totalUpserted = 0;

        // Process in chunks to avoid query param limits
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
            // Need to map numeric values to strings for decimal columns if using proper types, 
            // but Drizzle/PostgresJS usually handles number -> numeric conversion automatically if not strict string.
            // However, the error log showed "Types of property 'ctr' are incompatible... Type 'number' is not assignable to type 'string'".
            // So we MUST cast.
            const chunk = rows.slice(i, i + CHUNK_SIZE).map(row => ({
                ...row,
                ctr: row.ctr.toString(),
                position: row.position.toString()
            }));

            await db.insert(searchAnalytics)
                .values(chunk)
                .onConflictDoUpdate({
                    // Must match the unique constraint 'unq_sa_upsert'
                    target: [
                        searchAnalytics.propertyId,
                        searchAnalytics.date,
                        searchAnalytics.query,
                        searchAnalytics.page,
                        searchAnalytics.device,
                        searchAnalytics.country
                    ],
                    set: {
                        clicks: sql`EXCLUDED.clicks`,
                        impressions: sql`EXCLUDED.impressions`,
                        ctr: sql`EXCLUDED.ctr`,
                        position: sql`EXCLUDED.position`,
                    }
                });

            totalUpserted += chunk.length;
        }

        return { count: totalUpserted };
    },

    /**
     * Get sync history stats (simple version for now)
     */
    async getSyncStats(propertyId: string) {
        // This is a placeholder for more complex stats
        // In a real partition scenario, we'd query information_schema or a metadata table
        const result = await db.select({
            count: sql<number>`count(*)`,
            latestDate: sql<string>`max(${searchAnalytics.date})`
        })
            .from(searchAnalytics)
            .where(sql`${searchAnalytics.propertyId} = ${propertyId}`);

        return result[0];
    }
};
