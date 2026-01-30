# AI SEO Operating System - Deployment Guide

## Deployment Options

The AI SEO OS supports multiple deployment configurations:

1. **Vercel Free Tier + Docker Local** (Recommended for development)
2. **Vercel Pro + Docker Compose** (Recommended for production)
3. **Kubernetes (k3s/k3d/kind)** (For advanced users)

---

## Option 1: Vercel Free Tier + Docker Local

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Vercel CLI (optional)
- Google Cloud account

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/ai-seo-os.git
cd ai-seo-os
```

### Step 2: Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Step 3: Start Docker Services

```bash
cd docker
docker-compose up -d

# Verify all services are running
docker-compose ps

# View logs
docker-compose logs -f
```

Services will be available at:
- Supabase Studio: http://localhost:8000
- n8n: http://localhost:5678
- Redis Commander: http://localhost:8081
- Grafana: http://localhost:3001

### Step 4: Initialize Database

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Set environment variables
vercel env add DATABASE_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_AI_API_KEY
vercel env add ENCRYPTION_KEY

# Deploy
vercel --prod
```

### Vercel Configuration

The `vercel.json` file configures:
- Build settings
- API route timeouts
- Cron jobs (daily sync, impact measurement)
- Security headers
- Caching rules

---

## Option 2: Vercel Pro + Docker Compose Production

### Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel Edge Network (Pro Plan)                              │
│  ├── Frontend (Next.js 15)                                   │
│  ├── API Routes (Serverless Functions)                       │
│  └── Edge Functions (AI Chat Streaming)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Docker Host (VPS/Cloud Instance)                            │
│  ├── Supabase PostgreSQL + pgvector                         │
│  ├── Redis (Caching/Sessions)                               │
│  ├── n8n (Workflow Automation)                              │
│  ├── Workers (Background Jobs)                              │
│  └── Monitoring (Prometheus/Grafana)                        │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Provision VPS

Recommended providers:
- Hetzner Cloud (€5.35/mo for 2 vCPU, 4GB RAM)
- DigitalOcean ($24/mo for 2 vCPU, 4GB RAM)
- AWS Lightsail ($20/mo for 2 vCPU, 4GB RAM)

### Step 2: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (restrict to Vercel IPs)
sudo ufw allow 6379/tcp  # Redis (restrict to Vercel IPs)
sudo ufw enable
```

### Step 4: Deploy Services

```bash
# Clone repository
git clone https://github.com/yourusername/ai-seo-os.git
cd ai-seo-os/docker

# Create production environment file
cp .env.example .env.production
nano .env.production  # Edit with production values

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify
docker-compose ps
```

### Step 5: Configure Vercel Pro

```bash
# Upgrade to Pro
vercel upgrade pro

# Add production environment variables
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
# ... etc

# Deploy
vercel --prod
```

### Production Environment Variables

```bash
# Database (use internal Docker network or secure external)
DATABASE_URL=postgresql://postgres:secure-password@your-vps-ip:5432/ai_seo_os

# Redis
REDIS_URL=redis://your-vps-ip:6379

# n8n webhook
N8N_WEBHOOK_URL=http://your-vps-ip:5678/webhook
```

---

## Option 3: Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (k3s, k3d, kind, or cloud provider)
- kubectl configured
- Helm (optional)

### Step 1: Create Cluster (k3d example)

```bash
# Install k3d
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Create cluster
k3d cluster create ai-seo-os \
  --servers 1 \
  --agents 2 \
  --port "80:80@loadbalancer" \
  --port "443:443@loadbalancer"

# Verify
kubectl get nodes
```

### Step 2: Deploy to Kubernetes

```bash
# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Apply configmaps
kubectl apply -f k8s/configmap.yaml

# Apply secrets (update with your values first)
kubectl apply -f k8s/secrets.yaml

# Apply deployments
kubectl apply -f k8s/deployments.yaml

# Apply services
kubectl apply -f k8s/services.yaml

# Apply cronjobs
kubectl apply -f k8s/cronjobs.yaml

# Verify
kubectl get all -n ai-seo-os
```

### Step 3: Configure Ingress

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Apply ingress
kubectl apply -f k8s/services.yaml  # Contains ingress definition

# Get ingress IP
kubectl get ingress -n ai-seo-os
```

### Step 4: Configure SSL (cert-manager)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s

# Create cluster issuer (update email)
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Step 5: Update DNS

Point your domain to the ingress controller IP:
```
A record: ai-seo-os.yourdomain.com -> <INGRESS_IP>
```

---

## Database Migrations

### Local Development

```bash
# Create migration
npm run db:migrate:create -- name_of_migration

# Run migrations
npm run db:migrate:up

# Rollback
npm run db:migrate:down
```

### Production

```bash
# Backup first
docker exec ai-seo-supabase-db pg_dump -U postgres ai_seo_os > backup_$(date +%Y%m%d).sql

# Run migrations
npm run db:migrate:up:production

# Verify
npm run db:verify
```

---

## Monitoring & Logging

### Docker Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f worker-main

# View last 100 lines
docker-compose logs --tail=100 worker-ai
```

### Kubernetes Logs

```bash
# Get pod logs
kubectl logs -f deployment/ai-seo-os-web -n ai-seo-os

# Get previous container logs
kubectl logs -f deployment/ai-seo-os-web -n ai-seo-os --previous

# Stream logs from all pods
kubectl logs -f -l app=ai-seo-os-web -n ai-seo-os
```

### Prometheus Metrics

Access Prometheus at: http://localhost:9090 (Docker) or via port-forward (K8s)

```bash
# Port forward for K8s
kubectl port-forward svc/prometheus 9090:9090 -n ai-seo-os
```

### Grafana Dashboards

Access Grafana at: http://localhost:3001 (Docker)

Default credentials: admin/admin

Pre-configured dashboards:
- System Overview
- API Performance
- Worker Queue Status
- AI Usage Metrics

---

## Backup & Recovery

### Database Backup

```bash
# Automated daily backup (cron)
0 1 * * * docker exec ai-seo-supabase-db pg_dump -U postgres ai_seo_os | gzip > /backups/ai_seo_os_$(date +\%Y\%m\%d).sql.gz

# Manual backup
docker exec ai-seo-supabase-db pg_dump -U postgres ai_seo_os > backup.sql
```

### Database Restore

```bash
# Restore from backup
docker exec -i ai-seo-supabase-db psql -U postgres ai_seo_os < backup.sql
```

### Kubernetes Backup (Velero)

```bash
# Install Velero
velero install \
  --provider aws \
  --bucket ai-seo-os-backups \
  --secret-file ./credentials-velero \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1

# Create backup
velero backup create ai-seo-os-backup --include-namespaces ai-seo-os

# Restore from backup
velero restore create --from-backup ai-seo-os-backup
```

---

## Scaling

### Horizontal Scaling (Docker)

```bash
# Scale workers
docker-compose up -d --scale worker-main=5 --scale worker-ai=3
```

### Horizontal Scaling (Kubernetes)

```bash
# Scale deployment
kubectl scale deployment ai-seo-os-web --replicas=5 -n ai-seo-os

# Or use HPA (automatic)
kubectl autoscale deployment ai-seo-os-web \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n ai-seo-os
```

### Vertical Scaling

Update resource limits in deployment manifests:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check if database is running
docker-compose ps supabase-db

# Check logs
docker-compose logs supabase-db

# Verify connection
docker exec -it ai-seo-supabase-db psql -U postgres -c "\l"
```

#### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose logs worker-main

# Restart worker
docker-compose restart worker-main

# Check Redis connection
docker-compose exec redis redis-cli ping
```

#### AI API Rate Limit

```bash
# Check AI worker logs
docker-compose logs worker-ai

# Implement exponential backoff in code
# Consider upgrading API tier
```

#### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart

# Increase memory limits in docker-compose.yml
```

### Debug Mode

Enable debug logging:

```bash
# Docker
LOG_LEVEL=debug docker-compose up

# Kubernetes
kubectl set env deployment/ai-seo-os-web LOG_LEVEL=debug -n ai-seo-os
```

---

## Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS
- [ ] Restrict database access
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Network policies (K8s)
- [ ] Pod security policies (K8s)

---

## Cost Estimation

### Free Tier (Development)
| Service | Cost |
|---------|------|
| Vercel Free | $0 |
| Docker Local | $0 |
| Gemini API Free Tier | $0 |
| **Total** | **$0** |

### Production (Small)
| Service | Cost/Month |
|---------|------------|
| Vercel Pro | $20 |
| VPS (Hetzner) | €5.35 (~$6) |
| Gemini API | $50-100 |
| Domain | $12/year |
| **Total** | **~$80-130** |

### Production (Medium)
| Service | Cost/Month |
|---------|------------|
| Vercel Pro | $20 |
| VPS (2x) | $40 |
| Managed Postgres | $50 |
| Managed Redis | $20 |
| Gemini API | $200-500 |
| Monitoring | $30 |
| **Total** | **~$360-660** |

---

## Support

For deployment issues:
1. Check logs: `docker-compose logs` or `kubectl logs`
2. Review documentation in `/docs`
3. Open an issue on GitHub
4. Join our Discord community