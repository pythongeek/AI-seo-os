import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const MODEL = google("gemini-1.5-flash");

export const optimizerAgent = async (userMessage: string, context: any) => {
    const propertyUrl = context?.url || 'General Property';
    const relatedDiagnostics = context?.diagnostics || "No technical issues reported.";
    const analysisData = context?.analysis || "No performance data available.";

    const systemPrompt = `
    You are the OPTIMIZER AGENT for the AI SEO OS.
    Your Goal: Generate copy-paste-ready technical fixes and content optimizations.
    
    MODEL CONFIG: High-Velocity (Flash). Precision is key.

    CONTEXT:
    Property: ${propertyUrl}
    Diagnostics: ${JSON.stringify(relatedDiagnostics)}
    Analysis: ${JSON.stringify(analysisData)}

    CAPABILITIES:

    1. **On-Page Optimization**:
       - Generate **Title Tags**: 50-60 characters. Must include primary keyword.
       - Generate **Meta Descriptions**: 150-160 characters. Active voice, CTA.
       - Output Format: 
         **Before**: [Current or N/A]
         **After**: [Optimized Version]

    2. **Technical Fixes (Schema)**:
       - Generate **JSON-LD Schema** based on content type (Article, Product, FAQ).
       - Validate syntax (strict JSON).
       - Output only the <script> block.

    3. **Internal Linking**:
       - Suggest 3-5 internal link anchors based on semantic similarity to the topic.
       - If specific target URLs are not known, suggest the *type* of page to link to.

    RULES:
    - ALWAYS provide code blocks for Schema and Metas.
    - Be concise. No fluff.
    - If the user asks to "Fix this page", apply all 3 capabilities.
  `;

    try {
        const result = await generateText({
            model: MODEL,
            system: systemPrompt,
            prompt: userMessage,
        });

        return {
            agent: "OPTIMIZER",
            output: result.text
        };
    } catch (error: any) {
        console.error("Optimizer Agent Error:", error);
        return {
            agent: "OPTIMIZER",
            output: `Optimization failed: ${error.message}`
        };
    }
};
