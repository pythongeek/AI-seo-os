import { auth } from "@/lib/auth/config";
import { gscService } from "@/lib/gsc/client";
import { db } from "@/lib/db";
import { gscProperties } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { syncUserProperties } from "@/lib/gsc/sync";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Fetch properties from GSC API
        const sites = await gscService.listProperties(userId);

        // 2. Upsert into database
        const syncedProperties = await syncUserProperties(userId, sites);

        // 3. Return the synced properties
        return NextResponse.json({ properties: syncedProperties });

    } catch (error: any) {
        console.error("Error syncing GSC properties:", error);
        return NextResponse.json(
            { error: "Failed to sync properties", details: error.message },
            { status: 500 }
        );
    }
}
