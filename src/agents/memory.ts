import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { db } from "@/lib/db";
import { skillLibrary, memoryStore } from "@/db/schema";
import { desc, count, sql } from "drizzle-orm";

const MODEL = google("gemini-1.5-flash");

/**
 * Memory Agent
 * Interface for "Institutional Memory". 
 * Allows users to ask: "What have we learned?" or "What strategies are working?"
 */
export const memoryAgent = async (userMessage: string, context: any) => {
    const propertyId = context?.propertyId;

    // Fetch Stats for Context
    const skillCountRes = await db.select({ value: count() }).from(skillLibrary).where(propertyId ? sql`property_id = ${propertyId}` : undefined);
    const memoryCountRes = await db.select({ value: count() }).from(memoryStore).where(propertyId ? sql`property_id = ${propertyId}` : undefined);

    // Fetch Recent Skills
    const recentSkills = await db.select()
        .from(skillLibrary)
        .orderBy(desc(skillLibrary.promotedAt))
        .limit(5);

    const systemPrompt = `
    You are the MEMORY AGENT.
    Your Goal: Report on the "Institutional Knowledge" of the AI SEO OS.
    
    STATS:
    - Total Skills Learned: ${skillCountRes[0].value}
    - Total Memories Stored: ${memoryCountRes[0].value}
    
    RECENTLY PROMOTED SKILLS:
    ${recentSkills.map(s => `- [${s.strategyName}]: ${s.strategyDescription} (Success Rate: ${s.successRate})`).join('\n')}

    CAPABILITIES:
    1. **Summarize Learnings**: Explain what strategies are working best.
    2. **Consolidation Status**: Report on how much data has been processed (Sleep Cycle results if available in logs, otherwise general stats).
    
    If the user asks "What have you learned?", verify the skills above and summarize the most successful high-level patterns.
  `;

    try {
        const result = await generateText({
            model: MODEL,
            system: systemPrompt,
            prompt: userMessage,
        });

        return {
            agent: "MEMORY",
            output: result.text
        };
    } catch (error: any) {
        console.error("Memory Agent Error:", error);
        return {
            agent: "MEMORY",
            output: `Memory analysis failed: ${error.message}`
        };
    }
};
