import { z } from "zod";
import { gscService } from "@/lib/gsc/client";

/**
 * Tool: inspect_url
 * Real-time inspection of a URL using Google Search Console API.
 */
export const inspectUrlTool = {
    name: "inspect_url",
    description: "Check the live Google Indexing status of a URL. Returns coverage, mobile usability, and canonical status.",
    parameters: z.object({
        propertyId: z.string().describe("The GSC Property ID (usually the URL)"),
        url: z.string().describe("The specific Page URL to inspect"),
        userId: z.string().describe("The User ID (required for auth)")
        // Logic note: In a real agent flow, userId should be injected from context, 
        // but the tool definition requires strict parameters. 
        // We will inject it in the Agent execution wrapper.
    }),
    execute: async ({ propertyId, url, userId }: { propertyId: string, url: string, userId: string }) => {
        // In GSC API, 'siteUrl' is the property ID. 
        return await gscService.inspectUrl(userId, propertyId, url);
    }
};
