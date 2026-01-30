import { db } from "@/lib/db";
import { gscProperties } from "@/db/schema";

export async function syncUserProperties(userId: string, sites: any[]) {
    const syncedProperties = [];
    for (const site of sites) {
        if (!site.siteUrl) continue;

        const [upserted] = await db.insert(gscProperties)
            .values({
                userId: userId,
                propertyUrl: site.siteUrl,
                permissionLevel: site.permissionLevel || "siteRestrictedUser",
                verificationMethod: "",
                lastSynced: new Date(),
            })
            .onConflictDoUpdate({
                target: [gscProperties.userId, gscProperties.propertyUrl],
                set: {
                    permissionLevel: site.permissionLevel || "siteRestrictedUser",
                    lastSynced: new Date(),
                }
            })
            .returning();

        syncedProperties.push(upserted);
    }
    return syncedProperties;
}
