import { google } from 'googleapis';
import { db } from '@/lib/db';
import { accounts } from '@/db/schema';
import { decrypt } from '@/lib/security/encryption';
import { eq, and } from 'drizzle-orm';

/**
 * Retrieves an authenticated Google Search Console client for the given user.
 * Handles token decryption and OAuth2 client initialization.
 */
export async function getGSCClient(userId: string) {
    // 1. Retrieve the encrypted refresh token from the database
    const userAccount = await db.query.accounts.findFirst({
        where: and(
            eq(accounts.userId, userId),
            eq(accounts.provider, 'google')
        ),
    });

    if (!userAccount || !userAccount.refreshToken) {
        throw new Error('No Google account linked or missing refresh token');
    }

    // 2. Decrypt the refresh token
    const decryptedRefreshToken = decrypt(userAccount.refreshToken);

    // 3. Initialize the OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        process.env.AUTH_GOOGLE_ID,
        process.env.AUTH_GOOGLE_SECRET
    );

    oauth2Client.setCredentials({
        refresh_token: decryptedRefreshToken,
    });

    // 4. Return the Search Console API client
    return google.searchconsole({
        version: 'v1',
        auth: oauth2Client,
    });
}

/**
 * Service functions for GSC interactions
 */
export const gscService = {
    /**
     * List all verified properties for the user
     */
    async listProperties(userId: string) {
        const client = await getGSCClient(userId);
        const res = await client.sites.list();
        return res.data.siteEntry || [];
    },
};
