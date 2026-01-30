# AI SEO Operating System - Step-by-Step Implementation Guide

## Executive Summary

This guide provides a complete roadmap to build a production-ready AI SEO OS with multi-agent swarm intelligence, optimized for low token usage while maintaining sophisticated capabilities. The system uses 6 specialized agents, Supabase local development, and Vercel free tier deployment.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: PRESENTATION (Next.js 15 + React 19 + Tailwind)       │
│  ├── Dashboard UI                                               │
│  ├── Chat Interface (Streaming)                                 │
│  └── Real-time Updates (SSE)                                    │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: INTELLIGENCE (6-Agent Swarm - Token Optimized)        │
│  ├── Orchestrator (Gemini Flash - Fast routing)                 │
│  ├── Analyst (Gemini Pro - Pattern detection)                   │
│  ├── Research (Gemini Pro + Search - Content gaps)              │
│  ├── Technical Auditor (Gemini Pro - Crawl/index diagnostics)   │
│  ├── Optimizer (Gemini Flash - On-page SEO)                     │
│  └── Memory (Embedding Model - Vector storage)                  │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: SERVICE (Next.js API Routes + Edge Functions)         │
│  ├── Agent Coordination API                                     │
│  ├── GSC Integration API                                        │
│  ├── Job Queue API                                              │
│  └── Cron Jobs (Vercel)                                         │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4: DATA (Supabase PostgreSQL + pgvector - Docker Local)  │
│  ├── Core Tables (Users, GSC Data, Metrics)                     │
│  ├── Vector Store (Memory embeddings)                           │
│  └── Cache Layer (Redis)                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation Setup (Steps 1-5)

### Step 1: Project Initialization

**Logic:** Establish the monorepo structure with proper TypeScript configuration and package management.

**Key Components:**
- Next.js 15 with App Router
- TypeScript strict mode
- Tailwind CSS with custom theme
- pnpm workspace (optional but recommended)

**Instructions for AI Agent:**
```bash
# Create project directory
mkdir ai-seo-os && cd ai-seo-os

# Initialize with Next.js 15
echo "my-app" | npx shadcn@latest init --yes --template next --base-color slate

# Install core dependencies
npm install drizzle-orm postgres zod @ai-sdk/openai openai
npm install -D drizzle-kit @types/pg

# Setup project structure
mkdir -p app/api/{agent,gsc,dashboard,jobs,cron}
mkdir -p app/{dashboard,chat,auth}
mkdir -p lib/{agents,db,utils,gsc}
mkdir -p components/{ui,agents,dashboard}
mkdir -p types
mkdir -p docker/supabase/init
```

**Important Notes:**
- Use Next.js 15 App Router for better performance
- Enable TypeScript strict mode in tsconfig.json
- Configure Tailwind with custom SEO-themed colors

---

### Step 2: Docker Infrastructure (Supabase Local)

**Logic:** Set up local Supabase with PostgreSQL + pgvector for vector search capabilities.

**Key Components:**
- PostgreSQL 15 with pgvector extension
- Redis for caching
- Inngest for job orchestration (optional)

**Instructions for AI Agent:**

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  db:
    image: supabase/postgres:15.1.0.147
    container_name: ai_seo_os_db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-postgres}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./docker/supabase/init:/docker-entrypoint-initdb.d
    networks:
      - app-network
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ai_seo_os_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: always

networks:
  app-network:
    driver: bridge

volumes:
  db_data:
  redis_data:
```

Create `.env.local`:
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_seo_os

# Redis
REDIS_URL=redis://localhost:6379

# Auth
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars-long
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI APIs
GOOGLE_AI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key  # Fallback

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key

# GSC API
GSC_CLIENT_ID=your-gsc-client-id
GSC_CLIENT_SECRET=your-gsc-client-secret
```

**Start Services:**
```bash
docker-compose up -d
```

---

### Step 3: Database Schema & Drizzle ORM

**Logic:** Design schema for SEO data with vector embeddings for memory. Use Drizzle ORM for type-safe queries.

**Key Tables:**
- `users` - User accounts
- `gsc_properties` - Connected GSC sites
- `search_analytics` - Time-series GSC data
- `url_metrics` - URL-level SEO scores
- `agent_actions` - Agent decision history
- `memory_store` - Vector embeddings for RAG

**Instructions for AI Agent:**

Create `lib/db/schema.ts`:
```typescript
import { pgTable, serial, varchar, text, timestamp, jsonb, integer, real, index, vector } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  googleId: varchar('google_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// GSC Properties
export const gscProperties = pgTable('gsc_properties', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  siteUrl: varchar('site_url', { length: 500 }).notNull(),
  accessToken: text('access_token').notNull(), // Encrypted
  refreshToken: text('refresh_token').notNull(), // Encrypted
  tokenExpiry: timestamp('token_expiry'),
  isActive: integer('is_active').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

// Search Analytics (Partitioned by date for performance)
export const searchAnalytics = pgTable('search_analytics', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => gscProperties.id),
  date: timestamp('date').notNull(),
  query: varchar('query', { length: 500 }),
  page: varchar('page', { length: 1000 }),
  country: varchar('country', { length: 10 }),
  device: varchar('device', { length: 20 }),
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  ctr: real('ctr').default(0),
  position: real('position').default(0),
}, (table) => ({
  dateIdx: index('sa_date_idx').on(table.date),
  propertyIdx: index('sa_property_idx').on(table.propertyId),
  queryIdx: index('sa_query_idx').on(table.query),
}));

// URL Metrics
export const urlMetrics = pgTable('url_metrics', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => gscProperties.id),
  url: varchar('url', { length: 1000 }).notNull(),
  seoScore: real('seo_score'),
  issues: jsonb('issues'),
  lastCrawled: timestamp('last_crawled'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Agent Actions (Episodic Memory)
export const agentActions = pgTable('agent_actions', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => gscProperties.id),
  agentType: varchar('agent_type', { length: 50 }).notNull(),
  action: text('action').notNull(),
  input: jsonb('input'),
  output: jsonb('output'),
  tokensUsed: integer('tokens_used'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Memory Store (Vector Search)
export const memoryStore = pgTable('memory_store', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => gscProperties.id),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }), // Gemini embeddings
  metadata: jsonb('metadata'),
  memoryType: varchar('memory_type', { length: 50 }), // 'insight', 'action', 'pattern'
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  embeddingIdx: index('memory_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
}));

// AI Insights
export const aiInsights = pgTable('ai_insights', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => gscProperties.id),
  insightType: varchar('insight_type', { length: 50 }), // 'anomaly', 'opportunity', 'trend'
  title: varchar('title', { length: 500 }),
  description: text('description'),
  severity: varchar('severity', { length: 20 }), // 'low', 'medium', 'high', 'critical'
  data: jsonb('data'),
  isRead: integer('is_read').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type GscProperty = typeof gscProperties.$inferSelect;
export type SearchAnalytics = typeof searchAnalytics.$inferSelect;
export type AgentAction = typeof agentActions.$inferSelect;
export type MemoryStore = typeof memoryStore.$inferSelect;
```

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Create `lib/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// For queries
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 });
```

**Run Migrations:**
```bash
npm run db:generate
npm run db:migrate
```

---

### Step 4: Authentication (NextAuth + Google OAuth)

**Logic:** Implement secure authentication with Google OAuth for GSC API access. Encrypt tokens at rest.

**Instructions for AI Agent:**

Install dependencies:
```bash
npm install next-auth@beta
```

Create `lib/auth.ts`:
```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from './db';
import { users, gscProperties } from './db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from './utils/encryption';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/webmasters.readonly',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Store or update user
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
        });

        if (!existingUser) {
          await db.insert(users).values({
            email: user.email!,
            name: user.name,
            googleId: user.id,
          });
        }

        // Store GSC tokens (encrypted)
        if (account.refresh_token) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.email, user.email!),
          });

          await db.insert(gscProperties).values({
            userId: dbUser!.id,
            siteUrl: '', // Will be populated later
            accessToken: await encrypt(account.access_token!),
            refreshToken: await encrypt(account.refresh_token),
            tokenExpiry: new Date(Date.now() + (account.expires_in || 3600) * 1000),
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
```

Create `lib/utils/encryption.ts`:
```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);

export async function encrypt(text: string): Promise<string> {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export async function decrypt(encryptedData: string): Promise<string> {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

---

### Step 5: GSC API Client

**Logic:** Create a robust GSC API client with automatic token refresh and rate limiting.

**Instructions for AI Agent:**

Create `lib/gsc/client.ts`:
```typescript
import { google, webmasters_v3 } from 'googleapis';
import { decrypt } from '../utils/encryption';
import { db } from '../db';
import { gscProperties } from '../db/schema';
import { eq } from 'drizzle-orm';

export class GSCClient {
  private oauth2Client: any;
  private webmasters: webmasters_v3.Webmasters;

  constructor(accessToken: string, refreshToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.webmasters = google.webmasters({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  static async create(propertyId: number): Promise<GSCClient> {
    const property = await db.query.gscProperties.findFirst({
      where: eq(gscProperties.id, propertyId),
    });

    if (!property) throw new Error('Property not found');

    const accessToken = await decrypt(property.accessToken);
    const refreshToken = await decrypt(property.refreshToken);

    return new GSCClient(accessToken, refreshToken);
  }

  async getSites() {
    const response = await this.webmasters.sites.list();
    return response.data.siteEntry || [];
  }

  async getSearchAnalytics(
    siteUrl: string,
    startDate: string,
    endDate: string,
    dimensions: string[] = ['query', 'page'],
    rowLimit: number = 25000
  ) {
    const response = await this.webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit,
      },
    });
    return response.data.rows || [];
  }

  async getSitemaps(siteUrl: string) {
    const response = await this.webmasters.sitemaps.list({ siteUrl });
    return response.data.sitemap || [];
  }

  async getCrawlErrors(siteUrl: string) {
    // Note: GSC API v3 doesn't have direct crawl errors endpoint
    // This would need to be implemented via web scraping or GSC UI automation
    return [];
  }
}

// Rate-limited wrapper
class RateLimitedGSCClient extends GSCClient {
  private lastRequestTime = 0;
  private minInterval = 1000; // 1 second between requests

  async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    return fn();
  }
}
```

---

## Phase 2: Multi-Agent Swarm System (Steps 6-10)

### Step 6: Agent Base Class & Token Optimization

**Logic:** Create a base agent class with built-in token optimization strategies:
- Response caching
- Context compression
- Structured output parsing
- Token usage tracking

**Instructions for AI Agent:**

Create `lib/agents/base.ts`:
```typescript
import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { db } from '../db';
import { agentActions } from '../db/schema';

export interface AgentContext {
  propertyId: number;
  userId: string;
  history?: AgentMessage[];
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
  latencyMs: number;
}

export abstract class BaseAgent {
  protected model: any;
  protected abstract agentType: string;
  protected maxTokens: number = 4000;
  protected temperature: number = 0.3;

  constructor(modelName: 'flash' | 'pro' = 'flash') {
    this.model = google(modelName === 'flash' ? 'gemini-1.5-flash' : 'gemini-1.5-pro');
  }

  protected async generate<T extends z.ZodType>(
    prompt: string,
    schema: T,
    context: AgentContext
  ): Promise<AgentResult<z.infer<T>>> {
    const startTime = Date.now();
    
    try {
      // Compress context to reduce tokens
      const compressedPrompt = this.compressContext(prompt, context);
      
      const { object, usage } = await generateObject({
        model: this.model,
        schema,
        prompt: compressedPrompt,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
      });

      const latencyMs = Date.now() - startTime;
      const tokensUsed = usage?.totalTokens || 0;

      // Log action for memory
      await this.logAction(context, compressedPrompt, object, tokensUsed, latencyMs);

      return {
        success: true,
        data: object,
        tokensUsed,
        latencyMs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tokensUsed: 0,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  protected async generateText(
    prompt: string,
    context: AgentContext
  ): Promise<AgentResult<string>> {
    const startTime = Date.now();
    
    try {
      const compressedPrompt = this.compressContext(prompt, context);
      
      const { text, usage } = await generateText({
        model: this.model,
        prompt: compressedPrompt,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
      });

      const latencyMs = Date.now() - startTime;
      const tokensUsed = usage?.totalTokens || 0;

      await this.logAction(context, compressedPrompt, { text }, tokensUsed, latencyMs);

      return {
        success: true,
        data: text,
        tokensUsed,
        latencyMs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tokensUsed: 0,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // Context compression to reduce token usage
  private compressContext(prompt: string, context: AgentContext): string {
    // Truncate history to last 3 messages
    const truncatedHistory = context.history?.slice(-3) || [];
    
    // Remove redundant whitespace
    const cleanedPrompt = prompt.replace(/\s+/g, ' ').trim();
    
    // Build compressed context
    const parts: string[] = [
      `Property: ${context.propertyId}`,
      ...truncatedHistory.map(h => `${h.role}: ${h.content.slice(0, 200)}`),
      cleanedPrompt,
    ];
    
    return parts.join('\n');
  }

  private async logAction(
    context: AgentContext,
    input: string,
    output: any,
    tokensUsed: number,
    latencyMs: number
  ) {
    await db.insert(agentActions).values({
      propertyId: context.propertyId,
      agentType: this.agentType,
      action: 'generate',
      input: { prompt: input.slice(0, 1000) },
      output,
      tokensUsed,
      latencyMs,
    });
  }

  abstract execute(input: string, context: AgentContext): Promise<AgentResult>;
}
```

---

### Step 7: Orchestrator Agent (Intent Router)

**Logic:** Fast agent that routes queries to appropriate specialists. Uses Gemini Flash for speed.

**Instructions for AI Agent:**

Create `lib/agents/orchestrator.ts`:
```typescript
import { z } from 'zod';
import { BaseAgent, AgentContext, AgentResult } from './base';

const routingSchema = z.object({
  intent: z.enum([
    'analyze',      // Traffic analysis, trends
    'research',     // Content gaps, keywords
    'technical',    // Crawl issues, indexing
    'optimize',     // On-page improvements
    'plan',         // Strategic roadmap
    'general',      // General SEO questions
  ]),
  confidence: z.number().min(0).max(1),
  agents: z.array(z.enum(['analyst', 'research', 'technical', 'optimizer', 'planner'])),
  reasoning: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
});

export type RoutingDecision = z.infer<typeof routingSchema>;

export class OrchestratorAgent extends BaseAgent {
  protected agentType = 'orchestrator';
  protected maxTokens = 500; // Very low for speed

  async execute(query: string, context: AgentContext): Promise<AgentResult<RoutingDecision>> {
    const prompt = `
      Analyze this SEO query and route to appropriate agents.
      
      Query: "${query}"
      
      Available agents:
      - analyst: Traffic patterns, anomalies, performance trends
      - research: Content gaps, keyword opportunities, competitor analysis
      - technical: Crawl errors, indexing issues, site health
      - optimizer: On-page SEO improvements, meta tags, content optimization
      - planner: Strategic roadmaps, long-term planning
      
      Respond with routing decision including intent, confidence (0-1), 
      which agents to invoke (can be multiple for parallel execution), 
      your reasoning, and priority level.
    `;

    return this.generate(prompt, routingSchema, context);
  }
}
```

---

### Step 8: Analyst Agent (Pattern Detection)

**Logic:** Detects anomalies and patterns in GSC data. Uses intelligent algorithms for statistical analysis.

**Intelligent Algorithm: Anomaly Detection (Z-Score + Seasonality)**

```typescript
// Algorithm: Statistical Anomaly Detection with Seasonal Adjustment
// 1. Calculate rolling mean and standard deviation
// 2. Compute Z-scores for recent data points
// 3. Adjust for day-of-week seasonality
// 4. Flag anomalies where |Z| > 2.5

function detectAnomalies(
  data: Array<{ date: string; clicks: number; impressions: number }>,
  windowSize: number = 30
): Array<{ date: string; metric: string; zScore: number; severity: string }> {
  const anomalies: Array<{ date: string; metric: string; zScore: number; severity: string }> = [];
  
  // Group by day of week for seasonality
  const dayOfWeekData: Record<number, number[]> = {};
  data.forEach(d => {
    const day = new Date(d.date).getDay();
    if (!dayOfWeekData[day]) dayOfWeekData[day] = [];
    dayOfWeekData[day].push(d.clicks);
  });
  
  // Calculate day-of-week averages
  const dayAverages: Record<number, number> = {};
  Object.entries(dayOfWeekData).forEach(([day, values]) => {
    dayAverages[parseInt(day)] = values.reduce((a, b) => a + b, 0) / values.length;
  });
  
  // Calculate rolling statistics
  for (let i = windowSize; i < data.length; i++) {
    const window = data.slice(i - windowSize, i);
    const values = window.map(d => d.clicks);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const currentDay = new Date(data[i].date).getDay();
    const seasonalAdjustment = dayAverages[currentDay] || mean;
    const adjustedValue = data[i].clicks * (mean / seasonalAdjustment);
    
    const zScore = (adjustedValue - mean) / (stdDev || 1);
    
    if (Math.abs(zScore) > 2.5) {
      anomalies.push({
        date: data[i].date,
        metric: 'clicks',
        zScore,
        severity: Math.abs(zScore) > 3.5 ? 'critical' : Math.abs(zScore) > 3 ? 'high' : 'medium',
      });
    }
  }
  
  return anomalies;
}
```

**Instructions for AI Agent:**

Create `lib/agents/analyst.ts`:
```typescript
import { z } from 'zod';
import { BaseAgent, AgentContext, AgentResult } from './base';
import { db } from '../db';
import { searchAnalytics } from '../db/schema';
import { eq, gte, lte, and, sql } from 'drizzle-orm';
import { subDays } from 'date-fns';

const analysisSchema = z.object({
  summary: z.string(),
  trends: z.array(z.object({
    metric: z.string(),
    direction: z.enum(['up', 'down', 'stable']),
    changePercent: z.number(),
    period: z.string(),
  })),
  anomalies: z.array(z.object({
    date: z.string(),
    metric: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
  })),
  topQueries: z.array(z.object({
    query: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
  })),
  opportunities: z.array(z.object({
    type: z.string(),
    description: z.string(),
    potentialImpact: z.enum(['low', 'medium', 'high']),
  })),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

export class AnalystAgent extends BaseAgent {
  protected agentType = 'analyst';
  protected temperature = 0.2;

  async execute(input: string, context: AgentContext): Promise<AgentResult<AnalysisResult>> {
    // Fetch GSC data
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    
    const data = await db.query.searchAnalytics.findMany({
      where: and(
        eq(searchAnalytics.propertyId, context.propertyId),
        gte(searchAnalytics.date, startDate),
        lte(searchAnalytics.date, endDate)
      ),
      orderBy: (sa, { desc }) => [desc(sa.date)],
    });

    // Run statistical analysis
    const anomalies = this.detectAnomalies(data);
    const trends = this.calculateTrends(data);
    const topQueries = this.getTopQueries(data);

    const prompt = `
      Analyze this SEO data and provide insights:
      
      Time Period: Last 30 days
      Total Clicks: ${data.reduce((sum, d) => sum + (d.clicks || 0), 0)}
      Total Impressions: ${data.reduce((sum, d) => sum + (d.impressions || 0), 0)}
      
      Detected Anomalies: ${JSON.stringify(anomalies.slice(0, 5))}
      
      Trends: ${JSON.stringify(trends)}
      
      Top Queries: ${JSON.stringify(topQueries.slice(0, 10))}
      
      User Question: ${input}
      
      Provide a comprehensive analysis with summary, trends, anomalies, top queries, and opportunities.
    `;

    return this.generate(prompt, analysisSchema, context);
  }

  private detectAnomalies(data: typeof searchAnalytics.$inferSelect[]) {
    // Implementation of the statistical anomaly detection algorithm
    if (data.length < 30) return [];
    
    const dailyData = this.aggregateByDate(data);
    const anomalies: Array<{ date: string; metric: string; zScore: number; severity: string }> = [];
    
    const windowSize = 14;
    for (let i = windowSize; i < dailyData.length; i++) {
      const window = dailyData.slice(i - windowSize, i);
      const values = window.map(d => d.clicks);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      );
      
      const currentValue = dailyData[i].clicks;
      const zScore = (currentValue - mean) / (stdDev || 1);
      
      if (Math.abs(zScore) > 2.5) {
        anomalies.push({
          date: dailyData[i].date,
          metric: 'clicks',
          zScore,
          severity: Math.abs(zScore) > 3.5 ? 'critical' : Math.abs(zScore) > 3 ? 'high' : 'medium',
        });
      }
    }
    
    return anomalies;
  }

  private aggregateByDate(data: typeof searchAnalytics.$inferSelect[]) {
    const grouped = data.reduce((acc, item) => {
      const date = item.date.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, clicks: 0, impressions: 0 };
      acc[date].clicks += item.clicks || 0;
      acc[date].impressions += item.impressions || 0;
      return acc;
    }, {} as Record<string, { date: string; clicks: number; impressions: number }>);
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateTrends(data: typeof searchAnalytics.$inferSelect[]) {
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstClicks = firstHalf.reduce((sum, d) => sum + (d.clicks || 0), 0);
    const secondClicks = secondHalf.reduce((sum, d) => sum + (d.clicks || 0), 0);
    
    const changePercent = firstClicks > 0 
      ? ((secondClicks - firstClicks) / firstClicks) * 100 
      : 0;
    
    return [{
      metric: 'clicks',
      direction: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
      changePercent: Math.abs(changePercent),
      period: '30 days',
    }];
  }

  private getTopQueries(data: typeof searchAnalytics.$inferSelect[]) {
    const queryMap = new Map<string, { clicks: number; impressions: number }>();
    
    data.forEach(item => {
      if (item.query) {
        const existing = queryMap.get(item.query) || { clicks: 0, impressions: 0 };
        existing.clicks += item.clicks || 0;
        existing.impressions += item.impressions || 0;
        queryMap.set(item.query, existing);
      }
    });
    
    return Array.from(queryMap.entries())
      .map(([query, stats]) => ({
        query,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
        position: 0, // Would need separate calculation
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20);
  }
}
```

---

### Step 9: Research & Technical Agents

**Instructions for AI Agent:**

Create `lib/agents/research.ts`:
```typescript
import { z } from 'zod';
import { BaseAgent, AgentContext, AgentResult } from './base';

const researchSchema = z.object({
  contentGaps: z.array(z.object({
    topic: z.string(),
    currentCoverage: z.string(),
    competitorCoverage: z.string(),
    opportunity: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })),
  keywordClusters: z.array(z.object({
    clusterName: z.string(),
    keywords: z.array(z.string()),
    totalVolume: z.number(),
    difficulty: z.enum(['low', 'medium', 'high']),
  })),
  recommendations: z.array(z.object({
    action: z.string(),
    expectedImpact: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
  })),
});

export class ResearchAgent extends BaseAgent {
  protected agentType = 'research';
  protected model: any; // Uses Gemini Pro + Search

  async execute(input: string, context: AgentContext): Promise<AgentResult<z.infer<typeof researchSchema>>> {
    const prompt = `
      Research content opportunities for this SEO query:
      "${input}"
      
      Analyze:
      1. Content gaps in current coverage
      2. Keyword clustering opportunities
      3. Competitor content strategies
      4. Actionable recommendations
      
      Provide structured research findings.
    `;

    return this.generate(prompt, researchSchema, context);
  }
}
```

Create `lib/agents/technical.ts`:
```typescript
import { z } from 'zod';
import { BaseAgent, AgentContext, AgentResult } from './base';

const technicalSchema = z.object({
  crawlIssues: z.array(z.object({
    issueType: z.string(),
    affectedUrls: z.number(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    fix: z.string(),
  })),
  indexingStatus: z.object({
    indexedUrls: z.number(),
    notIndexedUrls: z.number(),
    issues: z.array(z.string()),
  }),
  performance: z.object({
    coreWebVitals: z.object({
      lcp: z.string(),
      fid: z.string(),
      cls: z.string(),
    }),
    score: z.number(),
  }),
  recommendations: z.array(z.object({
    priority: z.number(),
    issue: z.string(),
    solution: z.string(),
    expectedImpact: z.string(),
  })),
});

export class TechnicalAgent extends BaseAgent {
  protected agentType = 'technical';

  async execute(input: string, context: AgentContext): Promise<AgentResult<z.infer<typeof technicalSchema>>> {
    const prompt = `
      Perform technical SEO audit for:
      "${input}"
      
      Check for:
      1. Crawl errors and issues
      2. Indexing problems
      3. Core Web Vitals performance
      4. Technical SEO best practices
      
      Provide prioritized recommendations.
    `;

    return this.generate(prompt, technicalSchema, context);
  }
}
```

---

### Step 10: Optimizer, Planner & Memory Agents

**Instructions for AI Agent:**

Create `lib/agents/optimizer.ts`:
```typescript
import { z } from 'zod';
import { BaseAgent, AgentContext, AgentResult } from './base';

const optimizationSchema = z.object({
  titleOptimization: z.object({
    current: z.string(),
    suggested: z.string(),
    reasoning: z.string(),
  }),
  metaDescription: z.object({
    current: z.string(),
    suggested: z.string(),
    reasoning: z.string(),
  }),
  contentImprovements: z.array(z.object({
    section: z.string(),
    issue: z.string(),
    suggestion: z.string(),
  })),
  keywordOptimization: z.array(z.object({
    keyword: z.string(),
    currentDensity: z.number(),
    suggestedDensity: z.number(),
    placements: z.array(z.string()),
  })),
});

export class OptimizerAgent extends BaseAgent {
  protected agentType = 'optimizer';
  protected maxTokens = 2000; // Flash model for speed

  async execute(input: string, context: AgentContext): Promise<AgentResult<z.infer<typeof optimizationSchema>>> {
    const prompt = `
      Optimize on-page SEO for:
      "${input}"
      
      Provide:
      1. Title tag optimization
      2. Meta description improvements
      3. Content structure suggestions
      4. Keyword density recommendations
    `;

    return this.generate(prompt, optimizationSchema, context);
  }
}
```

Create `lib/agents/planner.ts`:
```typescript
import { z } from 'zod';
import { BaseAgent, AgentContext, AgentResult } from './base';

const planSchema = z.object({
  roadmap: z.array(z.object({
    phase: z.string(),
    duration: z.string(),
    tasks: z.array(z.object({
      task: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      estimatedImpact: z.string(),
    })),
  })),
  milestones: z.array(z.object({
    name: z.string(),
    targetDate: z.string(),
    successCriteria: z.string(),
  })),
  kpis: z.array(z.object({
    metric: z.string(),
    current: z.number(),
    target: z.number(),
    timeline: z.string(),
  })),
});

export class PlannerAgent extends BaseAgent {
  protected agentType = 'planner';

  async execute(input: string, context: AgentContext): Promise<AgentResult<z.infer<typeof planSchema>>> {
    const prompt = `
      Create SEO strategy plan for:
      "${input}"
      
      Include:
      1. Phased roadmap with tasks
      2. Key milestones
      3. KPI targets and timelines
    `;

    return this.generate(prompt, planSchema, context);
  }
}
```

Create `lib/agents/memory.ts`:
```typescript
import { BaseAgent, AgentContext, AgentResult } from './base';
import { db } from '../db';
import { memoryStore, agentActions } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { google } from '@ai-sdk/google';
import { embed } from 'ai';

export class MemoryAgent extends BaseAgent {
  protected agentType = 'memory';
  protected model = google.textEmbeddingModel('text-embedding-004');

  async storeMemory(
    content: string,
    propertyId: number,
    memoryType: 'insight' | 'action' | 'pattern' = 'insight',
    metadata?: Record<string, any>
  ): Promise<void> {
    // Generate embedding
    const { embedding } = await embed({
      model: this.model,
      value: content,
    });

    // Store in vector database
    await db.insert(memoryStore).values({
      propertyId,
      content,
      embedding: sql`(${JSON.stringify(embedding)})::vector`,
      memoryType,
      metadata,
    });
  }

  async searchMemory(
    query: string,
    propertyId: number,
    limit: number = 5
  ): Promise<Array<{ content: string; similarity: number }>> {
    // Generate query embedding
    const { embedding } = await embed({
      model: this.model,
      value: query,
    });

    // Semantic search using pgvector
    const results = await db.execute(sql`
      SELECT content, 
             1 - (embedding <=> (${JSON.stringify(embedding)})::vector) as similarity
      FROM memory_store
      WHERE property_id = ${propertyId}
      ORDER BY embedding <=> (${JSON.stringify(embedding)})::vector
      LIMIT ${limit}
    `);

    return results.rows as Array<{ content: string; similarity: number }>;
  }

  async execute(input: string, context: AgentContext): Promise<AgentResult<any>> {
    // Memory agent doesn't execute directly, it's used by other agents
    return { success: true, tokensUsed: 0, latencyMs: 0 };
  }
}
```

---

## Phase 3: Agent Coordination & API (Steps 11-13)

### Step 11: Agent Swarm Coordinator

**Logic:** Central coordinator that manages agent execution, parallel processing, and result aggregation.

**Instructions for AI Agent:**

Create `lib/agents/coordinator.ts`:
```typescript
import { OrchestratorAgent, RoutingDecision } from './orchestrator';
import { AnalystAgent } from './analyst';
import { ResearchAgent } from './research';
import { TechnicalAgent } from './technical';
import { OptimizerAgent } from './optimizer';
import { PlannerAgent } from './planner';
import { MemoryAgent } from './memory';
import { AgentContext, AgentResult } from './base';

export interface SwarmResponse {
  query: string;
  routing: RoutingDecision;
  results: Record<string, any>;
  summary: string;
  tokensUsed: number;
  latencyMs: number;
}

export class AgentSwarmCoordinator {
  private orchestrator = new OrchestratorAgent();
  private analyst = new AnalystAgent();
  private research = new ResearchAgent();
  private technical = new TechnicalAgent();
  private optimizer = new OptimizerAgent();
  private planner = new PlannerAgent();
  private memory = new MemoryAgent();

  async processQuery(query: string, context: AgentContext): Promise<SwarmResponse> {
    const startTime = Date.now();
    let totalTokens = 0;

    // Step 1: Route the query
    const routingResult = await this.orchestrator.execute(query, context);
    if (!routingResult.success || !routingResult.data) {
      throw new Error('Failed to route query: ' + routingResult.error);
    }
    totalTokens += routingResult.tokensUsed;

    const routing = routingResult.data;

    // Step 2: Execute agents in parallel based on routing
    const agentPromises: Promise<[string, AgentResult]>[] = [];

    if (routing.agents.includes('analyst')) {
      agentPromises.push(
        this.analyst.execute(query, context).then(r => ['analyst', r])
      );
    }
    if (routing.agents.includes('research')) {
      agentPromises.push(
        this.research.execute(query, context).then(r => ['research', r])
      );
    }
    if (routing.agents.includes('technical')) {
      agentPromises.push(
        this.technical.execute(query, context).then(r => ['technical', r])
      );
    }
    if (routing.agents.includes('optimizer')) {
      agentPromises.push(
        this.optimizer.execute(query, context).then(r => ['optimizer', r])
      );
    }
    if (routing.agents.includes('planner')) {
      agentPromises.push(
        this.planner.execute(query, context).then(r => ['planner', r])
      );
    }

    // Wait for all agents to complete
    const agentResults = await Promise.all(agentPromises);
    const results: Record<string, any> = {};

    agentResults.forEach(([name, result]) => {
      if (result.success) {
        results[name] = result.data;
        totalTokens += result.tokensUsed;
      }
    });

    // Step 3: Store learnings in memory
    await this.memory.storeMemory(
      `Query: ${query}\nRouting: ${routing.intent}\nResults: ${JSON.stringify(results).slice(0, 500)}`,
      context.propertyId,
      'action',
      { query, routing: routing.intent }
    );

    // Step 4: Generate summary
    const summary = await this.generateSummary(query, routing, results);

    return {
      query,
      routing,
      results,
      summary,
      tokensUsed: totalTokens,
      latencyMs: Date.now() - startTime,
    };
  }

  private async generateSummary(
    query: string,
    routing: RoutingDecision,
    results: Record<string, any>
  ): Promise<string> {
    // Simple summary generation - could be enhanced with another agent call
    const parts: string[] = [
      `Based on your query about "${query}",`,
      `I identified this as a **${routing.intent}** request.`,
    ];

    if (results.analyst?.summary) {
      parts.push(`\n**Analysis:** ${results.analyst.summary}`);
    }

    if (results.analyst?.anomalies?.length > 0) {
      parts.push(`\n**Anomalies Detected:** ${results.analyst.anomalies.length} issues found.`);
    }

    if (results.research?.recommendations?.length > 0) {
      parts.push(`\n**Recommendations:** ${results.research.recommendations.length} actions suggested.`);
    }

    if (results.technical?.recommendations?.length > 0) {
      parts.push(`\n**Technical Issues:** ${results.technical.recommendations.length} fixes needed.`);
    }

    return parts.join('\n');
  }
}
```

---

### Step 12: API Routes

**Instructions for AI Agent:**

Create `app/api/agent/chat/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AgentSwarmCoordinator } from '@/lib/agents/coordinator';
import { auth } from '@/lib/auth';

export const runtime = 'edge';
export const maxDuration = 30;

const coordinator = new AgentSwarmCoordinator();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, propertyId } = await req.json();
    
    if (!query || !propertyId) {
      return NextResponse.json(
        { error: 'Missing query or propertyId' },
        { status: 400 }
      );
    }

    const result = await coordinator.processQuery(query, {
      propertyId,
      userId: session.user.id as string,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `app/api/agent/chat/stream/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { AgentSwarmCoordinator } from '@/lib/agents/coordinator';
import { auth } from '@/lib/auth';

export const runtime = 'edge';
export const maxDuration = 30;

const coordinator = new AgentSwarmCoordinator();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { query, propertyId } = await req.json();
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send routing decision
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'routing', status: 'started' })}\n\n`)
        );

        const result = await coordinator.processQuery(query, {
          propertyId,
          userId: session.user.id as string,
        });

        // Stream results incrementally
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'routing', data: result.routing })}\n\n`)
        );

        for (const [agent, data] of Object.entries(result.results)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'agent', agent, data })}\n\n`)
          );
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', summary: result.summary, tokensUsed: result.tokensUsed })}\n\n`)
        );

        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: (error as Error).message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

Create `app/api/gsc/sites/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GSCClient } from '@/lib/gsc/client';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { gscProperties } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Missing propertyId' },
        { status: 400 }
      );
    }

    const client = await GSCClient.create(parseInt(propertyId));
    const sites = await client.getSites();

    return NextResponse.json({ sites });
  } catch (error) {
    console.error('GSC sites error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}
```

Create `app/api/gsc/analytics/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GSCClient } from '@/lib/gsc/client';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { searchAnalytics } from '@/lib/db/schema';
import { format, subDays } from 'date-fns';

export const runtime = 'edge';
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const siteUrl = searchParams.get('siteUrl');
    const days = parseInt(searchParams.get('days') || '30');

    if (!propertyId || !siteUrl) {
      return NextResponse.json(
        { error: 'Missing propertyId or siteUrl' },
        { status: 400 }
      );
    }

    const client = await GSCClient.create(parseInt(propertyId));
    
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const data = await client.getSearchAnalytics(
      siteUrl,
      startDate,
      endDate,
      ['query', 'page'],
      25000
    );

    // Store in database for analysis
    const records = data.map(row => ({
      propertyId: parseInt(propertyId),
      date: new Date(row.keys?.[2] || new Date()),
      query: row.keys?.[0] || '',
      page: row.keys?.[1] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));

    // Batch insert (upsert to avoid duplicates)
    await db.insert(searchAnalytics).values(records).onConflictDoNothing();

    return NextResponse.json({ 
      data: records.slice(0, 100),
      totalRows: records.length,
    });
  } catch (error) {
    console.error('GSC analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
```

---

### Step 13: Cron Jobs (Vercel)

**Instructions for AI Agent:**

Create `app/api/cron/daily-sync/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gscProperties, searchAnalytics } from '@/lib/db/schema';
import { GSCClient } from '@/lib/gsc/client';
import { format, subDays } from 'date-fns';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';
export const maxDuration = 60;

// Vercel Cron: 0 2 * * * (2 AM daily)
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const properties = await db.query.gscProperties.findMany({
      where: eq(gscProperties.isActive, 1),
    });

    const results = [];

    for (const property of properties) {
      try {
        const client = await GSCClient.create(property.id);
        const sites = await client.getSites();

        for (const site of sites) {
          const endDate = format(new Date(), 'yyyy-MM-dd');
          const startDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');

          const data = await client.getSearchAnalytics(
            site.siteUrl!,
            startDate,
            endDate,
            ['query', 'page', 'date'],
            25000
          );

          const records = data.map(row => ({
            propertyId: property.id,
            date: new Date(row.keys?.[2] || new Date()),
            query: row.keys?.[0] || '',
            page: row.keys?.[1] || '',
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: row.position || 0,
          }));

          if (records.length > 0) {
            await db.insert(searchAnalytics).values(records).onConflictDoNothing();
          }

          results.push({
            propertyId: property.id,
            siteUrl: site.siteUrl,
            recordsSynced: records.length,
          });
        }
      } catch (error) {
        console.error(`Failed to sync property ${property.id}:`, error);
        results.push({
          propertyId: property.id,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Daily sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}
```

Create `app/api/cron/anomaly-detection/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { searchAnalytics, aiInsights } from '@/lib/db/schema';
import { eq, gte, and } from 'drizzle-orm';
import { subDays } from 'date-fns';

export const runtime = 'edge';
export const maxDuration = 60;

// Vercel Cron: 0 4 * * * (4 AM daily)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const properties = await db.query.gscProperties.findMany({
      where: eq(gscProperties.isActive, 1),
    });

    const results = [];

    for (const property of properties) {
      const data = await db.query.searchAnalytics.findMany({
        where: and(
          eq(searchAnalytics.propertyId, property.id),
          gte(searchAnalytics.date, subDays(new Date(), 30))
        ),
      });

      const anomalies = detectAnomalies(data);

      for (const anomaly of anomalies) {
        await db.insert(aiInsights).values({
          propertyId: property.id,
          insightType: 'anomaly',
          title: `Anomaly detected in ${anomaly.metric}`,
          description: `Significant change detected on ${anomaly.date} with Z-score of ${anomaly.zScore.toFixed(2)}`,
          severity: anomaly.severity as any,
          data: anomaly,
        });
      }

      results.push({
        propertyId: property.id,
        anomaliesDetected: anomalies.length,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return NextResponse.json(
      { error: 'Detection failed' },
      { status: 500 }
    );
  }
}

function detectAnomalies(data: typeof searchAnalytics.$inferSelect[]) {
  const dailyData = aggregateByDate(data);
  const anomalies: Array<{ date: string; metric: string; zScore: number; severity: string }> = [];
  
  const windowSize = 14;
  for (let i = windowSize; i < dailyData.length; i++) {
    const window = dailyData.slice(i - windowSize, i);
    const values = window.map(d => d.clicks);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
    
    const currentValue = dailyData[i].clicks;
    const zScore = (currentValue - mean) / (stdDev || 1);
    
    if (Math.abs(zScore) > 2.5) {
      anomalies.push({
        date: dailyData[i].date,
        metric: 'clicks',
        zScore,
        severity: Math.abs(zScore) > 3.5 ? 'critical' : Math.abs(zScore) > 3 ? 'high' : 'medium',
      });
    }
  }
  
  return anomalies;
}

function aggregateByDate(data: typeof searchAnalytics.$inferSelect[]) {
  const grouped = data.reduce((acc, item) => {
    const date = item.date.toISOString().split('T')[0];
    if (!acc[date]) acc[date] = { date, clicks: 0, impressions: 0 };
    acc[date].clicks += item.clicks || 0;
    acc[date].impressions += item.impressions || 0;
    return acc;
  }, {} as Record<string, { date: string; clicks: number; impressions: number }>);
  
  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}
```

---

## Phase 4: Frontend (Steps 14-16)

### Step 14: Dashboard Layout & Components

**Instructions for AI Agent:**

Create `app/dashboard/layout.tsx`:
```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

Create `components/dashboard/sidebar.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  Search,
  AlertTriangle,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/insights', label: 'Insights', icon: Search },
  { href: '/dashboard/issues', label: 'Issues', icon: AlertTriangle },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">AI SEO OS</h1>
        <p className="text-sm text-slate-500 mt-1">{user.email}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

---

### Step 15: Chat Interface with Streaming

**Instructions for AI Agent:**

Create `app/dashboard/chat/page.tsx`:
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    routing?: any;
    tokensUsed?: number;
    agents?: string[];
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          propertyId: 1, // Get from context
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let assistantMessage = '';
      const assistantMsgId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'routing') {
                // Update with routing info
              } else if (data.type === 'agent') {
                // Update with agent result
              } else if (data.type === 'complete') {
                assistantMessage = data.summary;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId 
                    ? { ...m, content: assistantMessage, metadata: { tokensUsed: data.tokensUsed } }
                    : m
                ));
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-medium text-slate-900 mb-2">
              How can I help with your SEO today?
            </h2>
            <p className="text-slate-500">
              Ask me about traffic analysis, content gaps, technical issues, or optimization opportunities.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-4 p-4 rounded-lg',
              message.role === 'user' ? 'bg-blue-50 ml-auto max-w-3xl' : 'bg-white border border-slate-200'
            )}
          >
            <div className="flex-shrink-0">
              {message.role === 'user' ? (
                <User className="w-6 h-6 text-blue-600" />
              ) : (
                <Bot className="w-6 h-6 text-purple-600" />
              )}
            </div>
            <div className="flex-1">
              <ReactMarkdown className="prose prose-sm max-w-none">
                {message.content}
              </ReactMarkdown>
              {message.metadata?.tokensUsed && (
                <p className="text-xs text-slate-400 mt-2">
                  Used {message.metadata.tokensUsed} tokens
                </p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI agents are analyzing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your SEO performance..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

### Step 16: Analytics Dashboard

**Instructions for AI Agent:**

Create `app/dashboard/analytics/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, TrendingDown, Eye, MousePointer } from 'lucide-react';

interface AnalyticsData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/gsc/analytics?propertyId=1&siteUrl=https://example.com&days=30');
      const result = await response.json();
      
      // Aggregate by date
      const aggregated = aggregateByDate(result.data || []);
      setData(aggregated);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateByDate = (data: any[]) => {
    const grouped = data.reduce((acc, item) => {
      const date = item.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, clicks: 0, impressions: 0 };
      }
      acc[date].clicks += item.clicks;
      acc[date].impressions += item.impressions;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );
  };

  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);
  const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Clicks</CardTitle>
            <MousePointer className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12.5%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Impressions</CardTitle>
            <Eye className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +8.2%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Avg CTR</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCtr.toFixed(2)}%</div>
            <div className="flex items-center text-sm text-red-600">
              <TrendingDown className="w-4 h-4 mr-1" />
              -0.3%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Avg Position</CardTitle>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +2.1
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="clicks">
        <TabsList>
          <TabsTrigger value="clicks">Clicks</TabsTrigger>
          <TabsTrigger value="impressions">Impressions</TabsTrigger>
          <TabsTrigger value="ctr">CTR</TabsTrigger>
        </TabsList>

        <TabsContent value="clicks">
          <Card>
            <CardHeader>
              <CardTitle>Clicks Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impressions">
          <Card>
            <CardHeader>
              <CardTitle>Impressions Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impressions" fill="#9333ea" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Phase 5: Security & Optimization (Steps 17-18)

### Step 17: Security Implementation

**Logic:** Implement comprehensive security measures for production.

**Instructions for AI Agent:**

Create `middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com;"
  );

  // Rate limiting check (simplified - use Redis in production)
  const ip = request.ip ?? '127.0.0.1';
  const path = request.nextUrl.pathname;

  // API rate limiting
  if (path.startsWith('/api/')) {
    // Implement rate limiting logic here
    // Use Upstash Redis or similar for distributed rate limiting
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

Create `lib/utils/rate-limit.ts`:
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const key = `rate_limit:${identifier}`;
  const windowMs = config.windowMs;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count current requests
  const currentCount = await redis.zcard(key);

  if (currentCount >= config.maxRequests) {
    const oldest = await redis.zrange(key, 0, 0, { withScores: true });
    const reset = (oldest[0]?.score || now) + windowMs;
    
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset,
    };
  }

  // Add current request
  await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  await redis.expire(key, Math.ceil(windowMs / 1000));

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - currentCount - 1,
    reset: now + windowMs,
  };
}
```

---

### Step 18: Performance Optimization

**Logic:** Implement caching, edge functions, and bundle optimization.

**Instructions for AI Agent:**

Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  headers: async () => [
    {
      source: '/:all*(svg|jpg|png|woff2)',
      locale: false,
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};

module.exports = nextConfig;
```

Create `lib/utils/cache.ts`:
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface CacheConfig {
  ttl: number; // seconds
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  config: CacheConfig
): Promise<void> {
  try {
    await redis.set(key, data, { ex: config.ttl });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

// Cache keys generator
export const cacheKeys = {
  gscAnalytics: (propertyId: number, days: number) => 
    `gsc:analytics:${propertyId}:${days}`,
  agentResponse: (query: string, propertyId: number) => 
    `agent:response:${propertyId}:${Buffer.from(query).toString('base64').slice(0, 32)}`,
  userSession: (userId: string) => `session:${userId}`,
};
```

---

## Phase 6: Vercel Deployment (Steps 19-20)

### Step 19: Vercel Configuration

**Logic:** Configure Vercel for optimal deployment with free tier limits.

**Instructions for AI Agent:**

Update `vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "name": "ai-seo-os",
  "regions": ["iad1"],
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  },
  "functions": {
    "app/api/agent/**/*.ts": {
      "maxDuration": 30
    },
    "app/api/gsc/**/*.ts": {
      "maxDuration": 10
    },
    "app/api/dashboard/**/*.ts": {
      "maxDuration": 5
    },
    "app/api/jobs/**/*.ts": {
      "maxDuration": 10
    },
    "app/api/cron/**/*.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/impact-measurement",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/anomaly-detection",
      "schedule": "0 4 * * *"
    },
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 9 * * 1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "github": {
    "enabled": true,
    "silent": true,
    "autoJobCancelation": true
  }
}
```

---

### Step 20: Deployment Checklist & Troubleshooting

**Instructions for AI Agent:**

Create `DEPLOYMENT.md`:
```markdown
# Deployment Guide

## Pre-Deployment Checklist

### Environment Variables
Create these in Vercel Dashboard:

```
# Database (Supabase)
DATABASE_URL=postgresql://...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
REDIS_URL=redis://...

# Auth
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars-long
NEXTAUTH_URL=https://your-domain.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI APIs
GOOGLE_AI_API_KEY=...
OPENAI_API_KEY=... (optional fallback)

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key

# Cron
CRON_SECRET=your-cron-secret-key
```

### Database Setup
1. Create Supabase project
2. Run migrations: `npm run db:migrate`
3. Enable pgvector extension
4. Set connection pooling

### Google OAuth Setup
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-domain.vercel.app/api/auth/callback/google` (prod)
4. Enable Google Search Console API

## Deployment Steps

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... add all env vars

# 5. Deploy
vercel --prod
```

## Troubleshooting

### Build Errors
```
Error: Cannot find module 'drizzle-orm'
→ Run: npm install

Error: Database connection failed
→ Check DATABASE_URL format
→ Ensure IP allowlist includes Vercel IPs
```

### Runtime Errors
```
Error: JWT must be provided
→ Check NEXTAUTH_SECRET is set

Error: Rate limit exceeded
→ Implement proper rate limiting
→ Check Upstash Redis connection
```

### Cron Job Failures
```
Cron job returns 401
→ Verify CRON_SECRET matches vercel.json

Cron job times out
→ Increase maxDuration in vercel.json
→ Optimize database queries
```

### AI API Errors
```
Error: 429 Too Many Requests
→ Implement exponential backoff
→ Add request queuing

Error: Invalid API key
→ Verify GOOGLE_AI_API_KEY
→ Check API quota limits
```

## Monitoring

### Vercel Analytics
- Enable in Vercel Dashboard
- Monitor Web Vitals
- Track API performance

### Error Tracking
- Add Sentry integration
- Configure alert thresholds

### Cost Optimization
- Monitor AI API usage
- Set up budget alerts
- Use caching aggressively
```

---

## Summary: 20-Step Implementation

| Phase | Steps | Focus |
|-------|-------|-------|
| **Foundation** | 1-5 | Project setup, Docker, Database, Auth, GSC API |
| **Agents** | 6-10 | Base class, 6 specialized agents, Token optimization |
| **Coordination** | 11-13 | Swarm coordinator, API routes, Cron jobs |
| **Frontend** | 14-16 | Dashboard, Chat UI, Analytics |
| **Security** | 17-18 | Middleware, Rate limiting, Caching |
| **Deployment** | 19-20 | Vercel config, Troubleshooting |

## Token Optimization Strategies

1. **Context Compression**: Truncate history, remove whitespace
2. **Model Selection**: Flash for routing, Pro for analysis
3. **Response Caching**: Cache common queries
4. **Structured Output**: Use Zod schemas for precise responses
5. **Batch Processing**: Combine multiple queries when possible

## Vercel Free Tier Limits

| Resource | Limit | Strategy |
|----------|-------|----------|
| Function Duration | 60s (Hobby) | Use edge functions, optimize queries |
| Function Invocations | 125K/day | Implement caching, batch operations |
| Bandwidth | 100GB/month | Compress responses, use CDN |
| Build Time | 45min | Optimize build config |

## Multi-Agent Architecture Benefits

1. **Specialization**: Each agent excels at specific tasks
2. **Parallelism**: Multiple agents run simultaneously
3. **Scalability**: Add new agents without changing existing ones
4. **Resilience**: Individual agent failures don't crash the system
5. **Observability**: Track each agent's performance separately
