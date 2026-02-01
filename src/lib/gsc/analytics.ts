import { db } from "@/lib/db";
import { searchAnalytics } from "@/db/schema";
import { sql, eq, and, gte, desc } from "drizzle-orm";
import { subDays } from "date-fns";

export async function getDashboardKPIs(propertyId: string) {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const sixtyDaysAgo = subDays(today, 60);

    // Helper for safe number parsing
    const safeNum = (val: string | number | null) => Number(val) || 0;

    // 1. Fetch Current Period Metrics (Last 30 Days)
    const [currentPeriod] = await db.select({
        clicks: sql<number>`sum(${searchAnalytics.clicks})`,
        impressions: sql<number>`sum(${searchAnalytics.impressions})`,
        ctr: sql<number>`avg(${searchAnalytics.ctr})`,
        position: sql<number>`avg(${searchAnalytics.position})`,
    })
        .from(searchAnalytics)
        .where(
            and(
                eq(searchAnalytics.propertyId, propertyId),
                gte(searchAnalytics.date, thirtyDaysAgo.toISOString().split('T')[0])
            )
        );

    // 2. Fetch Previous Period Metrics (30-60 Days Ago) for comparison
    const [previousPeriod] = await db.select({
        clicks: sql<number>`sum(${searchAnalytics.clicks})`,
        impressions: sql<number>`sum(${searchAnalytics.impressions})`,
        ctr: sql<number>`avg(${searchAnalytics.ctr})`,
        position: sql<number>`avg(${searchAnalytics.position})`,
    })
        .from(searchAnalytics)
        .where(
            and(
                eq(searchAnalytics.propertyId, propertyId),
                gte(searchAnalytics.date, sixtyDaysAgo.toISOString().split('T')[0]),
                sql`${searchAnalytics.date} < ${thirtyDaysAgo.toISOString().split('T')[0]}`
            )
        );

    // 3. Calculate Changes
    const calculateChange = (current: number, previous: number) => {
        if (!previous) return 0;
        return ((current - previous) / previous) * 100;
    };

    const metrics = {
        clicks: {
            value: safeNum(currentPeriod?.clicks),
            change: calculateChange(safeNum(currentPeriod?.clicks), safeNum(previousPeriod?.clicks))
        },
        impressions: {
            value: safeNum(currentPeriod?.impressions),
            change: calculateChange(safeNum(currentPeriod?.impressions), safeNum(previousPeriod?.impressions))
        },
        ctr: {
            value: safeNum(currentPeriod?.ctr) * 100, // Database might store as 0.05 for 5%
            change: calculateChange(safeNum(currentPeriod?.ctr), safeNum(previousPeriod?.ctr))
        },
        position: {
            value: safeNum(currentPeriod?.position),
            change: calculateChange(safeNum(currentPeriod?.position), safeNum(previousPeriod?.position))
        }
    };

    // 4. Fetch Sparkline Data (Daily Stats for last 30 days)
    const sparklineData = await db.select({
        date: searchAnalytics.date,
        clicks: sql<number>`sum(${searchAnalytics.clicks})`,
        impressions: sql<number>`sum(${searchAnalytics.impressions})`,
        position: sql<number>`avg(${searchAnalytics.position})`,
    })
        .from(searchAnalytics)
        .where(
            and(
                eq(searchAnalytics.propertyId, propertyId),
                gte(searchAnalytics.date, thirtyDaysAgo.toISOString().split('T')[0])
            )
        )
        .groupBy(searchAnalytics.date)
        .orderBy(searchAnalytics.date);

    return {
        metrics,
        sparklineData
    };
}
