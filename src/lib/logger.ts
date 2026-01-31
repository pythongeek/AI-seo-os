import * as Sentry from '@sentry/nextjs';

const SENSITIVE_KEYS = [
    'refresh_token',
    'access_token',
    'client_secret',
    'NEXTAUTH_SECRET',
    'ENCRYPTION_KEY',
    'OPENAI_API_KEY',
    'password',
    'email'
];

/**
 * Redacts sensitive information from an object or string
 */
function redact(data: any): any {
    if (typeof data === 'string') {
        let redacted = data;
        // Basic pattern matching for common tokens if needed, 
        // but mostly we rely on key-based redaction for objects.
        return redacted;
    }

    if (typeof data !== 'object' || data === null) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(redact);
    }

    const redactedObj: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
            redactedObj[key] = '[REDACTED]';
        } else {
            redactedObj[key] = redact(value);
        }
    }
    return redactedObj;
}

export const logger = {
    info: (message: string, context?: any) => {
        console.log(`[INFO] ${message}`, context ? redact(context) : '');
    },

    warn: (message: string, context?: any) => {
        console.warn(`[WARN] ${message}`, context ? redact(context) : '');
        Sentry.captureMessage(message, {
            level: 'warning',
            extra: context ? redact(context) : undefined,
        });
    },

    error: (message: string, error?: any, context?: any) => {
        console.error(`[ERROR] ${message}`, error, context ? redact(context) : '');

        Sentry.captureException(error || new Error(message), {
            extra: {
                message,
                ...redact(context || {}),
            },
        });
    },

    debug: (message: string, context?: any) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, context ? redact(context) : '');
        }
    }
};
