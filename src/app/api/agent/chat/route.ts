import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { orchestrator } from "@/agents/orchestrator";
import { agentEngine } from "@/agents/engine";
import { memoryStore } from "@/db/schema";
import { sql } from "drizzle-orm";

export const maxDuration = 300; // 5 minutes for complex chains
export const runtime = 'nodejs'; // Node runtime required for standard PG driver

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Debug mode handling: User might be mocked in previous steps, but for API we need security or mock context.
        // For Session 4.1, assuming authenticated or debug bypass is handled in middleware/frontend.

        const { messages, propertyId } = await req.json();
        const lastMessage = messages[messages.length - 1].content;
        const history = messages.slice(0, -1);

        // 1. Generate Embedding for current query
        const queryEmbedding = await generateEmbedding(lastMessage);

        // 2. Retrieve Relevant Memories (Institutional Memory)
        // Hybrid Score: 0.8 * Cosine + 0.2 * Recency
        // Threshold 0.5 to fallback to generic knowledge if nothing relevant.
        let memoryContext = "";
        try {
            if (propertyId) {
                const similarMemories = await db.execute(sql`
                    SELECT content_text, final_score 
                    FROM semantic_search(
                        ${JSON.stringify(queryEmbedding)}, 
                        0.5, 
                        5, 
                        ${propertyId}
                    )
                `);

                if (similarMemories.length > 0) {
                    memoryContext = `
                    PAST MEMORIES (INSTITUTIONAL KNOWLEDGE):
                    The following are relevant past actions and insights from this property. Use them to guide your decision (don't repeat mistakes, re-use success):
                    ${similarMemories.map((m: any) => `- [Score: ${m.final_score.toFixed(2)}] ${m.content_text}`).join('\n')}
                    `;
                }
            }
        } catch (e) {
            console.error("Memory Retrieval Error:", e);
            // Non-blocking failure
        }

        // 3. Orchestration with Memory Context
        // We append memoryContext to the user message for the Orchestrator's visibility, 
        // OR inject it into the System Prompt of the agent that gets routed to.
        // Let's pass it to the Orchestrator first.

        const propertyContext = propertyId ? await getPropertyContext(propertyId) : undefined;
        // Inject memory into the message or context?
        // Let's append to the user message logically for the LLM, preserving the original intent.
        const augmentedMessage = memoryContext ? `${lastMessage}\n\n${memoryContext}` : lastMessage;

        const routing = await orchestrator.classifyAndRoute(augmentedMessage, propertyContext);

        // 4. Execution
        // Run the agent engine with the routing plan and history
        return agentEngine.streamResponse({
            routing,
            messages: messages, // Pass original messages, agent instructions will contain the context
            propertyId,
            memoryContext // Pass explicitly to engine to inject into System Prompt
        });

        // 5. Async Memory Storage (Fire and Forget)
        // We want to store the User Query and potentially the Agent's Plan/Response.
        // Since we are streaming, we can't store the full response here easily without intercepting the stream.
        // Strategy: Store the specific "Action Item" or "Insight" later in the agent logic.
        // For now, let's store the User Query as EPISODIC memory if it's a "COMPLEX" or "PLANNING" task.
        if (propertyId) {
            (async () => {
                try {
                    await db.insert(memoryStore).values({
                        propertyId,
                        memoryType: 'EPISODIC',
                        contentText: `User Query: ${lastMessage} -> Routed to: ${routing.primaryAgent}`,
                        embedding: queryEmbedding,
                        metadata: { routing },
                        importanceWeight: '0.5'
                    });
                } catch (e) {
                    console.error("Async Memory Store Error:", e);
                }
            })();
        }

    } catch (error) {
        console.error("API Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

async function getPropertyContext(propertyId: string) {
    // Simple fetch for context
    // This assumes db definition matches
    return {
        url: 'https://example.com', // Placeholder/Mock, ideally fetch from DB
        totalClicks: 1000,
        decliningPages: 5
    };
}
