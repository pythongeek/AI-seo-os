import { z } from 'zod';

const envSchema = z.object({
    // Core Infrastructure
    DATABASE_URL: z.string().url(),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    // Authentication
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),

    // AI & External APIs
    OPENAI_API_KEY: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(), // Legacy, but might be used
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

    // Security
    ENCRYPTION_KEY: z.string().length(64), // 32 bytes in hex

    // Observability (Session 5.2)
    SENTRY_DSN: z.string().url().optional(),

    // System
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

type Env = z.infer<typeof envSchema>;

export const validateEnv = (): Env => {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Invalid environment variables:', result.error.format());
        throw new Error('Environment validation failed');
    }

    return result.data;
};

// Export validated env for use
export const env = validateEnv();
