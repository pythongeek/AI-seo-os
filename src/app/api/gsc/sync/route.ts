import { auth } from "@/lib/auth/config";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId } = body;

    if (!propertyId) {
        return NextResponse.json({ error: "Property ID required" }, { status: 400 });
    }

    // Trigger Inngest function for manual sync
    // We can re-use the dailySync function event or create a specific manual trigger. 
    // For simplicity, we'll send an event that the dailySync function *could* listen to if modified, 
    // but the user requested a specific "Manual Sync" route. 
    // Since 'dailySync' iterates ALL properties, it's better to make a 'manual-sync' event that targets one.
    // However, for this MVP slice, I will send a special event logic or just trigger the run.

    // Better approach: Direct trigger of the function logic or a dedicated manual sync function.
    // Given the constraints, I will trigger a new event 'app/manual-sync' and have a function listen to it?
    // User instruction says: "Create src/app/api/gsc/sync/route.ts to trigger a manual sync".

    await inngest.send({
        name: "gsc/manual-sync",
        data: { propertyId, userId: session.user.id }
    });

    return NextResponse.json({ success: true, message: "Sync triggered" });
}
