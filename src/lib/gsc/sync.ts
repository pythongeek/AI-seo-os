import { db } from "@/lib/db";
import { gscProperties, memberships } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function syncUserProperties(userId: string, sites: any[]) {
    // 1. Find User's Primary Organization (For now, just the first one)
    const userOrg = await db.query.memberships.findFirst({
        where: eq(memberships.userId, userId),
        columns: { orgId: true }
    });

    if (!userOrg) {
        throw new Error("User does not belong to any organization. Cannot list properties.");
    }

    const { orgId } = userOrg;
    const syncedProperties = [];

    for (const site of sites) {
        if (!site.siteUrl) continue;

        const [upserted] = await db.insert(gscProperties)
            .values({
                orgId: orgId,
                propertyUrl: site.siteUrl,
                permissionLevel: site.permissionLevel || "siteRestrictedUser",
                verificationMethod: "",
                lastSynced: new Date(),
            })
            .onConflictDoUpdate({
                target: [gscProperties.orgId, gscProperties.propertyUrl],
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
