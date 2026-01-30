# AI SEO Operating System - Architecture Documentation

## System Overview

The AI SEO Operating System is a distributed, multi-agent platform designed for autonomous SEO optimization. This document details the technical architecture, component interactions, and design decisions.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Browser   │  │   Mobile    │  │   API       │  │   Webhook           │ │
│  │   (Next.js) │  │   (PWA)     │  │   Clients   │  │   Receivers         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          └────────────────┴────────────────┴────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VERCEL EDGE NETWORK                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Next.js 15 Application (Server Components + Edge Functions)           │ │
│  │  ├── API Routes (/api/*)                                               │ │
│  │  ├── Server Actions                                                    │ │
│  │  ├── Edge Middleware (Auth, Rate Limiting)                            │ │
│  │  └── Streaming Responses (AI Chat)                                    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────────┐
│   SUPABASE      │    │   DOCKER WORKERS    │    │   N8N WORKFLOWS         │
│   (PostgreSQL)  │    │   (Background Jobs) │    │   (Automation)          │
│                 │    │                     │    │                         │
│  ┌───────────┐  │    │  ┌───────────────┐  │    │  ┌─────────────────┐   │
│  │  Users    │  │    │  │  Main Worker  │  │    │  │  Daily Sync     │   │
│  │  GSC Data │  │    │  │  AI Worker    │  │    │  │  Alert Flows    │   │
│  │  Memory   │  │    │  │  GSC Worker   │  │    │  │  Report Gen     │   │
│  │  Vectors  │  │    │  │  Memory Worker│  │    │  │  Webhook Handlers│  │
│  └───────────┘  │    │  └───────────────┘  │    │  └─────────────────┘   │
└─────────────────┘    └─────────────────────┘    └─────────────────────────┘
```

## Component Details

### 1. Frontend (Vercel Free Tier)

**Technology Stack:**
- Next.js 15 (App Router)
- React 19 (Server Components)
- Tailwind CSS
- shadcn/ui components
- TanStack Query
- Zustand (state management)

**Key Features:**
- Server-side rendering for SEO
- Edge functions for low-latency AI responses
- Streaming chat interface
- Real-time dashboard updates

**Vercel Configuration:**
```javascript
// vercel.json
{
  "regions": ["iad1"], // US East for low latency
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30 // 30s for AI endpoints
    }
  },
  "crons": [
    { "path": "/api/cron/daily-sync", "schedule": "0 2 * * *" }
  ]
}
```

### 2. Database (Supabase - Docker Local)

**Schema Design Principles:**
- Time-series partitioning for search_analytics
- Vector embeddings with pgvector
- JSONB for flexible metadata
- Comprehensive indexing for performance

**Key Tables:**
| Table | Purpose | Size Estimate |
|-------|---------|---------------|
| search_analytics | Time-series GSC data | 10M+ rows/property/year |
| url_metrics | URL-level intelligence | 100K+ rows/property |
| memory_store | Vector embeddings | 1M+ vectors |
| agent_actions | Episodic memory | 100K+ actions |

### 3. Multi-Agent Swarm System

#### Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATOR                        │
│              (Intent Classification + Routing)               │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   ANALYST     │   │   RESEARCH    │   │  TECH AUDITOR │
│   (Gemini Pro)│   │   (Gemini Pro)│   │  (Gemini Pro) │
│               │   │   + Search    │   │               │
│ • Anomalies   │   │               │   │ • Crawl issues│
│ • Velocity    │   │ • Keyword gaps│   │ • Indexing    │
│ • Striking    │   │ • SERP analysis│  │ • Redirects   │
│   distance    │   │ • Topic hubs  │   │ • Sitemaps    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESULT AGGREGATOR                         │
│              (Combines multi-agent outputs)                  │
└─────────────────────────────────────────────────────────────┘
```

#### Agent Specifications

**Orchestrator Agent:**
```typescript
interface OrchestratorConfig {
  model: 'gemini-1.5-flash';
  temperature: 0.1;
  maxTokens: 500;
  systemPrompt: `
    You are the Agent Orchestrator for an AI SEO Operating System.
    Analyze the user query and route to the appropriate specialist agent(s).
    
    Available Agents:
    - ANALYST: Performance interpretation, anomaly detection
    - RESEARCH: Content gaps, keyword clustering, SERP analysis
    - TECHNICAL_AUDITOR: Crawl issues, indexing problems
    - OPTIMIZER: On-page SEO improvements
    - PLANNER: Strategic roadmaps, action plans
    
    Output JSON:
    {
      "primary_agent": "ANALYST",
      "secondary_agents": ["TECHNICAL_AUDITOR"],
      "execution_mode": "sequential",
      "reasoning": "..."
    }
  `;
}
```

**Analyst Agent:**
```typescript
interface AnalystConfig {
  model: 'gemini-1.5-pro';
  temperature: 0.2;
  maxTokens: 4000;
  tools: ['get_search_analytics', 'get_ranking_history', 'calculate_velocity'];
  capabilities: [
    'CTR anomaly detection',
    'Ranking velocity tracking',
    'Striking distance identification',
    'Crawl budget waste detection'
  ];
}
```

### 4. Background Workers (Docker)

#### Worker Types

| Worker | Purpose | Concurrency | Resources |
|--------|---------|-------------|-----------|
| Main Worker | General job processing | 5 concurrent | 512MB RAM |
| AI Worker | LLM inference, embeddings | 3 concurrent | 1GB RAM |
| GSC Worker | Google API calls | 2 concurrent | 256MB RAM |
| Memory Worker | Vector operations, consolidation | 1 concurrent | 512MB RAM |

#### Job Processing Flow

```
Job Created
    ↓
[Redis Queue] ←── Priority: HIGH/MEDIUM/LOW
    ↓
Worker Picks Up Job
    ↓
Execute (with retry logic)
    ↓
Success ──→ Store Result ──→ Trigger Callback
    ↓
Failure ──→ Retry (max 3) ──→ Dead Letter Queue
```

### 5. n8n Automation

#### Workflow Examples

**Daily Sync Workflow:**
```json
{
  "name": "Daily GSC Sync",
  "trigger": {
    "type": "schedule",
    "cron": "0 2 * * *"
  },
  "nodes": [
    { "type": "fetch_properties" },
    { "type": "gsc_api_call" },
    { "type": "store_data" },
    { "type": "trigger_analysis" }
  ]
}
```

**Alert Workflow:**
```json
{
  "name": "SEO Alert Handler",
  "trigger": {
    "type": "webhook",
    "path": "/alert"
  },
  "nodes": [
    { "type": "classify_alert" },
    { "type": "send_email", "condition": "severity == 'CRITICAL'" },
    { "type": "slack_notification" },
    { "type": "create_ticket" }
  ]
}
```

## Data Flow Diagrams

### User Query Flow

```
User: "Why did traffic drop last week?"
    ↓
[Next.js API Route] /api/agent/chat
    ↓
[Orchestrator] Classifies intent → "TRAFFIC_DECLINE_INVESTIGATION"
    ↓
[ANALYST Agent]
  1. Query search_analytics for last 14 days
  2. Compare week-over-week
  3. Identify declining pages
  4. Check ranking_history for position changes
    ↓
[Memory Retrieval]
  - Search memory_store for similar past issues
  - Retrieve skill_library strategies
    ↓
[LLM Reasoning] (Gemini 1.5 Pro)
  Context: Analytics data + Memory + Skills
  Task: Explain root cause + Recommend actions
    ↓
[Stream Response] Token-by-token to UI
    ↓
[Memory Update]
  - Store conversation in memory_store
  - Update access_count, last_accessed
```

### Daily Automation Flow

```
Cron Trigger: 2:00 AM UTC
    ↓
[Daily Sync Job]
  For each active property:
    1. Fetch yesterday's GSC data
    2. Bulk insert to search_analytics
    3. Update ranking_history
    4. Calculate url_metrics
    ↓
[Anomaly Detection Job]
  ANALYST agent scans for:
    - Ranking drops >3 positions
    - CTR drops >20%
    - Traffic spikes >50%
    - New indexing issues
    ↓
[Insight Generation]
  Create ai_insights records:
    - Type: ANOMALY/OPPORTUNITY
    - Severity: CRITICAL/WARNING/INFO
    - Recommended actions
    ↓
[Impact Measurement Job]
  For actions from 30 days ago:
    - Calculate success_score
    - Promote to skill_library if >0.7
    ↓
[Sleep Cycle Job]
  MEMORY agent:
    - Merge duplicate memories
    - Promote high-access to SEMANTIC
    - Garbage collection
```

## Security Architecture

### Authentication Flow

```
User Login
    ↓
[Google OAuth 2.0]
  Scopes: webmasters.readonly, userinfo.email
    ↓
[Token Storage]
  - Access token: In-memory only
  - Refresh token: AES-256 encrypted in DB
    ↓
[Session Cookie]
  - HTTP-only
  - Secure (HTTPS)
  - SameSite=Lax
  - 30-day expiry
```

### Data Access Control

```typescript
// Row-level security pattern
async function getPropertyData(propertyId: string, userId: string) {
  // Always verify ownership
  const property = await db.query(`
    SELECT * FROM gsc_properties
    WHERE id = $1 AND user_id = $2
  `, [propertyId, userId]);
  
  if (!property) {
    throw new UnauthorizedError('Property not found');
  }
  
  // Now safe to fetch data
  return await db.query(`
    SELECT * FROM search_analytics
    WHERE property_id = $1
  `, [propertyId]);
}
```

## Performance Optimization

### Caching Strategy

| Layer | Technology | TTL | Use Case |
|-------|------------|-----|----------|
| Application | LRU Cache | 5 min | Hot dashboard data |
| Redis | Vercel KV | 1 hour | Session, rate limits |
| CDN | Vercel Edge | 1 min | Static assets |
| Database | Materialized Views | Daily | Pre-calculated metrics |

### Database Indexing

```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_sa_property_date 
  ON search_analytics(property_id, date DESC);

CREATE INDEX CONCURRENTLY idx_url_priority 
  ON url_metrics(property_id, seo_priority_score DESC);

CREATE INDEX CONCURRENTLY memory_embedding_idx 
  ON memory_store USING hnsw (embedding vector_cosine_ops);
```

## Scalability Roadmap

### Phase 1: MVP (Current)
- Vercel Free Tier + Docker Local
- Single property per user
- 1,000 URLs per property

### Phase 2: Growth
- Vercel Pro ($20/mo)
- Multiple properties per user
- 10,000 URLs per property
- Dedicated Redis instance

### Phase 3: Scale
- Kubernetes cluster
- Horizontal pod autoscaling
- Read replicas for database
- CDN for global distribution

### Phase 4: Enterprise
- Multi-tenant architecture
- Custom deployments
- White-label options
- SLA guarantees

## Monitoring & Observability

### Metrics Collection

```typescript
// Application metrics
interface AppMetrics {
  // Performance
  requestDuration: Histogram;
  databaseQueryTime: Histogram;
  aiResponseTime: Histogram;
  
  // Business
  dailyActiveUsers: Counter;
  propertiesSynced: Counter;
  insightsGenerated: Counter;
  
  // Errors
  apiErrors: Counter;
  aiFailures: Counter;
  databaseErrors: Counter;
}
```

### Alerting Rules

```yaml
# prometheus-rules.yml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: SlowAIResponse
    condition: ai_response_time_p99 > 10s
    duration: 10m
    severity: warning
    
  - name: DatabaseConnections
    condition: db_connections > 80%
    duration: 2m
    severity: critical
```

## Deployment Architecture

### Local Development

```bash
# Start all services
docker-compose up -d

# Start Next.js dev server
npm run dev
```

### Production Deployment

```
Git Push to Main
    ↓
[Vercel Build]
  - Build Next.js application
  - Run migrations
  - Deploy to Edge
    ↓
[Docker Workers]
  - Build images
  - Push to registry
  - Rolling update
    ↓
[Health Checks]
  - Verify API endpoints
  - Check worker status
  - Validate database connections
```

## Cost Estimation

### Free Tier (Current)
| Service | Cost | Limit |
|---------|------|-------|
| Vercel | $0 | 100GB bandwidth |
| Supabase (local) | $0 | Self-hosted |
| Gemini API | $0-50 | 1M tokens free |
| n8n | $0 | Self-hosted |
| **Total** | **$0-50/mo** | |

### Production (1K users)
| Service | Cost |
|---------|------|
| Vercel Pro | $20 |
| Supabase Cloud | $50 |
| Gemini API | $200 |
| Monitoring | $30 |
| **Total** | **~$300/mo** |