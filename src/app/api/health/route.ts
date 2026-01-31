import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { Redis } from '@upstash/redis';

// Initialize Redis if variables are present
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

export async function GET() {
    const health: any = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: { status: 'unknown' },
            redis: { status: 'unknown' },
        },
    };

    try {
        // Test Database
        await db.execute(sql`SELECT 1`);
        health.services.database.status = 'healthy';
    } catch (error: any) {
        health.status = 'error';
        health.services.database.status = 'unhealthy';
        health.services.database.error = error.message;
    }

    try {
        // Test Redis
        if (redis) {
            const pong = await redis.ping();
            health.services.redis.status = pong === 'PONG' ? 'healthy' : 'unhealthy';
        } else {
            health.services.redis.status = 'skipped';
            health.services.redis.message = 'Redis credentials missing';
        }
    } catch (error: any) {
        health.status = 'error';
        health.services.redis.status = 'unhealthy';
        health.services.redis.error = error.message;
    }

    return NextResponse.json(health, {
        status: health.status === 'ok' ? 200 : 503
    });
}
