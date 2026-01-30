# AI SEO Operating System

A comprehensive, multi-agent AI-powered SEO platform with swarm intelligence, autonomous optimization, and recursive learning capabilities.

## 🎯 Core Vision

This is not just an SEO dashboard - it's an **AI SEO Operating System** that:
- **Thinks**: Analyzes search data to identify patterns, anomalies, and opportunities
- **Learns**: Builds institutional memory from every action and outcome
- **Acts**: Proactively optimizes crawl budgets, content strategy, and technical SEO
- **Evolves**: Improves daily through recursive feedback loops

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  (Next.js 15 + React 19 + Tailwind - Vercel Free Tier)          │
├─────────────────────────────────────────────────────────────────┤
│                    INTELLIGENCE LAYER                            │
│  (Multi-Agent Swarm - 6 Specialized AI Agents)                  │
├─────────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                                 │
│  (Next.js API Routes + Edge Functions)                          │
├─────────────────────────────────────────────────────────────────┤
│                    DATA LAYER                                    │
│  (Supabase PostgreSQL + pgvector - Docker Local)                │
├─────────────────────────────────────────────────────────────────┤
│                    WORKER LAYER                                  │
│  (Docker Workers + n8n Automation + Optional K8s)               │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Vercel CLI (optional)
- Google Cloud Console account (for GSC API)

### 1. Clone and Setup

```bash
git clone <repo-url>
cd ai-seo-os
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Start Infrastructure (Docker)

```bash
# Start Supabase, n8n, and workers
docker-compose up -d

# Verify services
docker-compose ps
```

### 4. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 5. Start Development

```bash
# Start Next.js dev server
npm run dev

# Or use Vercel CLI
vercel dev
```

## 📁 Project Structure

```
ai-seo-os/
├── apps/
│   ├── web/                    # Next.js frontend (Vercel)
│   └── workers/                # Background job workers (Docker)
├── packages/
│   ├── agents/                 # Multi-agent swarm logic
│   ├── database/               # Drizzle ORM + schema
│   ├── gsc-client/             # Google Search Console API
│   └── shared/                 # Shared utilities
├── docker/
│   ├── docker-compose.yml      # Main orchestration
│   ├── supabase/               # Supabase configuration
│   ├── n8n/                    # n8n workflows
│   └── workers/                # Worker Dockerfiles
├── k8s/                        # Kubernetes manifests
├── docs/                       # Documentation
└── scripts/                    # Deployment scripts
```

## 🤖 Multi-Agent Swarm System

### Agent Architecture

| Agent | Model | Purpose | Trigger |
|-------|-------|---------|---------|
| **Orchestrator** | Gemini Flash | Routes queries to specialists | Every user query |
| **Analyst** | Gemini Pro | Anomaly detection, pattern analysis | Daily cron + user query |
| **Research** | Gemini Pro + Search | Content gaps, keyword clustering | User request |
| **Technical Auditor** | Gemini Pro | Crawl/indexing diagnostics | Issue detected |
| **Optimizer** | Gemini Flash | On-page SEO improvements | Analysis complete |
| **Planner** | Gemini Pro | Strategic roadmaps | Weekly + user request |
| **Memory** | Embedding Model | Knowledge management | Every 6 hours |

### Swarm Coordination Pattern

```
User Query
    ↓
[Orchestrator] → Intent Classification
    ↓
Parallel Agent Execution (when applicable)
    ↓
[Analyst] ──┐
[Research] ──┼→ Result Aggregation
[TechAud] ──┘
    ↓
[Memory] → Store learnings
    ↓
Stream Response to User
```

## 🐳 Docker Services

### Core Services

| Service | Port | Purpose |
|---------|------|---------|
| `supabase-db` | 5432 | PostgreSQL with pgvector |
| `supabase-studio` | 8000 | Database management UI |
| `n8n` | 5678 | Workflow automation |
| `redis` | 6379 | Caching & session store |
| `worker-main` | - | Background job processor |
| `worker-ai` | - | AI inference worker |

### Starting Services

```bash
# All services
docker-compose up -d

# Specific service
docker-compose up -d supabase-db n8n

# Scale workers
docker-compose up -d --scale worker-main=3
```

## ☸️ Kubernetes (Optional)

For local Kubernetes development:

```bash
# Start local cluster (using k3d or kind)
k3d cluster create ai-seo-os

# Deploy manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

# Check status
kubectl get all -n ai-seo-os
```

## 📊 Database Schema

### Core Tables

- `users` - User accounts
- `accounts` - OAuth tokens (encrypted)
- `gsc_properties` - Connected GSC sites
- `search_analytics` - Time-series GSC data (partitioned)
- `url_metrics` - URL-level SEO scores
- `ranking_history` - Position tracking
- `indexing_issues` - Technical issues
- `agent_actions` - Episodic memory
- `memory_store` - Vector embeddings
- `skill_library` - Proven strategies
- `ai_insights` - Generated insights

### Vector Search

```sql
-- Semantic memory search
SELECT * FROM semantic_search(
  query_embedding := $1,
  p_property_id := $2,
  result_limit := 10
);
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_seo_os

# Authentication
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# AI
GOOGLE_AI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_claude_key  # Optional fallback

# Encryption
ENCRYPTION_KEY=your_32_char_key

# Optional
REDIS_URL=redis://localhost:6379
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

## 📈 Development Phases

### Phase 1: Foundation (Week 1-2)
- [x] Project setup & architecture
- [x] Docker infrastructure
- [x] Database schema & migrations
- [x] Google OAuth integration
- [x] Basic GSC data fetching

### Phase 2: Core Agents (Week 3-4)
- [x] Agent orchestrator
- [x] Analyst agent
- [x] Research agent
- [x] Chat interface with streaming

### Phase 3: Intelligence (Week 5-6)
- [x] Technical Auditor agent
- [x] Optimizer agent
- [x] Planner agent
- [x] Memory system (vector embeddings)

### Phase 4: Automation (Week 7-8)
- [x] Daily cron jobs
- [x] n8n workflow integration
- [x] Background workers
- [x] Impact measurement

### Phase 5: Advanced (Ongoing)
- [ ] Predictive forecasting
- [ ] Multi-property management
- [ ] White-label customization
- [ ] Kubernetes scaling

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load testing
npm run test:load
```

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Agent System](./docs/AGENTS.md)
- [API Reference](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Development Guide](./docs/DEVELOPMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- Google Gemini API
- Vercel Platform
- Supabase
- n8n
- Next.js Community
