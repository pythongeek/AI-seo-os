import { differenceInDays } from "date-fns";

/**
 * SEO Priority Score (SPS) Configuration
 */
const WEIGHTS = {
    TRAFFIC: 0.35,
    CONVERSION: 0.25, // Using CTR as proxy
    CRAWL_EFFICIENCY: 0.20,
    INTERNAL_LINKS: 0.15,
    FRESHNESS: 0.05
};

// Normalization Baselines (Can be dynamic in future, static for MVP)
const BASELINES = {
    MAX_LOG_CLICKS: Math.log10(10000), // Expecting 10k clicks/mo as highly significant
    MAX_CTR: 0.25, // 25% CTR is very high
    MAX_CRAWL_FREQ: 30, // Crawled daily = max
    MAX_LINKS: Math.log10(100), // 100 internal links is high
    MAX_FRESHNESS_DAYS: 30 // Older than 30 days = 0 score
};

/**
 * Calculate SEO Priority Score (0.0 - 1.0)
 */
export function calculatePriorityScore(metrics: {
    clicks: number;
    ctr: number;
    crawlFrequency: number;
    internalLinks: number;
    lastCrawled?: Date | null;
}) {
    // 1. Traffic Score (Logarithmic to handle power laws)
    // Avoid log(0)
    const logClicks = metrics.clicks > 0 ? Math.log10(metrics.clicks) : 0;
    const trafficScore = Math.min(logClicks / BASELINES.MAX_LOG_CLICKS, 1.0);

    // 2. Conversion/CTR Score (Linear)
    const conversionScore = Math.min(metrics.ctr / BASELINES.MAX_CTR, 1.0);

    // 3. Crawl Efficiency Score (Linear)
    const crawlScore = Math.min(metrics.crawlFrequency / BASELINES.MAX_CRAWL_FREQ, 1.0);

    // 4. Internal Links Score (Logarithmic)
    const logLinks = metrics.internalLinks > 0 ? Math.log10(metrics.internalLinks) : 0;
    const linkScore = Math.min(logLinks / BASELINES.MAX_LINKS, 1.0);

    // 5. Freshness Score (Decay)
    let freshnessScore = 0;
    if (metrics.lastCrawled) {
        const daysSinceCrawl = differenceInDays(new Date(), metrics.lastCrawled);
        if (daysSinceCrawl < BASELINES.MAX_FRESHNESS_DAYS) {
            freshnessScore = 1.0 - (daysSinceCrawl / BASELINES.MAX_FRESHNESS_DAYS);
        }
    }

    // Weighted Sum
    const distinctScore =
        (trafficScore * WEIGHTS.TRAFFIC) +
        (conversionScore * WEIGHTS.CONVERSION) +
        (crawlScore * WEIGHTS.CRAWL_EFFICIENCY) +
        (linkScore * WEIGHTS.INTERNAL_LINKS) +
        (freshnessScore * WEIGHTS.FRESHNESS);

    return Number(distinctScore.toFixed(3)); // Precision 3
}
