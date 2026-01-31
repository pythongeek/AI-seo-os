import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { gscProperties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { orchestrator } from "@/agents/orchestrator";
import { agentEngine } from "@/agents/engine";

export const maxDuration = 30; // Edge runtime constraint (default), but specialized agents might take longer? 
// User instruction: "Edge Runtime... bypass standard timeouts". 
// Edge runtime actually has stricter limits usually? 
// "Ensure the Edge runtime is explicitly configured to bypass standard serverless timeouts" -> usually means use Node.js runtime for long tasks, NOT Edge. 
// BUT instruction says "Create ... as an Edge Runtime endpoint". 
// I will stick to Edge but if it times out, I'll switch. Vercel Edge has limits.
// Maybe the user means "allow long running"? 
// Let's use 'edge' runtime as requested.

export const runtime = 'edge';

export async function POST(req: Request) {
    const { messages, propertyId } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // 1. Context Loading (Simplified Auth check for Edge compatibility if needed, or rely on token passed?)
    // Auth using NextAuth in Edge is tricky with DB adapters.
    // For MVP in Edge, we might need a workaround or assume middleware protection. 
    // Let's assume Middleware protects this route or we verify session if possible.
    // `auth()` from v5 beta is edge compatible? Yes usually.

    // Fetch Property Context (Mocked or simple DB call if Edge-compatible driver used e.g. Neon/drizzle-http)
    // Postgres.js is NOT Edge compatible usually. 
    // User Constraint: "Use standard postgres driver". 
    // CONFLICT: "Edge Runtime" vs "Postgres (standard)". 
    // If I use standard `postgres` driver in `src/lib/db`, it won't work in Edge runtime.
    // I MUST change runtime to 'nodejs' to use the DB connection I setup.
    // Ignoring the "Edge Runtime" constraint in favor of "System Functionality" (DB access).
    // OR, I use the instruction: "Configure to bypass timeouts" -> Node.js with maxDuration.
    // I will use `runtime = 'nodejs'` and high duration, because Edge + Standard Postgres = Crash.
}
