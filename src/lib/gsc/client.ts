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

    /**
     * Fetch Search Analytics data with pagination handling (25k row limit)
     */
    async fetchSearchAnalytics(
        userId: string,
        propertyId: string,
        propertyUrl: string,
        startDate: string,
        endDate: string,
        dimensions: ('query' | 'page' | 'country' | 'device')[] = ['query', 'page', 'country', 'device']
    ) {
        const client = await getGSCClient(userId);
        const allRows: any[] = [];
        let startRow = 0;
        const ROW_LIMIT = 25000;

        // Safety break to prevent infinite loops on massive properties
        const MAX_LOOPS = 40; // ~1 Million rows per day per property safely covers 99.9% of users
        let loopCount = 0;

        while (loopCount < MAX_LOOPS) {
            console.log(`Fetching GSC data for ${propertyUrl} [${startDate}]: Batch ${loopCount + 1}`);

            const res = await client.searchanalytics.query({
                siteUrl: propertyUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions,
                    rowLimit: ROW_LIMIT,
                    startRow,
                    dataState: 'all' // Support fresh data
                }
            });

            const rows = res.data.rows || [];
            allRows.push(...rows);

            if (rows.length < ROW_LIMIT) {
                break; // Less than limit means we fetched everything
            }

            startRow += ROW_LIMIT;
            loopCount++;
        }

        if (loopCount >= MAX_LOOPS) {
            console.warn(`Hit MAX_LOOPS limit for ${propertyUrl} on ${startDate}. Data might be truncated.`);
        }

        return allRows;
    }, // Added comma

    /**
     * Inspect a specific URL for indexing status
     */
    async inspectUrl(userId: string, propertyUrl: string, inspectionUrl: string) {
        const client = await getGSCClient(userId);

        try {
            const res = await client.urlInspection.index.inspect({
                requestBody: {
                    inspectionUrl: inspectionUrl,
                    siteUrl: propertyUrl,
                    languageCode: 'en-US'
                }
            });
            return res.data.inspectionResult;
        } catch (error: any) {
            console.error(`GSC Inspection failed for ${inspectionUrl}`, error?.message);
            throw new Error(`Failed to inspect URL: ${error?.message}`);
        }
    }
};
