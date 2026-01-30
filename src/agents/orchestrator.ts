/**
 * AI SEO Operating System - Agent Orchestrator
 * 
 * Routes user queries to appropriate specialist agents
 * using intent classification and swarm coordination.
 */

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Agent types
export type AgentType = 
  | 'ANALYST' 
  | 'RESEARCH' 
  | 'TECHNICAL_AUDITOR' 
  | 'OPTIMIZER' 
  | 'PLANNER' 
  | 'MEMORY';

// Execution modes
export type ExecutionMode = 'sequential' | 'parallel';

// Routing result
export interface AgentRouting {
  primary_agent: AgentType;
  secondary_agents: AgentType[];
  execution_mode: ExecutionMode;
  reasoning: string;
  estimated_tokens: number;
}

// Intent classification schema
const routingSchema = z.object({
  primary_agent: z.enum(['ANALYST', 'RESEARCH', 'TECHNICAL_AUDITOR', 'OPTIMIZER', 'PLANNER']),
  secondary_agents: z.array(z.enum(['ANALYST', 'RESEARCH', 'TECHNICAL_AUDITOR', 'OPTIMIZER', 'PLANNER'])),
  execution_mode: z.enum(['sequential', 'parallel']),
  reasoning: z.string(),
  estimated_tokens: z.number().default(2000)
});

/**
 * Classify user intent and route to appropriate agents
 */
export async function classifyAndRoute(
  userQuery: string,
  context?: {
    currentPage?: string;
    selectedProperty?: string;
    conversationHistory?: string[];
  }
): Promise<AgentRouting> {
  const model = google('gemini-1.5-flash', {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]
  });

  const systemPrompt = `You are the Agent Orchestrator for an AI SEO Operating System.

Your task is to analyze user queries and route them to the appropriate specialist agent(s).

Available Agents:
1. ANALYST - Performance interpretation, anomaly detection, trend analysis
   Use for: "Why did traffic drop?", "Find ranking changes", "CTR anomalies"

2. RESEARCH - Content gap analysis, keyword clustering, SERP research
   Use for: "Find keyword gaps", "What content should I create?", "Competitor analysis"

3. TECHNICAL_AUDITOR - Crawl issues, indexing problems, technical diagnostics
   Use for: "Why isn't this page indexing?", "Fix crawl errors", "robots.txt issues"

4. OPTIMIZER - On-page SEO improvements, title/meta optimization
   Use for: "Optimize this page", "Improve CTR", "Fix headers"

5. PLANNER - Strategic roadmaps, action plans, milestone creation
   Use for: "Create SEO roadmap", "What should I do this month?", "6-month plan"

Routing Rules:
- Traffic/ranking questions → ANALYST
- Content/opportunity questions → RESEARCH
- Technical/indexing questions → TECHNICAL_AUDITOR
- On-page optimization → OPTIMIZER
- Strategy/planning → PLANNER
- Complex queries may need multiple agents in sequence

Context: ${context ? JSON.stringify(context) : 'No additional context'}

Output JSON with routing decision.`;

  try {
    const result = await generateObject({
      model,
      schema: routingSchema,
      system: systemPrompt,
      prompt: `User query: "${userQuery}"`,
      temperature: 0.1, // Low creativity for consistent routing
      maxTokens: 500
    });

    return result.object;
  } catch (error) {
    console.error('Routing error:', error);
    
    // Fallback to ANALYST if classification fails
    return {
      primary_agent: 'ANALYST',
      secondary_agents: [],
      execution_mode: 'sequential',
      reasoning: 'Fallback due to classification error',
      estimated_tokens: 2000
    };
  }
}

/**
 * Execute agents in sequence
 */
export async function executeSequential(
  routing: AgentRouting,
  userQuery: string,
  context: any
): Promise<any> {
  const results: any[] = [];
  const agents = [routing.primary_agent, ...routing.secondary_agents];

  for (const agent of agents) {
    const result = await executeAgent(agent, userQuery, context, results);
    results.push({ agent, result });
  }

  return aggregateResults(results);
}

/**
 * Execute agents in parallel
 */
export async function executeParallel(
  routing: AgentRouting,
  userQuery: string,
  context: any
): Promise<any> {
  const agents = [routing.primary_agent, ...routing.secondary_agents];

  const results = await Promise.all(
    agents.map(async (agent) => ({
      agent,
      result: await executeAgent(agent, userQuery, context, [])
    }))
  );

  return aggregateResults(results);
}

/**
 * Execute a single agent
 */
async function executeAgent(
  agentType: AgentType,
  userQuery: string,
  context: any,
  previousResults: any[]
): Promise<any> {
  switch (agentType) {
    case 'ANALYST':
      const { analystAgent } = await import('./analyst');
      return analystAgent.analyze(userQuery, context, previousResults);
    
    case 'RESEARCH':
      const { researchAgent } = await import('./research');
      return researchAgent.research(userQuery, context, previousResults);
    
    case 'TECHNICAL_AUDITOR':
      const { technicalAuditorAgent } = await import('./technical-auditor');
      return technicalAuditorAgent.audit(userQuery, context, previousResults);
    
    case 'OPTIMIZER':
      const { optimizerAgent } = await import('./optimizer');
      return optimizerAgent.optimize(userQuery, context, previousResults);
    
    case 'PLANNER':
      const { plannerAgent } = await import('./planner');
      return plannerAgent.plan(userQuery, context, previousResults);
    
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

/**
 * Aggregate results from multiple agents
 */
function aggregateResults(results: Array<{ agent: AgentType; result: any }>): any {
  // Combine insights from all agents
  const combined = {
    summary: '',
    findings: [] as any[],
    recommendations: [] as any[],
    nextSteps: [] as any[]
  };

  for (const { agent, result } of results) {
    if (result.findings) {
      combined.findings.push(...result.findings.map((f: any) => ({ ...f, source: agent })));
    }
    if (result.recommendations) {
      combined.recommendations.push(...result.recommendations.map((r: any) => ({ ...r, source: agent })));
    }
    if (result.nextSteps) {
      combined.nextSteps.push(...result.nextSteps.map((s: any) => ({ ...s, source: agent })));
    }
  }

  // Generate summary
  combined.summary = `Analysis complete. Found ${combined.findings.length} issues and ${combined.recommendations.length} recommendations.`;

  return combined;
}

/**
 * Main orchestration function
 */
export async function orchestrate(
  userQuery: string,
  context?: {
    currentPage?: string;
    selectedProperty?: string;
    conversationHistory?: string[];
  }
): Promise<{
  routing: AgentRouting;
  results: any;
}> {
  // Step 1: Classify and route
  const routing = await classifyAndRoute(userQuery, context);

  // Step 2: Execute based on mode
  const results = routing.execution_mode === 'parallel'
    ? await executeParallel(routing, userQuery, context)
    : await executeSequential(routing, userQuery, context);

  return { routing, results };
}
