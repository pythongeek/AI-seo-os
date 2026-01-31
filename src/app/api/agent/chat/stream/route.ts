import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { gscProperties, memoryStore } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { orchestrator } from '@/agents/orchestrator';
import { agentEngine } from '@/agents/engine';
import { generateEmbedding } from '@/lib/ai/embeddings';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { messages, propertyId } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // 1. Memory Retrieval (Institutional Memory)
    let memoryContext = "";
    try {
        const queryEmbedding = await generateEmbedding(lastMessage);
        const similarMemories: any = await db.execute(sql`
            SELECT content_text, final_score 
            FROM semantic_search(
                ${JSON.stringify(queryEmbedding)}, 
                0.5, 
                3, 
                ${propertyId}
            )
        `);

        if (similarMemories.length > 0) {
            memoryContext = similarMemories.map((m: any) => m.content_text).join("\n---\n");
        }
    } catch (e) {
        console.error("Semantic search failed in stream route", e);
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Step 1: Orchestration
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Orchestrator is analyzing intent...' })}\n\n`));

                const routing = await orchestrator.classifyAndRoute(lastMessage);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'routing', data: routing })}\n\n`));

                // Step 2: Agent Execution via Generator
                const context = { propertyId, memoryContext };

                for await (const result of agentEngine.executePlanGenerator(routing, lastMessage, context)) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'agent_result', data: result })}\n\n`));
                }

                // Step 3: Persistence (Async)
                // We'll skip formal persistence in the stream for now to keep it fast, 
                // but usually we'd store the interaction here too.

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Complete' })}\n\n`));
                controller.close();
            } catch (error: any) {
                console.error("Stream Error:", error);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`));
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
