import { google } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { getSearchAnalyticsTool, getRankingVelocityTool, getUrlMetricsTool } from "./tools/analyst-tools";

const MODEL = google("gemini-1.5-pro");

export const analystAgent = async (userMessage: string, context: any) => {
  const propertyId = context?.propertyId;

  if (!propertyId) {
    return {
      agent: "ANALYST",
      output: "I need a selected property to perform analysis. Please select a property first."
    };
  }

  // Workaround for TS limits: Cast tools to 'any' to avoid strict Zod inference issues during build.
  // The Vercel AI SDK runtime handles Zod tools fine, but TS gets picky about Zod versions.
  const tools: any = {
    getSearchAnalytics: tool(getSearchAnalyticsTool),
    getRankingVelocity: tool(getRankingVelocityTool),
    getUrlMetrics: tool(getUrlMetricsTool),
  };

  const systemPrompt = `
    You are the ANALYST AGENT for the AI SEO OS.
    Your ID is: ${propertyId} (Use this for all tool calls).

    Your Goal: Perform deep analysis of search data to find anomalies, trends, and root causes.
    
    PROTOCOLS:
    1. **Anomaly Detection**:
       - CTR Drop + Position Stable -> Flag as TITLE_META_ISSUE.
       - Position Drop -> Flag as RANK_RELEVANCE_ISSUE.
       - High Crawl + Zero Clicks -> Flag as CRAWL_WASTE.
    
    2. **Quantified Impact**:
       - Don't just say "traffic dropped". Calculate the loss: "Estimated loss of 450 clicks/mo".
       - Use "Confidence" levels (High/Medium/Low) based on data density.
    
    3. **Aesthetic**:
       - Output in a "Bloomberg Terminal" style: Concise, Data-Dense, Bulleted.
       - Use CAPS for metric names (e.g. CLICKS, CTR).
    
    4. **Tool Usage**:
       - If user asks about specific URL, check Analytics filtered by URL.
       - If user asks for "Health Check", check Velocity AND Analytics.

    Current Context:
    URL: ${context.url}
    Total Clicks: ${context.totalClicks}
  `;

  try {
    const result = await generateText({
      model: MODEL,
      system: systemPrompt,
      prompt: userMessage,
      tools: tools,
      maxSteps: 5, // Allowed in SDK v3.1+ 
    });

    return {
      agent: "ANALYST",
      output: result.text,
      steps: result.steps
    };
  } catch (error: any) {
    console.error("Analyst Agent Error:", error);
    return {
      agent: "ANALYST",
      output: `Analysis failed: ${error.message}`
    };
  }
};
