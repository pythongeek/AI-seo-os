/**
 * AI SEO Operating System - Analyst Agent
 * 
 * Specializes in performance interpretation and anomaly detection:
 * - CTR anomaly detection
 * - Ranking velocity tracking
 * - Striking distance identification
 * - Crawl budget waste detection
 */

import { google } from '@ai-sdk/google';
import { streamText, generateObject } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Configuration
const ANALYST_CONFIG = {
  model: 'gemini-1.5-pro',
  temperature: 0.2,
  maxTokens: 4000
};

// CTR Anomaly Detection
interface CTRAnomaly {
  query: string;
  page: string;
  currentCTR: number;
  baselineCTR: number;
  deviation: number;
  classification: 'TITLE_META_ISSUE' | 'RANK_RELEVANCE_ISSUE' | 'SERP_FEATURE_OPPORTUNITY' | 'NORMAL_VARIATION';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: number; // estimated lost clicks per month
}

// Ranking Velocity
interface VelocityResult {
  query: string;
  page: string;
  currentPosition: number;
  velocity7d: number;
  velocity30d: number;
  trend: 'RAPID_DECLINE' | 'GRADUAL_DECLINE' | 'STABLE' | 'GRADUAL_IMPROVEMENT' | 'MOMENTUM_BUILD';
  alert: boolean;
}

// Striking Distance Opportunity
interface StrikingOpportunity {
  query: string;
  page: string;
  currentPosition: number;
  currentCTR: number;
  expectedCTR: number;
  trafficPotential: number;
  difficulty: 'LOW' | 'MEDIUM' | 'HIGH';
  priorityScore: number;
  recommendation: string;
}

// Crawl Budget Waste
interface CrawlWasteIssue {
  url: string;
  crawlFrequency: number;
  clicks90d: number;
  priorityScore: number;
  classification: 'FACETED_URL' | 'PAGINATION' | 'FILTER_PAGE' | 'OLD_ARCHIVE' | 'AUTHOR_PAGE' | 'OTHER_LOW_VALUE';
  estimatedCrawlBudgetPct: number;
  recommendation: string;
}

/**
 * Main Analyst Agent
 */
export const analystAgent = {
  /**
   * Analyze user query and return findings
   */
  async analyze(
    userQuery: string,
    context: { propertyId?: string; dateRange?: { start: Date; end: Date } },
    previousResults?: any[]
  ): Promise<any> {
    const propertyId = context.propertyId;
    if (!propertyId) {
      throw new Error('Property ID required for analysis');
    }

    // Determine analysis type based on query
    const analysisType = this.classifyAnalysisType(userQuery);

    // Fetch relevant data
    const data = await this.fetchAnalysisData(propertyId, analysisType, context.dateRange);

    // Run appropriate analysis
    switch (analysisType) {
      case 'TRAFFIC_DECLINE':
        return this.analyzeTrafficDecline(userQuery, data, propertyId);
      case 'CTR_ANOMALY':
        return this.analyzeCTRAnomalies(data, propertyId);
      case 'RANKING_VELOCITY':
        return this.analyzeRankingVelocity(data, propertyId);
      case 'STRIKING_DISTANCE':
        return this.findStrikingDistance(data, propertyId);
      case 'CRAWL_WASTE':
        return this.detectCrawlWaste(data, propertyId);
      default:
        return this.generalAnalysis(userQuery, data, propertyId);
    }
  },

  /**
   * Classify the type of analysis needed
   */
  classifyAnalysisType(query: string): string {
    const lower = query.toLowerCase();

    if (lower.includes('traffic drop') || lower.includes('traffic decline')) {
      return 'TRAFFIC_DECLINE';
    }
    if (lower.includes('ctr') || lower.includes('click through')) {
      return 'CTR_ANOMALY';
    }
    if (lower.includes('ranking') && (lower.includes('velocity') || lower.includes('change'))) {
      return 'RANKING_VELOCITY';
    }
    if (lower.includes('striking distance') || lower.includes('page 2')) {
      return 'STRIKING_DISTANCE';
    }
    if (lower.includes('crawl') && (lower.includes('waste') || lower.includes('budget'))) {
      return 'CRAWL_WASTE';
    }

    return 'GENERAL';
  },

  /**
   * Fetch data for analysis
   */
  async fetchAnalysisData(
    propertyId: string,
    analysisType: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    const endDate = dateRange?.end || new Date();
    const startDate = dateRange?.start || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch search analytics
    const analytics = await db.execute(sql`
      SELECT 
        query,
        page,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        AVG(ctr) as ctr,
        AVG(position) as position
      FROM search_analytics
      WHERE property_id = ${propertyId}
        AND date BETWEEN ${startDate.toISOString().split('T')[0]} 
                     AND ${endDate.toISOString().split('T')[0]}
      GROUP BY query, page
      ORDER BY clicks DESC
    `);

    // Fetch URL metrics
    const urlMetrics = await db.execute(sql`
      SELECT * FROM url_metrics
      WHERE property_id = ${propertyId}
      ORDER BY seo_priority_score DESC
    `);

    // Fetch crawl stats
    const crawlStats = await db.execute(sql`
      SELECT * FROM crawl_stats
      WHERE property_id = ${propertyId}
        AND date BETWEEN ${startDate.toISOString().split('T')[0]} 
                     AND ${endDate.toISOString().split('T')[0]}
      ORDER BY date DESC
    `);

    return {
      analytics: analytics as any[],
      urlMetrics: urlMetrics as any[],
      crawlStats: crawlStats as any[],
      dateRange: { start: startDate, end: endDate }
    };
  },

  /**
   * Analyze traffic decline
   */
  async analyzeTrafficDecline(
    userQuery: string,
    data: any,
    propertyId: string
  ): Promise<any> {
    const model = google(ANALYST_CONFIG.model);

    // Compare current period vs previous period
    const currentPeriod = data.analytics;

    const prompt = `You are the ANALYST agent analyzing a traffic decline.

Current Period Data (Last 30 days):
${JSON.stringify(currentPeriod.slice(0, 20), null, 2)}

User Question: "${userQuery}"

Your Task:
1. Identify pages with significant traffic declines
2. Analyze root causes (ranking drop vs CTR drop vs impression drop)
3. Quantify the impact (lost clicks/revenue)
4. Recommend next steps

Output format:
## Traffic Decline Analysis

### Summary
[Overall picture]

### Top Declining Pages
1. [Page] - [Decline details]

### Root Causes
- [Cause 1]: [Explanation]

### Impact
- Estimated lost clicks: [X]

### Recommended Next Steps
- [Which agent to invoke next]`;

    const result = await streamText({
      model,
      system: 'You are an expert SEO analyst. Be precise with data and provide actionable insights.',
      prompt,
      temperature: ANALYST_CONFIG.temperature,
      maxTokens: ANALYST_CONFIG.maxTokens
    });

    return {
      type: 'TRAFFIC_DECLINE_ANALYSIS',
      stream: result,
      data: { decliningPages: currentPeriod.slice(0, 10) }
    };
  },

  /**
   * Detect CTR anomalies
   */
  async analyzeCTRAnomalies(data: any, propertyId: string): Promise<{
    anomalies: CTRAnomaly[];
    summary: string;
  }> {
    const anomalies: CTRAnomaly[] = [];
    const baselineWindow = 30;
    const deviationThreshold = 0.20;

    for (const row of data.analytics) {
      // Skip if insufficient data
      if (row.impressions < 100) continue;

      // Calculate expected CTR based on position
      const expectedCTR = this.getExpectedCTR(row.position);
      const currentCTR = row.ctr;

      // Calculate deviation
      const deviation = (currentCTR - expectedCTR) / expectedCTR;

      // Check if significant anomaly
      if (Math.abs(deviation) > deviationThreshold) {
        const classification = this.classifyCTRAnomaly(deviation, row.position, currentCTR);

        anomalies.push({
          query: row.query,
          page: row.page,
          currentCTR: Math.round(currentCTR * 10000) / 10000,
          baselineCTR: Math.round(expectedCTR * 10000) / 10000,
          deviation: Math.round(deviation * 100) / 100,
          classification,
          severity: Math.abs(deviation) > 0.50 ? 'HIGH' : Math.abs(deviation) > 0.30 ? 'MEDIUM' : 'LOW',
          impact: Math.round(row.impressions * Math.abs(deviation) * expectedCTR)
        });
      }
    }

    // Sort by impact
    anomalies.sort((a, b) => b.impact - a.impact);

    return {
      anomalies: anomalies.slice(0, 20),
      summary: `Found ${anomalies.length} CTR anomalies with total impact of ${anomalies.reduce((sum, a) => sum + a.impact, 0)} potential clicks/month`
    };
  },

  /**
   * Get expected CTR for a position
   */
  getExpectedCTR(position: number): number {
    // Industry average CTR by position
    const ctrByPosition: Record<number, number> = {
      1: 0.317, 2: 0.246, 3: 0.185, 4: 0.134, 5: 0.095,
      6: 0.068, 7: 0.048, 8: 0.035, 9: 0.026, 10: 0.021,
      11: 0.015, 12: 0.012, 13: 0.010, 14: 0.009, 15: 0.008,
      16: 0.007, 17: 0.006, 18: 0.005, 19: 0.005, 20: 0.004
    };

    const roundedPos = Math.round(position);
    return ctrByPosition[roundedPos] || 0.003;
  },

  /**
   * Classify CTR anomaly type
   */
  classifyCTRAnomaly(
    deviation: number,
    position: number,
    currentCTR: number
  ): CTRAnomaly['classification'] {
    if (deviation < -0.20) {
      if (position < 5 && currentCTR < 0.03) {
        return 'TITLE_META_ISSUE';
      }
      return 'RANK_RELEVANCE_ISSUE';
    }
    if (deviation > 0.20) {
      return 'SERP_FEATURE_OPPORTUNITY';
    }
    return 'NORMAL_VARIATION';
  },

  /**
   * Analyze ranking velocity
   */
  async analyzeRankingVelocity(data: any, propertyId: string): Promise<{
    velocities: VelocityResult[];
    alerts: VelocityResult[];
  }> {
    // Fetch ranking history
    const history = await db.execute(sql`
      SELECT 
        query,
        page,
        date,
        position
      FROM ranking_history
      WHERE property_id = ${propertyId}
        AND date >= CURRENT_DATE - INTERVAL '60 days'
      ORDER BY query, page, date DESC
    `);

    const velocities: VelocityResult[] = [];
    const grouped = this.groupByQueryPage(history.rows);

    for (const [key, rows] of Object.entries(grouped)) {
      if (rows.length < 8) continue; // Need enough data

      const [query, page] = key.split('|');
      const sorted = rows.sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const current = sorted[0].position;
      const pos7d = this.getPositionAt(sorted, 7);
      const pos30d = this.getPositionAt(sorted, 30);

      const velocity7d = pos7d ? (current - pos7d) / 7 : 0;
      const velocity30d = pos30d ? (current - pos30d) / 30 : 0;

      let trend: VelocityResult['trend'] = 'STABLE';
      if (velocity7d < -0.5) trend = 'RAPID_DECLINE';
      else if (velocity7d > 0.3) trend = 'MOMENTUM_BUILD';
      else if (velocity7d < -0.1) trend = 'GRADUAL_DECLINE';
      else if (velocity7d > 0.1) trend = 'GRADUAL_IMPROVEMENT';

      velocities.push({
        query,
        page,
        currentPosition: Math.round(current * 10) / 10,
        velocity7d: Math.round(velocity7d * 100) / 100,
        velocity30d: Math.round(velocity30d * 100) / 100,
        trend,
        alert: trend === 'RAPID_DECLINE' || trend === 'MOMENTUM_BUILD'
      });
    }

    // Sort by absolute velocity
    velocities.sort((a, b) => Math.abs(b.velocity7d) - Math.abs(a.velocity7d));

    return {
      velocities: velocities.slice(0, 50),
      alerts: velocities.filter(v => v.alert)
    };
  },

  /**
   * Group ranking history by query+page
   */
  groupByQueryPage(rows: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const row of rows) {
      const key = `${row.query}|${row.page}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }

    return grouped;
  },

  /**
   * Get position at N days ago
   */
  getPositionAt(sortedRows: any[], daysAgo: number): number | null {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);

    const row = sortedRows.find((r: any) =>
      new Date(r.date).getTime() <= targetDate.getTime()
    );

    return row?.position || null;
  },

  /**
   * Find striking distance opportunities
   */
  async findStrikingDistance(data: any, propertyId: string): Promise<{
    opportunities: StrikingOpportunity[];
    totalPotential: number;
  }> {
    const opportunities: StrikingOpportunity[] = [];

    for (const row of data.analytics) {
      // Filter by position range (7-20)
      if (row.position < 7 || row.position > 20) continue;

      // Filter by impression volume
      if (row.impressions < 100) continue;

      const currentCTR = row.ctr;
      const expectedCTRPos5 = this.getExpectedCTR(5);

      // Calculate traffic potential
      const trafficPotential = Math.round(
        row.impressions * (expectedCTRPos5 - currentCTR)
      );

      // Calculate difficulty
      const difficulty = this.calculateDifficulty(row.position, row.query);

      // Calculate priority score
      const priorityScore = trafficPotential / (difficulty === 'LOW' ? 1 : difficulty === 'MEDIUM' ? 2 : 3);

      opportunities.push({
        query: row.query,
        page: row.page,
        currentPosition: Math.round(row.position * 10) / 10,
        currentCTR: Math.round(currentCTR * 10000) / 10000,
        expectedCTR: Math.round(expectedCTRPos5 * 10000) / 10000,
        trafficPotential,
        difficulty,
        priorityScore: Math.round(priorityScore),
        recommendation: this.generateStrikingRecommendation(row, difficulty)
      });
    }

    // Sort by priority score
    opportunities.sort((a, b) => b.priorityScore - a.priorityScore);

    return {
      opportunities: opportunities.slice(0, 30),
      totalPotential: opportunities.reduce((sum, o) => sum + o.trafficPotential, 0)
    };
  },

  /**
   * Calculate optimization difficulty
   */
  calculateDifficulty(position: number, query: string): StrikingOpportunity['difficulty'] {
    // Position-based difficulty
    if (position <= 10) return 'LOW';
    if (position <= 15) return 'MEDIUM';

    // Query complexity
    const words = query.split(' ').length;
    if (words > 6) return 'HIGH';

    return 'MEDIUM';
  },

  /**
   * Generate recommendation for striking distance keyword
   */
  generateStrikingRecommendation(row: any, difficulty: string): string {
    const recommendations: Record<string, string> = {
      LOW: 'Optimize title and meta description to improve CTR',
      MEDIUM: 'Improve content depth and add internal links',
      HIGH: 'Comprehensive content overhaul + backlink acquisition'
    };

    return recommendations[difficulty];
  },

  /**
   * Detect crawl budget waste
   */
  async detectCrawlWaste(data: any, propertyId: string): Promise<{
    issues: CrawlWasteIssue[];
    totalWastePct: number;
    recommendations: string[];
  }> {
    const issues: CrawlWasteIssue[] = [];
    const minCrawlFrequency = 2; // crawled more than twice per day

    for (const url of data.urlMetrics) {
      // High crawl frequency but no traffic
      if (url.crawl_frequency > minCrawlFrequency &&
        url.clicks_90d === 0 &&
        url.seo_priority_score < 0.3) {

        const classification = this.classifyWasteURL(url.url);

        issues.push({
          url: url.url,
          crawlFrequency: url.crawl_frequency,
          clicks90d: url.clicks_90d,
          priorityScore: url.seo_priority_score,
          classification,
          estimatedCrawlBudgetPct: Math.round((url.crawl_frequency / 100) * 1000) / 10,
          recommendation: this.generateCrawlRecommendation(classification)
        });
      }
    }

    // Sort by crawl frequency
    issues.sort((a, b) => b.crawlFrequency - a.crawlFrequency);

    // Calculate total waste percentage
    const totalWastePct = issues.reduce((sum, i) => sum + i.estimatedCrawlBudgetPct, 0);

    // Generate recommendations
    const recommendations = this.generateCrawlBudgetRecommendations(issues);

    return {
      issues: issues.slice(0, 50),
      totalWastePct: Math.round(totalWastePct * 10) / 10,
      recommendations
    };
  },

  /**
   * Classify waste URL type
   */
  classifyWasteURL(url: string): CrawlWasteIssue['classification'] {
    if (url.match(/\?.*=.*&/)) return 'FACETED_URL';
    if (url.match(/\/page\/\d+/)) return 'PAGINATION';
    if (url.match(/\/tag\/|\/category\/.*\/page/)) return 'FILTER_PAGE';
    if (url.match(/\/\d{4}\/\d{2}/) && this.isOldDate(url)) return 'OLD_ARCHIVE';
    if (url.match(/\/author\/|\/user\//)) return 'AUTHOR_PAGE';
    return 'OTHER_LOW_VALUE';
  },

  /**
   * Check if URL contains old date
   */
  isOldDate(url: string): boolean {
    const match = url.match(/\/(\d{4})\/(\d{2})/);
    if (!match) return false;

    const year = parseInt(match[1]);
    const currentYear = new Date().getFullYear();

    return currentYear - year > 2;
  },

  /**
   * Generate crawl recommendation
   */
  generateCrawlRecommendation(classification: CrawlWasteIssue['classification']): string {
    const recommendations: Record<string, string> = {
      FACETED_URL: 'Add noindex or canonical tags to faceted URLs',
      PAGINATION: 'Consolidate pagination or add rel="nofollow"',
      FILTER_PAGE: 'Block filter parameters in robots.txt',
      OLD_ARCHIVE: 'Add noindex to old archive pages',
      AUTHOR_PAGE: 'Consider noindex for low-value author pages',
      OTHER_LOW_VALUE: 'Review and potentially noindex or block'
    };

    return recommendations[classification];
  },

  /**
   * Generate crawl budget recommendations
   */
  generateCrawlBudgetRecommendations(issues: CrawlWasteIssue[]): string[] {
    const byClassification = issues.reduce((acc, issue) => {
      acc[issue.classification] = (acc[issue.classification] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recommendations: string[] = [];

    if (byClassification.FACETED_URL > 10) {
      recommendations.push(`Add Disallow rule for faceted URLs (${byClassification.FACETED_URL} URLs affected)`);
    }
    if (byClassification.PAGINATION > 10) {
      recommendations.push(`Optimize pagination or add noindex beyond page 5`);
    }
    if (byClassification.OLD_ARCHIVE > 20) {
      recommendations.push(`Add noindex to archive pages older than 2 years`);
    }

    return recommendations;
  },

  /**
   * General analysis for unspecified queries
   */
  async generalAnalysis(userQuery: string, data: any, propertyId: string): Promise<any> {
    const model = google(ANALYST_CONFIG.model);

    const prompt = `You are the ANALYST agent providing a general SEO analysis.

Data Summary:
- Total queries analyzed: ${data.analytics.length}
- Total URLs: ${data.urlMetrics.length}
- Date range: ${data.dateRange.start.toDateString()} to ${data.dateRange.end.toDateString()}

Top Performing Queries:
${JSON.stringify(data.analytics.slice(0, 10), null, 2)}

User Question: "${userQuery}"

Provide a comprehensive analysis with specific insights and recommendations.`;

    const result = await streamText({
      model,
      system: 'You are an expert SEO analyst. Provide data-driven insights.',
      prompt,
      temperature: ANALYST_CONFIG.temperature,
      maxTokens: ANALYST_CONFIG.maxTokens
    });

    return {
      type: 'GENERAL_ANALYSIS',
      stream: result
    };
  }
};
