'use server';

import { db } from '@/lib/db';
import { skillLibrary } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function checkDatabaseConnection() {
    try {
        // 1. Basic Connection Test
        const [result] = await db.execute(sql`SELECT 1 as connected`);

        // 2. Schema Content Verification (Count Skill Library)
        const skillsCount = await db.select({ count: sql<number>`count(*)` }).from(skillLibrary);

        return {
            success: true,
            connected: !!result,
            skillsLoaded: Number(skillsCount[0].count),
            message: 'Database Connected & Master Schema Verified',
        };
    } catch (error) {
        console.error('Database connection failed:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown database error',
        };
    }
}
