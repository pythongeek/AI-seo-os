# MEMORY LOG

## SERP Analysis Parameters (Research Agent)
When analyzing Search Engine Results Pages (SERP) for "Keyword Gap Detection", the Research Agent tracks:
*   **Content Type Distribution**: (e.g., 60% Blog, 20% Product, 20% Video)
*   **Average Word Count** (estimated)
*   **Dominant User Intent**: (Informational, Transactional, etc.)
*   **Common Headings/Subtopics**: (Frequency of specific H2/H3 tags)
*   **Featured Snippet Presence**: (Is there a position zero? What format?)

## Technical Diagnostic Mapping (Auditor Agent)
Common GSC Error States and their Root Cause probability:

| GSC Status | Coverage State | Probable Root Cause | Recommended Action |
| :--- | :--- | :--- | :--- |
| **Excluded** | `CRAWLED_NOT_INDEXED` | Low Content Quality / Duplicate Content | Audit content depth, check for uniqueness. |
| **Excluded** | `DISCOVERED_NOT_INDEXED` | Crawl Budget / Poor Internal Linking | Improve internal links, increase authority. |
| **Error** | `SOFT_404` | Thin Content / Generic 404 Page | Add substantial content or fix proper 404 status code (server-side). |
| **Error** | `SERVER_ERROR_5XX` | Server Instability / Timeout | Check server logs, timeout settings. |
| **Error** | `REDIRECT_ERROR` | Chains / Loops | Trace redirect path, limit to max 3 hops. |
| **Valid** | `INDEXED` | N/A | Monitor for ranking. |

## Agent Learning Logs
*(Agent successes and failures will be logged here)*

## Planner Agent Logic (Session 3.4)
### Roadmap Prioritization Matrix
| Impact | Effort | Designation | Strategy |
| :--- | :--- | :--- | :--- |
| High | Low | **Quick Win** | Schedule Immediately (Month 1, Week 1) |
| High | High | **Strategic Bet** | Break down, Schedule in Month 2-3 |
| Low | Low | **Maintenance** | Fill gaps in schedule |
| Low | High | **Ignore** | Deprioritize |

### Success Metrics (Achievable Planning)
1.  **Utilization Rate**: Scheduled hours / Available User Hours (Target: < 90%)
2.  **Dependency Respect**: 0 instances of Content scheduled before Technical Fixes.
3.  **Actionability**: 100% of tasks have an estimated time attached.

## Vector Memory Store (Session 4.1)
### Configuration
*   **Model**: `text-embedding-3-small` (OpenAI)
*   **Dimensions**: 1536
*   **Distance Metric**: Cosine Similarity (`<=>` operator)
*   **Index Type**: HNSW (`hnsw`)

### Hybrid Retrieval Logic
The `semantic_search` function uses a weighted score to balance relevance (Semantic) and freshness (Episodic):
> **Final Score** = `0.8 * Similarity` + `0.2 * Recency`

*   **Similarity**: `1 - cosine_distance`
*   **Recency**: Linear decay over 30 days (`1.0` -> `0.0`).

## Sleep Cycle Engine (Session 4.2)
### Consolidation Logic
*   **Duplicate Threshold**: Cosine Similarity > `0.95`.
*   **Merge Strategy**: Keep Memory with Max `access_count` (or latest). Avg `importance_weight`.

### Skill Promotion Criteria
Episodic Memories are promoted to the **Skill Library** if:
1.  **Success Score** > `0.7`
2.  **Usage Count** >= `3` (Frequency of similar actions)

### Garbage Collection
Memories are deleted if:
1.  **Decayed Weight** (Importance) < `0.3` (proxy)
2.  **Access Count** < `2`
3.  **Age** > 30 Days
*Exemption*: `importance_weight` == `1.0` (Brand Rules).

