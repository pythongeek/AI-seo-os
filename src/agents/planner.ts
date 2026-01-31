import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const MODEL = google("gemini-1.5-pro");

/**
 * Planner Agent
 * Strategic Roadmap Generator & Resource Manager
 */
export const plannerAgent = async (userMessage: string, context: any) => {
    const propertyUrl = context?.url || 'General Property';
    const swarmFindings = context?.findings || "No previous analysis provided.";

    // User Constraints (Default to standard if not provided)
    const constraints = context?.constraints || {
        hoursPerWeek: 5,
        teamSize: "Solo",
        skillLevel: "Intermediate"
    };

    const systemPrompt = `
    You are the PLANNER AGENT for the AI SEO OS.
    Your Goal: Transform Swarm Insights into actionable, prioritized, resource-aware plans.
    
    MODEL CONFIG: Strategic Reasoning (Pro). Analysis Depth: High.

    CONTEXT:
    Property: ${propertyUrl}
    Swarm Findings: ${JSON.stringify(swarmFindings)}
    Constraints: ${JSON.stringify(constraints)}

    CAPABILITIES:

    1. **6-Month Strategic Roadmap**:
       - Break down the goal (e.g. Traffic Growth) into monthly milestones.
       - Logic: Fix Technical Debt (Month 1) -> Content Gap (Month 2-3) -> Authority/Backlinks (Month 4-6).
    
    2. **Weekly Action Plan**:
       - Generate a specific To-Do list for THIS WEEK.
       - STRICT CONSTRAINT: Do not assign more work than fits in ${constraints.hoursPerWeek} hours.
       - Estimate time per task (e.g. "Fix 404s - 2h").

    3. **Dependency Graph Awareness**:
       - Do not schedule "Content Creation" if "Critical Indexing Errors" exist.
       - Do not schedule "Link Building" if "Content" is thin.

    OUTPUT FORMAT:
    
    ## Strategic Roadmap (High Level)
    - **Month 1**: Focus - [Focus Area]
      - Key Milestone: [Milestone]
    ...

    ## Weekly Action Plan (Immediate)
    | Task | Priority | Est. Time | Reason |
    | :--- | :--- | :--- | :--- |
    | [Task Name] | High | [Time] | [Dependency Reason] |
    
    ## Resource Check
    Total Estimated Time: [Total] / ${constraints.hoursPerWeek} Hours.
  `;

    try {
        const result = await generateText({
            model: MODEL,
            system: systemPrompt,
            prompt: userMessage,
        });

        return {
            agent: "PLANNER",
            output: result.text
        };
    } catch (error: any) {
        console.error("Planner Agent Error:", error);
        return {
            agent: "PLANNER",
            output: `Planning failed: ${error.message}`
        };
    }
};
