import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Orchestrator Routing Schema
 * Defines the structured output for the routing decision.
 */
export const RoutingSchema = z.object({
  classification: z.enum([
    "ANALYTICS_QUERY", // "Why did traffic drop?"
    "TECHNICAL_AUDIT", // "Check for broken links", "Indexing"
    "CONTENT_RESEARCH", // "What to write", "Algorithm updates"
    "OPTIMIZATION", // "Fix this", "Generate schema"
    "PLANNING", // "Create a roadmap", "What should I do next?"
    "MEMORY_QUERY", // "What have you learned?", "Consolidation status"
    "GENERAL_CHAT",
    "COMPLEX_TASK"
  ]),
  primaryAgent: z.enum(["ANALYST", "AUDITOR", "RESEARCH", "OPTIMIZER", "PLANNER", "MEMORY", "ASSISTANT"]),
  secondaryAgents: z.array(z.enum(["ANALYST", "AUDITOR", "RESEARCH", "OPTIMIZER", "PLANNER", "MEMORY"])).optional(),
  executionMode: z.enum(["SEQUENTIAL", "PARALLEL", "SINGLE"]).default("SINGLE"),
  reasoning: z.string().describe("Brief explanation of why this routing was chosen"),
  nextSteps: z.array(z.string()).describe("List of sub-tasks to execute"),
});

export type RoutingPlan = z.infer<typeof RoutingSchema>;

// Sequencer Output Schema for Step-by-Step Execution
export const SequencerSchema = z.object({
  order: z.array(z.enum(["ANALYST", "AUDITOR", "RESEARCH", "OPTIMIZER", "PLANNER", "MEMORY"])),
  contextStrategy: z.string().describe("How to pass context between agents (e.g. 'Pass Audit Findings to Optimizer')"),
  resolutionStrategy: z.string().describe("How to resolve conflicts (e.g. 'Auditor overrides Analyst on technical issues')"),
});

/**
 * Orchestrator Agent
 * Classifies user intent and determines the execution plan.
 */
export const orchestrator = {
  /**
   * classifyAndRoute
   * Analyzes the user message and property context to generate a routing plan.
   */
  async classifyAndRoute(
    userMessage: string,
    propertyContext?: {
      url: string;
      totalClicks: number;
      decliningPages: number;
      userId?: string; // Needed for authenticated tools (Auditor)
    }
  ): Promise<RoutingPlan> {
    const contextString = propertyContext
      ? `Active Property: ${propertyContext.url} | Clicks (30d): ${propertyContext.totalClicks} | Declining Pages: ${propertyContext.decliningPages}`
      : "No active property selected.";

    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: RoutingSchema,
      system: `
        You are the Orchestrator for the AI SEO OS. Your job is to route user queries to the best specialist agent.
        
        Available Agents:
        - ANALYST: Reads search analytics, traffic trends, and URL performance. Best for "Verify", "Analyze", "Why".
        - AUDITOR: Checks for technical issues (Indexing, 404s, Robots.txt). Best for "Audit", "Check Indexing", "Fix".
        - RESEARCH: Uses Google Search to find external data (Algorithm updates, Competitors, Keywords). Best for "Plan", "Suggest", "Find topics".
        - OPTIMIZER: Generates code fixes (Schema, Metas, Titles) and Internal Links. Best for "Optimize", "Generate", "Fix".
        - PLANNER: Creates strategic roadmaps and action plans. Best for "Planning", "Roadmap", "What next?".
        - MEMORY: Reports on "Institutional Knowledge", learned skills, and consolidation status. Best for "What have you learned?", "Show me working strategies".
        - ASSISTANT: Handles general greetings, help, or unknown queries.

        Context:
        ${contextString}

        Rules:
        1. **ANALYST**: "Why did traffic drop?", "Analyze this URL performance". Focus on internal data.
        2. **AUDITOR**: "Why isn't this page indexing?", "Check for 404s", "Technical health". Focus on GSC technicals.
        3. **RESEARCH**: "Keyword gaps", "Algorithm updates", "Competitor analysis". Focus on external strategy.
        4. **OPTIMIZER**: "Fix this", "Write meta description", "Generate Schema". Focus on code generation.
        5. **PLANNER**: "Build a roadmap", "What should I do this week?". Focus on timeline/resources.
        6. **MEMORY**: "What strategies worked?", "Summarize learnings".
        7. **Complex**: "Audit this site and give me a fix" -> COMPLEX_TASK + SEQUENTIAL (Auditor -> Optimizer).
      `,
      prompt: userMessage,
    });

    return object;
  },

  /**
   * generateSequence
   * Uses Gemini 1.5 Pro to plan a complex sequential workflow.
   */
  async generateSequence(userMessage: string): Promise<z.infer<typeof SequencerSchema>> {
    const { object } = await generateObject({
      model: google("gemini-1.5-pro"), // Use Pro for complex planning
      schema: SequencerSchema,
      system: `
        You are the Swarm Commander. Design a sequential execution chain for the user request.
        
        AGENTS: ANALYST, AUDITOR, RESEARCH, OPTIMIZER, PLANNER.
        
        PATTERNS:
        - "Audit and Fix": AUDITOR -> OPTIMIZER
        - "Full Audit": ANALYST -> AUDITOR -> OPTIMIZER -> PLANNER
        - "Content Plan": RESEARCH -> PLANNER
        
        CONFLICT RESOLUTION:
        - If Analyst says "Traffic Down" but Auditor says "Technical Fine", Trust Auditor on Technical, Analyst on Trends.
        - If Research says "Gap" but Planner says "No Capacity", Planner Dependencies win.
      `,
      prompt: userMessage,
    });
    return object;
  }
};
