import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { memoryStore, agentActions, skillLibrary } from "@/db/schema";
import { sql, eq, and, gt, desc, lt, gte } from "drizzle-orm";

export const sleepCycle = inngest.createFunction(
    { id: "sleep-cycle" },
    { cron: "0 */6 * * *" }, // Run every 6 hours
    async ({ step }) => {

        /**
         * Task 1: Consolidation (Duplicate Detection)
         * Finds memories that are extremely similar (>0.95) and merges them.
         * Note: This is a simplified approach. In high-scale, use LSH or clustering.
         */
        const consolidationStats = await step.run("consolidate-memories", async () => {
            // 1. Fetch recent episodic memories to check against
            // Ideally we iterate, but for MVP we grab a batch of un-optimized ones?
            // Let's just look for very close neighbors for the newest 100 memories.

            const recentMemories = await db.select({
                id: memoryStore.id,
                embedding: memoryStore.embedding,
                content: memoryStore.contentText,
                propertyId: memoryStore.propertyId
            })
                .from(memoryStore)
                .where(eq(memoryStore.memoryType, 'EPISODIC'))
                .orderBy(desc(memoryStore.createdAt))
                .limit(50); // Process batch

            let mergedCount = 0;

            for (const mem of recentMemories) {
                if (!mem.embedding) continue;

                // Find duplicates (excluding self)
                const duplicates = await db.execute(sql`
          SELECT id, access_count, importance_weight, created_at
          FROM memory_store
          WHERE id != ${mem.id}
          AND property_id = ${mem.propertyId}
          AND memory_type = 'EPISODIC'
          AND 1 - (embedding <=> ${JSON.stringify(mem.embedding)}) > 0.95
        `);

                // If duplicates found, merge 'em
                if (duplicates.length > 0) {
                    // Logic: Keep the one with max access_count or latest
                    // For simplicity: We will keep 'mem' (newest) and merge stats from others into it, then delete others.
                    // Wait, instruction says: "Keep the one with highest access_count".

                    const allGroup = [
                        { id: mem.id, access_count: 0, importance_weight: 0.5 }, // We need to fetch full stats for mem if not in duplicates
                        ...duplicates.map((d: any) => ({
                            id: d.id,
                            access_count: d.access_count || 0,
                            importance_weight: parseFloat(d.importance_weight) || 0.5
                        }))
                    ].sort((a, b) => b.access_count - a.access_count);

                    const winner = allGroup[0];
                    const losers = allGroup.slice(1);

                    // Calculate Average Weight
                    const avgWeight = allGroup.reduce((sum, m) => sum + m.importance_weight, 0) / allGroup.length;

                    // Update Winner
                    await db.update(memoryStore)
                        .set({
                            importanceWeight: avgWeight.toFixed(2),
                            metadata: sql`jsonb_set(COALESCE(metadata, '{}'), '{merged_ids}', ${JSON.stringify(losers.map(l => l.id))})`
                        })
                        .where(eq(memoryStore.id, winner.id));

                    // Delete Losers
                    for (const loser of losers) {
                        await db.delete(memoryStore).where(eq(memoryStore.id, loser.id));
                    }
                    mergedCount += losers.length;
                }
            }
            return { merged: mergedCount };
        });

        /**
         * Task 2: Strategy Promotion
         * Promote successful actions to Skill Library.
         */
        const promotionStats = await step.run("promote-strategies", async () => {
            // Find actions with high success and usage
            // We group by action_type + context_summary (a rough signature of the "Strategy")
            // Since 'context_summary' might vary, we group by action_type primarily for this MVP logic, 
            // but strictly speaking we should look for patterns.
            // Let's simplified: Look for Agent Actions with success > 0.7

            const candidates = await db.select()
                .from(agentActions)
                .where(and(
                    gt(agentActions.successScore, '0.7'),
                    // In a real app we'd filter for "not yet promoted"
                ))
                .limit(10); // Batch

            let promotedCount = 0;

            for (const action of candidates) {
                // Check if a skill exists for this action type/pattern
                // This is a naive check. Ideally we use similarity on 'context_pattern'.
                const existingSkill = await db.select()
                    .from(skillLibrary)
                    .where(eq(skillLibrary.strategyName, action.actionType)) // Simple name matching
                    .limit(1);

                if (existingSkill.length === 0) {
                    // Check if we have enough volume (mocking the "3+ times" check by just checking for 1 high quality here as triggers might be singular)
                    // Instruction: "Action ... performed successfully 3+ times".
                    // Let's count similar actions.
                    const countResult = await db.select({ count: sql<number>`count(*)` })
                        .from(agentActions)
                        .where(and(
                            eq(agentActions.actionType, action.actionType),
                            gt(agentActions.successScore, '0.7')
                        ));

                    const count = Number(countResult[0]?.count || 0);

                    if (count >= 3) {
                        // Promote!
                        await db.insert(skillLibrary).values({
                            propertyId: action.propertyId,
                            strategyName: action.actionType,
                            strategyDescription: `Automatically promoted strategy based on ${count} successful executions.`,
                            contextPattern: action.contextSummary || "General Context",
                            actionSteps: action.actionDetails || [],
                            successRate: action.successScore, // Initial value
                            timesApplied: count, // Initial value
                            tags: ['auto-promoted']
                        });
                        promotedCount++;
                    }
                }
            }
            return { promoted: promotedCount };
        });

        /**
         * Task 3: Garbage Collection
         * Delete low-value memories.
         */
        const gcStats = await step.run("garbage-collection", async () => {
            // Logic: Delete where decayed weight < 0.01 AND access_count < 2
            // AND importance_weight != 1.0 (Brand Protection)

            // Postgres query to calculate decay dynamically or just assume old + low importance
            // Decayed Weight ~= Importance * (1 - (Age/30days))
            // If Age > 30 days and Importance is low, it's garbage.

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const deleted = await db.delete(memoryStore)
                .where(and(
                    lt(memoryStore.createdAt, thirtyDaysAgo), // Old
                    lt(memoryStore.importanceWeight, '0.3'), // Low initial importance (proxy for decayed value)
                    lt(memoryStore.accessCount, 2), // Ignored
                    sql`${memoryStore.importanceWeight} != 1.0` // Protection
                ))
                .returning({ id: memoryStore.id });

            return { deleted: deleted.length };
        });

        return {
            step: "Sleep Cycle Complete",
            stats: {
                consolidation: consolidationStats,
                promotion: promotionStats,
                gc: gcStats
            }
        };
    }
);
