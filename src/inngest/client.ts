import { Inngest } from "inngest";
import { db } from "@/lib/db";
import { gscProperties, backgroundJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "ai-seo-os" });

export const startJob = async (type: string, payload: any, propertyId?: string) => {
    return await db.insert(backgroundJobs).values({
        jobType: type,
        propertyId: propertyId as string, // Cast to string/uuid if valid, schema allows null? schema says references gscProperties, likely nullable? Checking schema: propertyId references gscProperties, nullable? No, looks like it might be required if strict. Checking schema.ts: propertyId references, onDelete cascade. Doesn't say notNull().
        payload,
        status: 'PENDING',
        startedAt: new Date(),
    }).returning();
};

export const completeJob = async (jobId: string, result: any) => {
    // db undefined jobId? We need to track the job ID. 
    // Inngest manages its own state, but we want to mirror to our table.
};
