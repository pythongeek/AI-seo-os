import { orchestrator, RoutingPlan } from "./orchestrator";
import { analystAgent } from "./analyst";
import { auditorAgent } from "./technical-auditor";
import { researchAgent } from "./research";
import { optimizerAgent } from "./optimizer";
import { plannerAgent } from "./planner";
import { memoryAgent } from "./memory";

// Placeholder interfaces for Specialist Agents
interface AgentResult {
    agent: string;
    output: string;
    data?: any;
}

const agents = {
    ANALYST: analystAgent,
    AUDITOR: auditorAgent,
    RESEARCH: researchAgent,
    OPTIMIZER: optimizerAgent,
    PLANNER: plannerAgent,
    MEMORY: memoryAgent,
    ASSISTANT: async (input: string) => ({
        agent: "ASSISTANT",
        output: "How can I help you with your SEO today?"
    })
};

/**
 * Multi-Agent Execution Engine
 * Coordinates the execution of agents based on the routing plan.
 */
export const agentEngine = {
    /**
     * Execute the routing plan and yield results as they complete
     */
    async *executePlanGenerator(plan: RoutingPlan, userMessage: string, context: any): AsyncGenerator<AgentResult> {
        // Inject Memory Context into the Loop if present
        const memoryContext = context?.memoryContext || "";
        const effectiveMessage = memoryContext ? `${userMessage}\n\n${memoryContext}` : userMessage;

        // 1. Single Agent Mode
        if (plan.executionMode === "SINGLE") {
            const agent = agents[plan.primaryAgent as keyof typeof agents];
            if (agent) {
                yield await agent(effectiveMessage, context);
            }
        }

        // 2. Sequential Mode (Chain of Thought / Handoff)
        else if (plan.executionMode === "SEQUENTIAL") {
            const primaryAgent = agents[plan.primaryAgent as keyof typeof agents];
            const primaryResult = await primaryAgent(effectiveMessage, context);
            yield primaryResult;

            if (plan.secondaryAgents) {
                let currentContextStr = `Initial Result: ${primaryResult.output}`;

                for (const secAgentName of plan.secondaryAgents) {
                    const secAgent = agents[secAgentName as keyof typeof agents];
                    const stepMessage = `
                    Using the context below, perform your specialized task.
                    
                    USER REQUEST: ${userMessage}
                    
                    PREVIOUS AGENT OUTPUT:
                    ${currentContextStr}
                    
                    INSTITUTIONAL MEMORY:
                    ${memoryContext}
                    `;

                    const result = await secAgent(stepMessage, context);
                    yield result;
                    currentContextStr += `\n\nResult from ${secAgentName}: ${result.output}`;
                }
            }
        }

        // 3. Parallel Mode
        else if (plan.executionMode === "PARALLEL") {
            const promises = [];
            const agent = agents[plan.primaryAgent as keyof typeof agents];
            if (agent) promises.push(agent(effectiveMessage, context));

            if (plan.secondaryAgents) {
                plan.secondaryAgents.forEach(name => {
                    const secAgent = agents[name as keyof typeof agents];
                    if (secAgent) promises.push(secAgent(effectiveMessage, context));
                });
            }

            // For parallel, we still wait for all but we could yield as they finish if we wrapped them
            const results = await Promise.all(promises);
            for (const res of results) {
                yield res;
            }
        }
    },

    /**
     * Legacy executePlan (still needed for non-streaming routes)
     */
    async executePlan(plan: RoutingPlan, userMessage: string, context: any): Promise<AgentResult[]> {
        const results: AgentResult[] = [];
        for await (const result of this.executePlanGenerator(plan, userMessage, context)) {
            results.push(result);
        }
        return results;
    },

    /**
     * streamResponse
     * Validates routing and executes the plan, returning a standard Response.
     * Note: Currently pseudo-streaming (simulated) as agents are blocking.
     */
    async streamResponse(params: {
        routing: RoutingPlan,
        messages: any[],
        propertyId?: string,
        memoryContext?: string
    }) {
        const { routing, messages, propertyId, memoryContext } = params;
        const lastMessage = messages[messages.length - 1].content;

        // Build Context Object
        // In a real scenario, we'd fetch property details here.
        const context = {
            propertyId,
            memoryContext,
            // Mock data for specialist agents if DB lookup not done here
            url: "https://example.com/mock-property",
            diagnostics: { indexing: [], content: [] }
        };

        const results = await this.executePlan(routing, lastMessage, context);

        // Format for Client
        // Simple JSON response for now, client can handle multiple agent outputs.
        return new Response(JSON.stringify({
            routing,
            results
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
