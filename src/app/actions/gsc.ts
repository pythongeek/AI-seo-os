'use server';

import { auth } from "@/lib/auth/config";
import { gscService } from "@/lib/gsc/client";
import { syncUserProperties } from "@/lib/gsc/sync";
import { db } from "@/lib/db";
import { gscProperties } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Server Action to sync properties from GSC API
 */
export async function syncProperties() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const sites = await gscService.listProperties(session.user.id);
        const synced = await syncUserProperties(session.user.id, sites);
        revalidatePath('/onboarding');
        return { success: true, count: synced.length };
    } catch (error: any) {
        console.error("Sync error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action to initialize a property (set status to active)
 */
export async function initializeProperty(propertyId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        // Enforce RLS-like check + Update
        // Note: For now, we allow multiple properties to be 'active'.
        // Or should we set others to idle? The prompt says "Update sync_status to 'active'".

        await db.update(gscProperties)
            .set({ syncStatus: 'active' })
            .where(
                and(
                    eq(gscProperties.id, propertyId),
                    eq(gscProperties.userId, session.user.id)
                )
            );

        revalidatePath('/onboarding');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
