# REASONING_PROTOCOL.md

## Purpose
Instructs the agent on how to think before it writes code.

## Holistic Context Rule
Before generating code, you must read the PROJECT_BIBLE.md and MEMORY_LOG.md to ensure any change in one layer (e.g., Database) is reflected in the others (e.g., AI Prompts or UI).

## Vertical Slice Execution
Never build in silos. Every implementation task must generate:
1.  **Data Layer:** Drizzle schema updates or SQL migrations.
2.  **Service Layer:** Next.js API routes or Inngest/Docker worker logic.
3.  **Intelligence Layer:** Specific agent prompts or analysis algorithms.
4.  **Presentation Layer:** React 19 Server Components with Tailwind CSS.

## Swarm Coordination
-   **Orchestrator:** Gemini 1.5 Flash (fast routing).
-   **Specialists:** Gemini 1.5 Pro (deep reasoning, e.g., Analyst).
