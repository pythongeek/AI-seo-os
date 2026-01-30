# AI SEO Operating System - Multi-Agent Swarm Documentation

## Agent Swarm Architecture

The AI SEO OS uses a sophisticated multi-agent system inspired by swarm intelligence. Each agent specializes in a specific domain and collaborates to solve complex SEO problems.

## Agent Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT SWARM LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ORCHESTRATOR AGENT                              │   │
│  │  (Gemini 1.5 Flash - Intent Classification & Routing)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐              │
│         │                          │                          │              │
│         ▼                          ▼                          ▼              │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐        │
│  │  ANALYST    │           │  RESEARCH   │           │  TECH AUD   │        │
│  │  (Pro)      │           │  (Pro)      │           │  (Pro)      │        │
│  └─────────────┘           └─────────────┘           └─────────────┘        │
│         │                          │                          │              │
│         └──────────────────────────┼──────────────────────────┘              │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐        │
│  │  OPTIMIZER  │◄─────────│  PLANNER    │◄─────────│  MEMORY     │        │
│  │  (Flash)    │           │  (Pro)      │           │  (Embed)    │        │
│  └─────────────┘           └─────────────┘           └─────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Agent Specifications

### 1. Orchestrator Agent

**Purpose:** Intent classification and agent routing

**Model:** Gemini 1.5 Flash (fast, low-latency)

**Configuration:**
```typescript
const orchestratorConfig = {
  model: 'gemini-1.5-flash',
  temperature: 0.1,  // Low creativity for consistent routing
  maxTokens: 500,
  systemPrompt: `You are the Agent Orchestrator for an AI SEO Operating System.

Your task is to analyze user queries and route them to the appropriate specialist agent(s).

Available Agents:
1. ANALYST - Performance interpretation, anomaly detection, trend analysis
2. RESEARCH - Content gap analysis, keyword clustering, SERP research
3. TECHNICAL_AUDITOR - Crawl issues, indexing problems, technical diagnostics
4. OPTIMIZER - On-page SEO improvements, title/meta optimization
5. PLANNER - Strategic roadmaps, action plans, milestone creation

Routing Rules:
- "Why did traffic drop?" → ANALYST
- "Find keyword gaps" → RESEARCH
- "Fix indexing issue" → TECHNICAL_AUDITOR
- "Optimize this page" → OPTIMIZER
- "Create SEO roadmap" → PLANNER
- Complex queries may need multiple agents

Output Format (JSON):
{
  "primary_agent": "ANALYST",
  "secondary_agents": ["TECHNICAL_AUDITOR"],
  "execution_mode": "sequential",  // or "parallel"
  "reasoning": "Brief explanation of routing decision",
  "estimated_tokens": 2000
}`
};
```

**Example Input/Output:**
```
Input: "Why did my homepage drop in rankings and how do I fix it?"

Output: {
  "primary_agent": "ANALYST",
  "secondary_agents": ["TECHNICAL_AUDITOR", "OPTIMIZER"],
  "execution_mode": "sequential",
  "reasoning": "User asks about ranking drop (ANALYST), wants fix (TECHNICAL_AUDITOR for diagnosis, OPTIMIZER for solution)",
  "estimated_tokens": 3500
}
```

---

### 2. Analyst Agent

**Purpose:** Performance interpretation and anomaly detection

**Model:** Gemini 1.5 Pro (complex reasoning)

**Capabilities:**

#### 2.1 CTR Anomaly Detection
```typescript
interface CTRAnomalyConfig {
  baselineWindow: 30,  // days
  deviationThreshold: 0.20,  // 20%
  statisticalSignificance: 0.05,  // p-value
}

// Algorithm
function detectCTRAnomalies(data: SearchAnalytics[]): CTRAnomaly[] {
  const anomalies: CTRAnomaly[] = [];
  
  for (const row of data) {
    // Calculate 30-day baseline
    const baseline = calculateBaselineCTR(row.query, row.page, 30);
    
    // Compare current CTR to baseline
    const deviation = (row.ctr - baseline) / baseline;
    
    // Statistical significance test (t-test)
    const pValue = calculateTTest(row.ctr, baseline);
    
    if (Math.abs(deviation) > 0.20 && pValue < 0.05) {
      anomalies.push({
        query: row.query,
        page: row.page,
        currentCTR: row.ctr,
        baselineCTR: baseline,
        deviation,
        classification: classifyCTRAnomaly(deviation, row.position),
        severity: calculateSeverity(deviation)
      });
    }
  }
  
  return anomalies;
}

function classifyCTRAnomaly(deviation: number, position: number): string {
  if (deviation < -0.20) {
    if (position < 5) return 'TITLE_META_ISSUE';  // High rank, low CTR
    return 'RANK_RELEVANCE_ISSUE';  // Low rank causing CTR drop
  }
  if (deviation > 0.20) {
    return 'SERP_FEATURE_OPPORTUNITY';  // CTR spike
  }
  return 'NORMAL_VARIATION';
}
```

#### 2.2 Ranking Velocity Tracking
```typescript
interface VelocityConfig {
  shortTermWindow: 7,   // days
  longTermWindow: 30,   // days
  alertThresholds: {
    rapidDecline: -0.5,  // positions per day
    momentumBuild: 0.3,  // positions per day
  }
}

// Algorithm
function calculateRankingVelocity(
  history: RankingHistory[],
  config: VelocityConfig
): VelocityResult[] {
  const results: VelocityResult[] = [];
  
  for (const item of history) {
    const position7dAgo = getPositionAt(item.query, item.page, -7);
    const position30dAgo = getPositionAt(item.query, item.page, -30);
    
    const velocity7d = (item.position - position7dAgo) / 7;
    const velocity30d = (item.position - position30dAgo) / 30;
    
    let trend: TrendType = 'STABLE';
    if (velocity7d < config.alertThresholds.rapidDecline) {
      trend = 'RAPID_DECLINE';
    } else if (velocity7d > config.alertThresholds.momentumBuild) {
      trend = 'MOMENTUM_BUILD';
    } else if (velocity7d < -0.1) {
      trend = 'GRADUAL_DECLINE';
    } else if (velocity7d > 0.1) {
      trend = 'GRADUAL_IMPROVEMENT';
    }
    
    results.push({
      query: item.query,
      page: item.page,
      currentPosition: item.position,
      velocity7d,
      velocity30d,
      trend,
      alert: trend === 'RAPID_DECLINE' || trend === 'MOMENTUM_BUILD'
    });
  }
  
  return results.sort((a, b) => 
    Math.abs(b.velocity7d) - Math.abs(a.velocity7d)
  );
}
```

#### 2.3 Striking Distance Identification
```typescript
interface StrikingDistanceConfig {
  minPosition: 7,
  maxPosition: 20,
  minImpressions: 100,  // per month
  maxCTRForPosition: {
    7: 0.035,
    10: 0.031,
    15: 0.018,
    20: 0.012
  }
}

// Algorithm
function findStrikingDistanceKeywords(
  data: SearchAnalytics[],
  config: StrikingDistanceConfig
): StrikingOpportunity[] {
  const opportunities: StrikingOpportunity[] = [];
  
  for (const row of data) {
    // Filter by position range
    if (row.position < config.minPosition || 
        row.position > config.maxPosition) continue;
    
    // Filter by impression volume
    if (row.impressions < config.minImpressions) continue;
    
    // Calculate expected CTR at position 5
    const expectedCTR = interpolateCTR(5, config.maxCTRForPosition);
    const currentCTR = row.ctr;
    
    // Calculate traffic potential
    const trafficPotential = Math.round(
      row.impressions * (expectedCTR - currentCTR)
    );
    
    // Calculate optimization difficulty
    const difficulty = calculateDifficulty(row.position, row.query);
    
    opportunities.push({
      query: row.query,
      page: row.page,
      currentPosition: row.position,
      currentCTR,
      expectedCTR,
      trafficPotential,
      difficulty,
      priorityScore: trafficPotential / (difficulty + 1),
      recommendation: generateRecommendation(row)
    });
  }
  
  return opportunities
    .filter(o => o.trafficPotential > 50)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
```

#### 2.4 Crawl Budget Waste Detection
```typescript
interface CrawlWasteConfig {
  minCrawlFrequency: 2,  // per day
  maxClicks90d: 0,
  maxPriorityScore: 0.2
}

// Algorithm
function detectCrawlBudgetWaste(
  urls: URLMetrics[],
  crawlStats: CrawlStats[],
  config: CrawlWasteConfig
): CrawlWasteIssue[] {
  const issues: CrawlWasteIssue[] = [];
  
  for (const url of urls) {
    // High crawl frequency but no traffic
    if (url.crawl_frequency > config.minCrawlFrequency &&
        url.clicks_90d <= config.maxClicks90d &&
        url.seo_priority_score < config.maxPriorityScore) {
      
      // Classify the issue
      const classification = classifyURL(url.url);
      
      issues.push({
        url: url.url,
        crawlFrequency: url.crawl_frequency,
        clicks90d: url.clicks_90d,
        priorityScore: url.seo_priority_score,
        classification,
        estimatedCrawlBudgetPct: calculateBudgetImpact(url, crawlStats),
        recommendation: generateCrawlRecommendation(classification)
      });
    }
  }
  
  return issues.sort((a, b) => 
    b.estimatedCrawlBudgetPct - a.estimatedCrawlBudgetPct
  );
}

function classifyURL(url: string): URLClassification {
  if (url.match(/\?.*=.*&/)) return 'FACETED_URL';
  if (url.match(/\/page\/\d+/)) return 'PAGINATION';
  if (url.match(/\/tag\/|\/category\/.*\/page/)) return 'FILTER_PAGE';
  if (url.match(/\/\d{4}\/\d{2}/) && isOldDate(url)) return 'OLD_ARCHIVE';
  if (url.match(/\/author\/|\/user\//)) return 'AUTHOR_PAGE';
  return 'OTHER_LOW_VALUE';
}
```

**Analyst Agent Prompt:**
```typescript
const analystPrompt = `You are the ANALYST agent in an AI SEO Operating System.

Your expertise:
- CTR anomaly detection and root cause analysis
- Ranking velocity tracking and trend prediction
- Striking distance keyword identification
- Crawl budget waste detection

Data provided:
{search_analytics_data}
{ranking_history}
{url_metrics}
{crawl_stats}

User question: "{user_query}"

Your task:
1. Analyze the provided data for anomalies and patterns
2. Identify specific issues with quantified impact
3. Explain WHY each issue is happening (root cause)
4. Recommend which agent should act next

Output format:
## Analysis Summary
[Brief overview of findings]

## Key Findings
1. **[Issue Type]**: [Description]
   - Impact: [Quantified impact, e.g., "-450 clicks/month"]
   - Root Cause: [Explanation]
   - Confidence: [High/Medium/Low]

## Recommended Next Steps
- Primary: [Which agent to invoke next]
- Secondary: [Additional actions]`;
```

---

### 3. Research Agent

**Purpose:** Content gap analysis and keyword research

**Model:** Gemini 1.5 Pro + Google Search Grounding

**Capabilities:**

#### 3.1 Keyword Gap Detection
```typescript
interface KeywordGapConfig {
  minImpressions: 50,
  maxClicks: 3,
  minPosition: 20
}

// Algorithm
function detectKeywordGaps(
  data: SearchAnalytics[],
  config: KeywordGapConfig
): KeywordGap[] {
  const gaps: KeywordGap[] = [];
  
  for (const row of data) {
    // High impressions but low/no clicks
    if (row.impressions >= config.minImpressions &&
        row.clicks <= config.maxClicks &&
        row.position >= config.minPosition) {
      
      // Determine search intent
      const intent = classifyIntent(row.query);
      
      // Group by semantic similarity
      const cluster = findOrCreateCluster(gaps, row.query);
      
      gaps.push({
        query: row.query,
        impressions: row.impressions,
        clicks: row.clicks,
        position: row.position,
        intent,
        clusterId: cluster.id,
        opportunityScore: calculateOpportunityScore(row),
        missingContentType: inferContentType(intent, row.query)
      });
    }
  }
  
  // Cluster and summarize
  return clusterAndSummarize(gaps);
}

function classifyIntent(query: string): SearchIntent {
  const informational = /how|what|why|guide|tutorial|tips/i;
  const transactional = /buy|price|deal|discount|cheap/i;
  const navigational = /brand|website|login|app/i;
  const commercial = /best|top|review|compare|vs/i;
  
  if (informational.test(query)) return 'INFORMATIONAL';
  if (transactional.test(query)) return 'TRANSACTIONAL';
  if (navigational.test(query)) return 'NAVIGATIONAL';
  if (commercial.test(query)) return 'COMMERCIAL_INVESTIGATION';
  return 'UNKNOWN';
}
```

#### 3.2 Intent-Based Clustering
```typescript
interface ClusteringConfig {
  algorithm: 'kmeans' | 'hierarchical' | 'semantic';
  targetClusters: 10;
  minClusterSize: 3;
}

// Algorithm using embeddings
async function clusterQueriesByIntent(
  queries: string[],
  config: ClusteringConfig
): Promise<QueryCluster[]> {
  // Generate embeddings for all queries
  const embeddings = await Promise.all(
    queries.map(q => generateEmbedding(q))
  );
  
  // K-means clustering on embeddings
  const clusters = kmeans(embeddings, config.targetClusters);
  
  // Label each cluster by dominant intent
  const labeledClusters: QueryCluster[] = [];
  
  for (let i = 0; i < clusters.length; i++) {
    const clusterQueries = clusters[i].points.map(p => queries[p.index]);
    const dominantIntent = findDominantIntent(clusterQueries);
    
    labeledClusters.push({
      id: `cluster_${i}`,
      queries: clusterQueries,
      intent: dominantIntent,
      size: clusterQueries.length,
      centroid: clusters[i].centroid,
      suggestedContent: generateContentSuggestion(dominantIntent, clusterQueries)
    });
  }
  
  return labeledClusters.filter(c => c.size >= config.minClusterSize);
}
```

#### 3.3 SERP Pattern Analysis
```typescript
interface SERPAnalysisConfig {
  fetchTopN: 10,
  analyzeElements: ['word_count', 'headers', 'images', 'videos', 'schema', 'faq']
}

// Algorithm (requires external SERP API)
async function analyzeSERPPatterns(
  query: string,
  config: SERPAnalysisConfig
): Promise<SERPAnalysis> {
  // Fetch top results
  const results = await fetchSERPResults(query, config.fetchTopN);
  
  const analysis: SERPAnalysis = {
    query,
    topResults: [],
    patterns: {
      avgWordCount: 0,
      commonHeaders: [],
      avgImages: 0,
      schemaTypes: [],
      hasFAQ: false,
      hasVideo: false
    },
    opportunities: []
  };
  
  // Analyze each result
  for (const result of results) {
    const pageAnalysis = await analyzePage(result.url);
    
    analysis.topResults.push({
      url: result.url,
      title: result.title,
      wordCount: pageAnalysis.wordCount,
      headers: pageAnalysis.headers,
      images: pageAnalysis.images.length,
      schema: pageAnalysis.schema,
      hasFAQ: pageAnalysis.hasFAQ,
      hasVideo: pageAnalysis.hasVideo
    });
  }
  
  // Calculate averages and patterns
  analysis.patterns = calculatePatterns(analysis.topResults);
  
  // Identify gaps vs our content
  analysis.opportunities = identifyContentGaps(analysis);
  
  return analysis;
}
```

**Research Agent Prompt:**
```typescript
const researchPrompt = `You are the RESEARCH agent specializing in content strategy and keyword research.

Your expertise:
- Keyword gap detection (high impressions, low clicks)
- Search intent classification and clustering
- SERP pattern analysis
- Topic hub planning

You have access to:
1. Internal GSC data (queries, pages, performance)
2. Google Search tool (for SERP analysis)
3. Vector memory (past successful content strategies)

Data provided:
{high_impression_low_click_queries}
{existing_content_inventory}
{competitor_serp_data}

User request: "{user_query}"

Your task:
1. Identify content gaps and keyword opportunities
2. Cluster opportunities by search intent
3. Prioritize by traffic potential and difficulty
4. Suggest specific content pieces to create

Output format:
## Content Opportunities

### High Priority
1. **[Topic Name]**
   - Target Keywords: [list]
   - Est. Traffic: [+X clicks/mo]
   - Content Type: [guide/comparison/tool/etc]
   - Why It Matters: [explanation]

### Medium Priority
[...]

## Content Strategy
- Recommended hub-and-spoke structure
- Internal linking opportunities
- Content brief suggestions`;
```

---

### 4. Technical Auditor Agent

**Purpose:** Diagnose and fix crawl/indexing issues

**Model:** Gemini 1.5 Pro

**Capabilities:**

#### 4.1 Indexing Issue Diagnosis
```typescript
interface IndexingIssue {
  url: string;
  coverageState: string;
  verdict: 'PASS' | 'FAIL' | 'NEUTRAL';
  rootCause?: string;
  fixSteps: string[];
  estimatedFixTime: string;
}

// Issue diagnosis mapping
const indexingIssueDiagnosis: Record<string, DiagnosisConfig> = {
  'Crawled - currently not indexed': {
    possibleCauses: [
      'Low-quality/thin content',
      'Insufficient internal links',
      'Duplicate content',
      'Recently published (needs time)'
    ],
    diagnosticSteps: [
      'Check content word count',
      'Count internal links to URL',
      'Check for duplicate content',
      'Verify publish date'
    ],
    fixStrategies: {
      'thin_content': 'Add 500+ words of unique, valuable content',
      'low_internal_links': 'Add 5-8 contextual internal links',
      'duplicate': 'Add canonical tag or consolidate',
      'too_new': 'Wait 7-14 days, then resubmit'
    }
  },
  'Discovered - currently not indexed': {
    possibleCauses: [
      'URL not in sitemap',
      'Low crawl priority',
      'Crawl budget constraints'
    ],
    fixStrategies: {
      'not_in_sitemap': 'Add to sitemap with priority 0.8',
      'low_priority': 'Increase internal link prominence',
      'crawl_budget': 'Improve site architecture'
    }
  },
  'Soft 404': {
    possibleCauses: [
      'Page returns 200 but has "not found" message',
      'Very thin content',
      'Redirect to irrelevant page'
    ],
    fixStrategies: {
      'thin_content': 'Add substantial content or return proper 404',
      'wrong_redirect': 'Fix redirect to relevant page'
    }
  }
};

// Algorithm
async function diagnoseIndexingIssue(
  url: string,
  propertyId: string
): Promise<IndexingIssue> {
  // Fetch real-time URL inspection data
  const inspection = await urlInspectionAPI.inspect(url, propertyId);
  
  const coverageState = inspection.indexStatusResult.coverageState;
  const verdict = inspection.indexStatusResult.verdict;
  
  if (verdict === 'PASS') {
    return {
      url,
      coverageState,
      verdict,
      fixSteps: [],
      estimatedFixTime: 'N/A'
    };
  }
  
  // Get diagnosis config
  const diagnosis = indexingIssueDiagnosis[coverageState];
  
  if (!diagnosis) {
    return {
      url,
      coverageState,
      verdict,
      rootCause: 'Unknown issue type',
      fixSteps: ['Manual review required'],
      estimatedFixTime: 'Unknown'
    };
  }
  
  // Run diagnostic steps
  const diagnostics = await runDiagnostics(url, diagnosis.diagnosticSteps);
  
  // Determine root cause
  const rootCause = determineRootCause(diagnostics, diagnosis.possibleCauses);
  
  // Generate fix steps
  const fixSteps = generateFixSteps(rootCause, diagnosis.fixStrategies);
  
  return {
    url,
    coverageState,
    verdict,
    rootCause,
    fixSteps,
    estimatedFixTime: estimateFixTime(fixSteps)
  };
}
```

#### 4.2 Redirect Chain Detection
```typescript
interface RedirectChainConfig {
  maxHops: 3,
  followRedirects: true
}

// Algorithm
async function detectRedirectChains(
  urls: string[],
  config: RedirectChainConfig
): Promise<RedirectChainIssue[]> {
  const issues: RedirectChainIssue[] = [];
  
  for (const url of urls) {
    const chain = await followRedirects(url, config.maxHops);
    
    if (chain.hops.length > 1) {
      issues.push({
        originalUrl: url,
        finalUrl: chain.finalUrl,
        hopCount: chain.hops.length,
        hops: chain.hops,
        totalLatency: chain.totalLatency,
        recommendation: `Update all internal links to point directly to ${chain.finalUrl}`,
        affectedLinks: await findInternalLinksTo(url)
      });
    }
  }
  
  return issues.sort((a, b) => b.hopCount - a.hopCount);
}
```

#### 4.3 Robots.txt Analysis
```typescript
interface RobotsAnalysis {
  url: string;
  directives: RobotsDirective[];
  issues: RobotsIssue[];
  recommendations: string[];
}

// Algorithm
async function analyzeRobotsTxt(url: string): Promise<RobotsAnalysis> {
  const robotsUrl = new URL('/robots.txt', url).toString();
  const content = await fetch(robotsUrl).then(r => r.text());
  
  const parser = new RobotsParser();
  const directives = parser.parse(content);
  
  const issues: RobotsIssue[] = [];
  const recommendations: string[] = [];
  
  // Check for common issues
  const criticalPaths = ['/blog/', '/products/', '/services/'];
  
  for (const path of criticalPaths) {
    const isBlocked = directives.some(d => 
      d.type === 'disallow' && 
      path.startsWith(d.path)
    );
    
    if (isBlocked) {
      issues.push({
        severity: 'CRITICAL',
        path,
        issue: 'Critical path blocked',
        impact: 'Prevents indexing of valuable content'
      });
      
      recommendations.push(
        `Remove or modify Disallow rule for ${path}`
      );
    }
  }
  
  // Check for crawl waste
  const wastePatterns = ['/tag/', '/author/', '/page/'];
  const allowedWaste = wastePatterns.filter(p => 
    !directives.some(d => d.type === 'disallow' && p.startsWith(d.path))
  );
  
  if (allowedWaste.length > 0) {
    recommendations.push(
      `Consider adding Disallow rules for: ${allowedWaste.join(', ')}`
    );
  }
  
  return {
    url: robotsUrl,
    directives,
    issues,
    recommendations
  };
}
```

**Technical Auditor Prompt:**
```typescript
const technicalAuditorPrompt = `You are the TECHNICAL_AUDITOR agent specializing in crawl and indexing issues.

Your expertise:
- Indexing issue diagnosis and remediation
- Redirect chain detection
- Robots.txt optimization
- Sitemap validation
- Core Web Vitals analysis

Current issue: {issue_details}
URL inspection result: {inspection_result}
Crawl stats: {crawl_stats}

Your diagnostic process:
1. Identify the exact technical barrier
2. Explain WHY this prevents indexing/ranking
3. Provide step-by-step fix instructions
4. Estimate time for Google to re-crawl/index

Output format:
## Issue Diagnosis

**Issue Type**: [e.g., "Crawled - currently not indexed"]
**Severity**: [CRITICAL/WARNING/INFO]
**Root Cause**: [Detailed explanation]

## Fix Instructions
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Timeline
- Fix implementation: [time]
- Google re-crawl: [time]
- Indexing: [time]

## Prevention
[How to prevent this issue in the future]`;
```

---

### 5. Optimizer Agent

**Purpose:** Generate on-page SEO improvements

**Model:** Gemini 1.5 Flash (fast generation)

**Capabilities:**

#### 5.1 Title Tag Optimization
```typescript
interface TitleOptimizationConfig {
  minLength: 30,
  maxLength: 60,
  includePrimaryKeyword: true,
  includeBrand: true
}

// Algorithm
function optimizeTitleTag(
  currentTitle: string,
  pageData: PageData,
  config: TitleOptimizationConfig
): TitleOptimization {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check length
  if (currentTitle.length < config.minLength) {
    issues.push('Title too short (< 30 chars)');
    recommendations.push('Add descriptive keywords');
  }
  if (currentTitle.length > config.maxLength) {
    issues.push('Title too long (> 60 chars)');
    recommendations.push('Remove unnecessary words');
  }
  
  // Check for primary keyword
  const primaryKeyword = pageData.topQueries[0]?.query;
  if (primaryKeyword && !currentTitle.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    issues.push('Primary keyword missing from title');
    recommendations.push(`Include "${primaryKeyword}" in title`);
  }
  
  // Generate optimized title
  const optimizedTitle = generateOptimizedTitle({
    primaryKeyword,
    secondaryKeywords: pageData.topQueries.slice(1, 3).map(q => q.query),
    brand: pageData.brandName,
    currentTitle
  });
  
  return {
    current: currentTitle,
    optimized: optimizedTitle,
    issues,
    recommendations,
    expectedImpact: {
      ctrImprovement: '15-25%',
      confidence: 'High'
    }
  };
}

function generateOptimizedTitle(params: TitleParams): string {
  // Template: [Primary Keyword] | [Benefit/Number] - [Brand]
  // Example: "CRM Software | Top 10 Tools for 2026 - CompanyName"
  
  const templates = [
    `${params.primaryKeyword} | Top Solutions for 2026 - ${params.brand}`,
    `Best ${params.primaryKeyword} | Comparison Guide - ${params.brand}`,
    `${params.primaryKeyword}: Complete Guide [2026] - ${params.brand}`
  ];
  
  // Select best template and customize
  return templates[0]; // Simplified - would use LLM for final generation
}
```

#### 5.2 Meta Description Generation
```typescript
interface MetaDescriptionConfig {
  minLength: 120,
  maxLength: 160,
  includeCTA: true
}

// Algorithm
function generateMetaDescription(
  pageData: PageData,
  config: MetaDescriptionConfig
): MetaDescriptionResult {
  const primaryKeyword = pageData.topQueries[0]?.query;
  const secondaryKeywords = pageData.topQueries.slice(1, 3).map(q => q.query);
  
  // Template structure
  const template = `
    [Primary benefit with ${primaryKeyword}]. 
    [Supporting detail with ${secondaryKeywords.join(' and ')}]. 
    [Social proof/differentiator]. 
    [CTA].
  `;
  
  // Generate using LLM
  const generatedDescription = generateWithLLM({
    template,
    pageContent: pageData.content,
    competitorDescriptions: pageData.competitorMetaDescriptions
  });
  
  // Ensure length constraints
  const finalDescription = truncateToLength(
    generatedDescription, 
    config.maxLength
  );
  
  return {
    description: finalDescription,
    length: finalDescription.length,
    includesKeywords: [primaryKeyword, ...secondaryKeywords].filter(k =>
      finalDescription.toLowerCase().includes(k.toLowerCase())
    ),
    hasCTA: /learn more|get started|discover|try|buy/i.test(finalDescription)
  };
}
```

#### 5.3 Internal Linking Strategy
```typescript
interface InternalLinkConfig {
  minLinksPerPage: 3,
  maxLinksPerPage: 5,
  prioritizeHighAuthority: true
}

// Algorithm
async function generateInternalLinkingStrategy(
  targetUrl: string,
  propertyId: string,
  config: InternalLinkConfig
): Promise<InternalLinkStrategy> {
  // Get target page data
  const targetPage = await getURLMetrics(targetUrl, propertyId);
  
  // Find semantically related pages
  const targetEmbedding = await generateEmbedding(targetPage.content);
  
  const relatedPages = await semantic_search(
    targetEmbedding,
    propertyId,
    20
  );
  
  // Filter and score potential link sources
  const linkOpportunities: LinkOpportunity[] = [];
  
  for (const page of relatedPages) {
    // Skip if already links to target
    if (await hasLinkTo(page.url, targetUrl)) continue;
    
    // Calculate link value score
    const score = calculateLinkValueScore(page, targetPage);
    
    // Generate anchor text suggestions
    const anchorTexts = generateAnchorTexts(
      page.content,
      targetPage.targetKeywords
    );
    
    linkOpportunities.push({
      sourceUrl: page.url,
      sourcePriority: page.seo_priority_score,
      score,
      anchorTexts,
      context: extractRelevantContext(page.content, targetPage.topic)
    });
  }
  
  // Sort by score and limit
  return {
    targetUrl,
    opportunities: linkOpportunities
      .sort((a, b) => b.score - a.score)
      .slice(0, config.maxLinksPerPage)
  };
}
```

**Optimizer Agent Prompt:**
```typescript
const optimizerPrompt = `You are the OPTIMIZER agent specializing in on-page SEO improvements.

Your expertise:
- Title tag optimization
- Meta description generation
- Header structure (H1-H6) optimization
- Internal linking strategy
- Schema markup recommendations

Target URL: {url}
Current Performance:
- Clicks: {clicks_30d}
- Avg Position: {avg_position}
- CTR: {ctr}

Top Ranking Queries:
{top_queries}

Current On-Page Elements:
- Title: {current_title}
- Meta Description: {current_meta}
- Headers: {header_structure}

Your task:
1. Audit current on-page elements
2. Identify specific deficiencies
3. Generate optimized versions
4. Explain expected impact

Output format:
## On-Page Audit

### Title Tag
**Current**: "{current_title}"
**Optimized**: "{optimized_title}"
**Why**: [Explanation of changes]
**Expected Impact**: [CTR improvement estimate]

### Meta Description
**Current**: "{current_meta}"
**Optimized**: "{optimized_meta}"
**Why**: [Explanation]

### Header Structure
**Current Issues**: [List]
**Recommended Structure**: [H1-H6 outline]

### Internal Linking
**Opportunities**: [3-5 suggested links]

### Schema Markup
**Recommended**: [JSON-LD snippet]`;
```

---

### 6. Planner Agent

**Purpose:** Strategic roadmap and action plan creation

**Model:** Gemini 1.5 Pro

**Capabilities:**

#### 6.1 SEO Roadmap Generation
```typescript
interface RoadmapConfig {
  timeframeMonths: 6,
  targetTrafficIncrease: 0.40,  // 40%
  teamSize: number;
  availableHoursPerWeek: number;
}

// Algorithm
async function generateSEORoadmap(
  propertyId: string,
  config: RoadmapConfig
): Promise<SEORoadmap> {
  // Gather current state
  const currentMetrics = await getCurrentMetrics(propertyId);
  const opportunities = await gatherOpportunities(propertyId);
  const historicalPerformance = await getHistoricalData(propertyId, 180);
  
  // Calculate monthly targets
  const monthlyGrowthTarget = Math.pow(
    1 + config.targetTrafficIncrease,
    1 / config.timeframeMonths
  ) - 1;
  
  const roadmap: SEORoadmap = {
    goal: `Increase organic traffic by ${config.targetTrafficIncrease * 100}% in ${config.timeframeMonths} months`,
    currentBaseline: currentMetrics,
    monthlyTargets: [],
    milestones: []
  };
  
  // Month 1-2: Quick wins (striking distance)
  const quickWins = opportunities.strikingDistance.slice(0, 20);
  roadmap.monthlyTargets.push({
    month: 1,
    focus: 'Quick Wins - Striking Distance Keywords',
    actions: quickWins.map(o => ({
      type: 'OPTIMIZE',
      target: o.page,
      estimatedImpact: o.trafficPotential,
      effort: 'Low'
    })),
    targetGrowth: monthlyGrowthTarget * 1.5  // Higher in month 1
  });
  
  // Month 2-4: Content gaps
  const contentGaps = opportunities.keywordGaps.slice(0, 5);
  roadmap.monthlyTargets.push({
    month: 2,
    focus: 'Content Creation - Keyword Gaps',
    actions: contentGaps.map(g => ({
      type: 'CREATE',
      target: g.suggestedContentType,
      estimatedImpact: g.opportunityScore * 100,
      effort: 'High'
    })),
    targetGrowth: monthlyGrowthTarget
  });
  
  // Month 3-6: Technical debt + authority
  const technicalIssues = opportunities.technicalIssues;
  roadmap.monthlyTargets.push({
    month: 3,
    focus: 'Technical SEO & Authority Building',
    actions: [
      ...technicalIssues.map(i => ({
        type: 'FIX',
        target: i.url,
        estimatedImpact: i.impact,
        effort: 'Medium'
      })),
      {
        type: 'BUILD',
        target: 'Backlink acquisition',
        estimatedImpact: 500,
        effort: 'High'
      }
    ],
    targetGrowth: monthlyGrowthTarget * 0.8
  });
  
  return roadmap;
}
```

#### 6.2 Weekly Action Plans
```typescript
interface WeeklyPlanConfig {
  prioritizeRevenue: boolean;
  maxActionsPerWeek: 10;
  balanceReactiveProactive: 0.5;  // 50/50 split
}

// Algorithm
async function generateWeeklyPlan(
  propertyId: string,
  config: WeeklyPlanConfig
): Promise<WeeklyPlan> {
  // Get active issues
  const criticalIssues = await getActiveIssues(propertyId, 'CRITICAL');
  const warnings = await getActiveIssues(propertyId, 'WARNING');
  
  // Get opportunities
  const opportunities = await getTopOpportunities(propertyId, 10);
  
  // Get recent insights
  const insights = await getRecentInsights(propertyId, 7);
  
  // Query successful past actions
  const successfulStrategies = await db.query(`
    SELECT * FROM skill_library
    WHERE property_id = $1 OR property_id IS NULL
    ORDER BY success_rate DESC, times_applied DESC
    LIMIT 5
  `, [propertyId]);
  
  const plan: WeeklyPlan = {
    weekStarting: getMondayDate(),
    critical: [],
    highPriority: [],
    mediumPriority: [],
    lowPriority: []
  };
  
  // Add critical issues first
  for (const issue of criticalIssues.slice(0, 3)) {
    plan.critical.push({
      task: `Fix ${issue.issue_type} on ${issue.url}`,
      agent: 'TECHNICAL_AUDITOR',
      estimatedTime: '2 hours',
      impact: 'High'
    });
  }
  
  // Add high-priority optimizations
  for (const opp of opportunities.slice(0, 5)) {
    plan.highPriority.push({
      task: `Optimize ${opp.page} for "${opp.query}"`,
      agent: 'OPTIMIZER',
      estimatedTime: '1 hour',
      impact: `+${opp.trafficPotential} clicks/mo`
    });
  }
  
  return plan;
}
```

#### 6.3 Crawl Budget Optimization
```typescript
interface CrawlBudgetConfig {
  targetEfficiency: 0.85;  // 85%
  minValuableCrawlRatio: 0.7;
}

// Algorithm
async function optimizeCrawlBudget(
  propertyId: string,
  config: CrawlBudgetConfig
): Promise<CrawlBudgetPlan> {
  // Get crawl stats
  const crawlStats = await getCrawlStats(propertyId, 30);
  
  // Get URL metrics
  const urls = await getURLMetrics(propertyId);
  
  // Calculate current efficiency
  const valuableCrawls = urls.filter(u => 
    u.clicks_90d > 0 || u.conversions_30d > 0
  );
  
  const currentEfficiency = valuableCrawls.length / urls.length;
  
  // Identify waste
  const wasteURLs = urls.filter(u => 
    u.crawl_frequency > 2 && 
    u.clicks_90d === 0 &&
    u.seo_priority_score < 0.3
  );
  
  // Categorize waste
  const wasteByCategory = categorizeWasteURLs(wasteURLs);
  
  // Generate optimization plan
  const plan: CrawlBudgetPlan = {
    currentEfficiency: `${(currentEfficiency * 100).toFixed(1)}%`,
    targetEfficiency: `${(config.targetEfficiency * 100).toFixed(1)}%`,
    potentialImprovement: `${((config.targetEfficiency - currentEfficiency) * 100).toFixed(1)}%`,
    actions: []
  };
  
  // Add disallow recommendations
  for (const [category, urls] of Object.entries(wasteByCategory)) {
    if (urls.length > 10) {
      plan.actions.push({
        action: 'DISALLOW',
        target: getPatternForCategory(category),
        affectedURLs: urls.length,
        estimatedCrawlBudgetSaved: `${(urls.length / urls.length * 100).toFixed(1)}%`,
        implementation: `Add to robots.txt: Disallow: ${getPatternForCategory(category)}`
      });
    }
  }
  
  // Add priority increase recommendations
  const highValueLowCrawl = urls.filter(u => 
    u.seo_priority_score > 0.8 && 
    u.crawl_frequency < 1
  );
  
  for (const url of highValueLowCrawl.slice(0, 10)) {
    plan.actions.push({
      action: 'INCREASE_PRIORITY',
      target: url.url,
      affectedURLs: 1,
      implementation: `Update sitemap priority to 0.9 for ${url.url}`
    });
  }
  
  return plan;
}
```

**Planner Agent Prompt:**
```typescript
const plannerPrompt = `You are the PLANNER agent creating strategic SEO roadmaps.

Your expertise:
- SEO roadmap generation (monthly milestones)
- Weekly action planning
- Crawl budget optimization
- Seasonal opportunity forecasting

Business Goal: {user_goal}
Current Baseline:
- Monthly Clicks: {current_clicks}
- Avg Position: {current_position}
- Indexed URLs: {indexed_count}

Available Resources:
- Team Size: {team_size}
- Hours/Week: {available_hours}

Top Opportunities:
{opportunities}

Your planning process:
1. Break goal into achievable milestones
2. Identify highest-leverage tactics
3. Sequence actions by priority and dependencies
4. Estimate impact and timeline for each

Output format:
# 6-Month SEO Roadmap

## Goal
[Clear statement of objective]

## Current Baseline
[Key metrics]

## Monthly Breakdown

### Month 1: Quick Wins
**Focus**: Striking distance keywords
**Actions**:
- [Action 1] - Est. Impact: +X clicks
- [Action 2] - Est. Impact: +X clicks
**Target**: X% growth

### Month 2: Content Creation
[...]

## Weekly Action Plan (This Week)

### Critical (Do First)
- [ ] [Task] - [Agent] - [Time]

### High Priority
- [ ] [Task] - [Agent] - [Time]

### Medium Priority
- [ ] [Task] - [Agent] - [Time]

## Success Metrics
- [Metric 1]: [Target]
- [Metric 2]: [Target]`;
```

---

### 7. Memory Agent

**Purpose:** Manage long-term knowledge and retrieval

**Model:** Embedding Model (text-embedding-3-small)

**Capabilities:**

#### 7.1 Contextual Memory Retrieval
```typescript
interface MemoryRetrievalConfig {
  maxResults: 10;
  recencyWeight: 0.2;
  similarityWeight: 0.8;
  minSimilarity: 0.7;
}

// Algorithm
async function retrieveRelevantMemories(
  query: string,
  propertyId: string,
  config: MemoryRetrievalConfig
): Promise<RetrievedMemory[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Perform vector search
  const results = await db.query(`
    SELECT 
      id,
      content_text,
      metadata,
      1 - (embedding <=> $1) as similarity,
      created_at,
      access_count,
      importance_weight
    FROM memory_store
    WHERE property_id = $2
      AND memory_type IN ('SEMANTIC', 'EPISODIC')
      AND 1 - (embedding <=> $1) > $3
    ORDER BY (
      $4 * (1 - (embedding <=> $1)) +
      $5 * EXP(-EXTRACT(EPOCH FROM (NOW() - created_at)) / 2592000)
    ) DESC
    LIMIT $6
  `, [
    queryEmbedding,
    propertyId,
    config.minSimilarity,
    config.similarityWeight,
    config.recencyWeight,
    config.maxResults
  ]);
  
  // Update access metrics
  for (const result of results) {
    await db.query(`
      UPDATE memory_store
      SET access_count = access_count + 1,
          last_accessed = NOW()
      WHERE id = $1
    `, [result.id]);
  }
  
  return results;
}
```

#### 7.2 Strategy Promotion to Skill Library
```typescript
interface PromotionConfig {
  minSuccessScore: 0.7;
  minApplications: 3;
  measurementWindow: 30;  // days
}

// Algorithm
async function promoteSuccessfulStrategies(
  config: PromotionConfig
): Promise<PromotionResult[]> {
  const promotions: PromotionResult[] = [];
  
  // Find successful actions
  const successfulActions = await db.query(`
    SELECT 
      action_type,
      context_summary,
      action_details,
      AVG(success_score) as avg_success,
      COUNT(*) as times_used
    FROM agent_actions
    WHERE success_score > $1
      AND impact_measured_at IS NOT NULL
      AND executed_at < NOW() - INTERVAL '$2 days'
    GROUP BY action_type, context_summary, action_details
    HAVING COUNT(*) >= $3
  `, [config.minSuccessScore, config.measurementWindow, config.minApplications]);
  
  for (const action of successfulActions) {
    // Check if already in skill library
    const existing = await db.query(`
      SELECT * FROM skill_library
      WHERE strategy_name = $1 AND context_pattern = $2
    `, [action.action_type, action.context_summary]);
    
    if (existing.length === 0) {
      // Promote to skill library
      const skill = await db.query(`
        INSERT INTO skill_library (
          strategy_name,
          strategy_description,
          context_pattern,
          action_steps,
          success_rate,
          times_applied,
          avg_impact_score,
          promoted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        action.action_type,
        'Auto-promoted from successful agent actions',
        action.context_summary,
        action.action_details,
        action.avg_success,
        action.times_used,
        action.avg_success
      ]);
      
      promotions.push({
        strategyId: skill[0].id,
        strategyName: action.action_type,
        successRate: action.avg_success,
        timesApplied: action.times_used
      });
    }
  }
  
  return promotions;
}
```

#### 7.3 Sleep Cycle Consolidation
```typescript
interface SleepCycleConfig {
  runInterval: 6;  // hours
  similarityThreshold: 0.95;
  minAccessCountForPromotion: 10;
  minAgeForPromotion: 30;  // days
}

// Algorithm
async function runSleepCycle(
  config: SleepCycleConfig
): Promise<SleepCycleResult> {
  const result: SleepCycleResult = {
    processedMemories: 0,
    mergedDuplicates: 0,
    promotedToSemantic: 0,
    garbageCollected: 0
  };
  
  // Step 1: Fetch new memories
  const newMemories = await db.query(`
    SELECT * FROM memory_store
    WHERE created_at > NOW() - INTERVAL '$1 hours'
      AND memory_type = 'EPISODIC'
  `, [config.runInterval]);
  
  result.processedMemories = newMemories.length;
  
  // Step 2: Find duplicates
  const duplicates: Array<[string, string, number]> = [];
  
  for (let i = 0; i < newMemories.length; i++) {
    for (let j = i + 1; j < newMemories.length; j++) {
      const similarity = cosineSimilarity(
        newMemories[i].embedding,
        newMemories[j].embedding
      );
      
      if (similarity > config.similarityThreshold) {
        duplicates.push([newMemories[i].id, newMemories[j].id, similarity]);
      }
    }
  }
  
  // Step 3: Merge duplicates
  for (const [id1, id2, similarity] of duplicates) {
    const mem1 = await db.findOne('memory_store', { id: id1 });
    const mem2 = await db.findOne('memory_store', { id: id2 });
    
    // Keep the one with higher access count
    const [keep, discard] = mem1.access_count >= mem2.access_count
      ? [mem1, mem2]
      : [mem2, mem1];
    
    // Merge metadata
    const mergedKeywords = [...new Set([
      ...(keep.metadata.keywords || []),
      ...(discard.metadata.keywords || [])
    ])];
    
    await db.query(`
      UPDATE memory_store
      SET metadata = jsonb_set(metadata, '{keywords}', $1),
          importance_weight = (importance_weight + $2) / 2,
          access_count = access_count + $3
      WHERE id = $4
    `, [JSON.stringify(mergedKeywords), discard.importance_weight, discard.access_count, keep.id]);
    
    await db.query('DELETE FROM memory_store WHERE id = $1', [discard.id]);
    
    result.mergedDuplicates++;
  }
  
  // Step 4: Promote to semantic
  const promoted = await db.query(`
    UPDATE memory_store
    SET memory_type = 'SEMANTIC',
        importance_weight = importance_weight * 1.2
    WHERE memory_type = 'EPISODIC'
      AND access_count >= $1
      AND created_at < NOW() - INTERVAL '$2 days'
    RETURNING id
  `, [config.minAccessCountForPromotion, config.minAgeForPromotion]);
  
  result.promotedToSemantic = promoted.length;
  
  // Step 5: Garbage collection
  const deleted = await db.query(`
    DELETE FROM memory_store
    WHERE decayed_weight < 0.01
      AND access_count < 2
      AND importance_weight < 0.5
      AND created_at < NOW() - INTERVAL '6 months'
    RETURNING id
  `);
  
  result.garbageCollected = deleted.length;
  
  return result;
}
```

**Memory Agent Prompt:**
```typescript
const memoryPrompt = `You are the MEMORY agent managing the system's knowledge base.

Your functions:
1. Retrieve relevant past cases when agents need context
2. Consolidate duplicate or conflicting memories
3. Promote successful strategies to Skill Library
4. Archive outdated information

Current task: {task_description}

Guidelines:
- Prioritize recent, high-access memories
- Preserve brand rules (importance_weight = 1.0) indefinitely
- Merge duplicates to reduce noise
- Flag contradictions for human review

When retrieving memories:
- Use semantic similarity for topic matching
- Apply recency decay for temporal relevance
- Consider importance weight for critical information`;
```

## Agent Collaboration Patterns

### Sequential Execution
```
User: "Why did /blog/seo-guide drop and how do I fix it?"

Flow:
1. ORCHESTRATOR → Routes to ANALYST
2. ANALYST → "Position dropped 5.2 spots on Jan 10"
3. ORCHESTRATOR → Routes to TECHNICAL_AUDITOR
4. TECHNICAL_AUDITOR → "No technical issues found"
5. ORCHESTRATOR → Routes to OPTIMIZER
6. OPTIMIZER → "Title missing primary keyword"
7. ORCHESTRATOR → Routes to PLANNER
8. PLANNER → "4-week recovery plan..."
```

### Parallel Execution
```
User: "Give me a full site audit"

Flow (All Concurrent):
1. ANALYST → Traffic anomalies
2. TECHNICAL_AUDITOR → Indexing issues
3. RESEARCH → Keyword gaps
4. OPTIMIZER → On-page opportunities

After 30 seconds:
ORCHESTRATOR → Aggregates all results into comprehensive report
```

### Recursive Feedback Loop
```
1. OPTIMIZER updates title tag on /pricing
2. System records in agent_actions table
3. 30 days later: Automated job checks impact
4. Clicks increased 18%, position improved 2.1 spots
5. MEMORY agent promotes to skill_library
6. Next similar issue: OPTIMIZER retrieves strategy from memory
```

## Agent Configuration Summary

| Agent | Model | Temperature | Max Tokens | Timeout |
|-------|-------|-------------|------------|---------|
| Orchestrator | Gemini Flash | 0.1 | 500 | 5s |
| Analyst | Gemini Pro | 0.2 | 4000 | 30s |
| Research | Gemini Pro | 0.3 | 4000 | 30s |
| Technical Auditor | Gemini Pro | 0.2 | 3000 | 20s |
| Optimizer | Gemini Flash | 0.4 | 2000 | 10s |
| Planner | Gemini Pro | 0.3 | 4000 | 30s |
| Memory | Embedding | N/A | N/A | 5s |