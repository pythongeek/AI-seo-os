import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Key must be 32 bytes (256 bits) for AES-256
const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
    return key;
}

export function encrypt(text: string): string {
    const key = getKey();

    // Generate 12 byte IV (standard for GCM)
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
    const key = getKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format. Expected iv:authTag:encrypted');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    const decipher = createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
