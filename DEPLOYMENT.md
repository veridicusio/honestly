# Deployment Guide

**Production deployment guide for the Honestly Truth Engine**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployments](#cloud-deployments)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers production deployment of the Honestly platform across different environments:

- **Docker Compose** — Quick production deployment
- **Kubernetes** — Scalable container orchestration
- **AWS/GCP/Azure** — Cloud-specific deployments
- **Bare Metal** — Direct server deployment

---

## Prerequisites

### Required Services

- **Neo4j 5.x** — Graph database
- **Redis** (optional) — Caching and rate limiting
- **PostgreSQL** (optional) — Relational data
- **Kafka** (optional) — Event streaming

### System Requirements

**Minimum:**
- 4 CPU cores
- 8 GB RAM
- 50 GB storage
- Ubuntu 20.04+ or similar

**Recommended:**
- 8 CPU cores
- 16 GB RAM
- 200 GB SSD storage
- Load balancer (for HA)

---

## Architecture

### Production Topology

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
│                  (NGINX/CloudFlare)                     │
└─────────────┬───────────────────────┬───────────────────┘
              │                       │
              ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐
│   API Server 1      │   │   API Server 2      │
│   (FastAPI)         │   │   (FastAPI)         │
└──────────┬──────────┘   └──────────┬──────────┘
           │                          │
           └────────────┬─────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
┌─────────────────┐         ┌─────────────────┐
│   Neo4j         │         │   Redis         │
│   (Cluster)     │         │   (Sentinel)    │
└─────────────────┘         └─────────────────┘
```

---

## Deployment Options

### 1. Docker Compose (Recommended for Start)

**Pros:**
- Easy setup
- Good for single-server deployments
- Quick to update

**Cons:**
- Limited scalability
- Single point of failure

**Best For:** Small to medium deployments, staging environments

---

### 2. Kubernetes

**Pros:**
- Horizontal scaling
- High availability
- Auto-healing
- Zero-downtime updates

**Cons:**
- Complex setup
- Higher resource overhead

**Best For:** Large deployments, enterprise use

---

### 3. Serverless (Partial)

**Pros:**
- Pay per use
- Auto-scaling
- No server management

**Cons:**
- Cold starts
- Vendor lock-in
- Limited for stateful services

**Best For:** ConductMe frontend, API endpoints with low latency requirements

---

## Docker Deployment

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    image: honestly/api:latest
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - NEO4J_URI=bolt://neo4j:7687
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=INFO
    env_file:
      - .env.production
    depends_on:
      - neo4j
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

  neo4j:
    image: neo4j:5
    restart: unless-stopped
    ports:
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/${NEO4J_PASSWORD}
      - NEO4J_dbms_memory_heap_max__size=2G
      - NEO4J_dbms_memory_pagecache_size=1G
    volumes:
      - neo4j-data:/data
      - neo4j-logs:/logs
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "${NEO4J_PASSWORD}", "RETURN 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api

volumes:
  neo4j-data:
  neo4j-logs:
  redis-data:
```

### Deploy

```bash
# 1. Set up environment
cp .env.example .env.production
nano .env.production  # Configure production values

# 2. Build images
docker-compose -f docker-compose.prod.yml build

# 3. Start services
docker-compose -f docker-compose.prod.yml up -d

# 4. Check health
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:8000/health/ready

# 5. View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

---

### Kubernetes Manifests

**Namespace:**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: honestly
```

**ConfigMap:**
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: honestly-config
  namespace: honestly
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "INFO"
  NEO4J_URI: "bolt://neo4j-service:7687"
  REDIS_URL: "redis://redis-service:6379"
```

**Secrets:**
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: honestly-secrets
  namespace: honestly
type: Opaque
stringData:
  NEO4J_PASSWORD: "your-secure-password"
  JWT_SECRET: "your-jwt-secret-32-chars-min"
  REDIS_PASSWORD: "your-redis-password"
```

**API Deployment:**
```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: honestly-api
  namespace: honestly
spec:
  replicas: 3
  selector:
    matchLabels:
      app: honestly-api
  template:
    metadata:
      labels:
        app: honestly-api
    spec:
      containers:
      - name: api
        image: honestly/api:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: honestly-config
        - secretRef:
            name: honestly-secrets
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: honestly-api-service
  namespace: honestly
spec:
  selector:
    app: honestly-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
```

**Ingress:**
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: honestly-ingress
  namespace: honestly
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.honestly.dev
    secretName: honestly-tls
  rules:
  - host: api.honestly.dev
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: honestly-api-service
            port:
              number: 80
```

---

### Deploy to Kubernetes

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets (use sealed secrets in production!)
kubectl apply -f k8s/secrets.yaml

# 3. Create config
kubectl apply -f k8s/configmap.yaml

# 4. Deploy Neo4j (use Helm for production)
helm install neo4j neo4j/neo4j \
  --namespace honestly \
  --set acceptLicenseAgreement=yes \
  --set neo4j.password=your-password

# 5. Deploy Redis (use Helm for production)
helm install redis bitnami/redis \
  --namespace honestly \
  --set auth.password=your-password

# 6. Deploy API
kubectl apply -f k8s/api-deployment.yaml

# 7. Deploy ingress
kubectl apply -f k8s/ingress.yaml

# 8. Check deployment
kubectl get pods -n honestly
kubectl get services -n honestly
kubectl get ingress -n honestly

# 9. View logs
kubectl logs -f -n honestly deployment/honestly-api
```

---

## Cloud Deployments

### AWS ECS

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name honestly/api

# 2. Build and push image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t honestly/api .
docker tag honestly/api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/honestly/api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/honestly/api:latest

# 3. Create task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# 4. Create service
aws ecs create-service --cli-input-json file://ecs-service.json
```

---

### GCP Cloud Run

```bash
# 1. Build image
gcloud builds submit --tag gcr.io/PROJECT-ID/honestly-api

# 2. Deploy
gcloud run deploy honestly-api \
  --image gcr.io/PROJECT-ID/honestly-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "ENVIRONMENT=production,NEO4J_URI=bolt://neo4j:7687" \
  --set-secrets "JWT_SECRET=jwt-secret:latest,NEO4J_PASSWORD=neo4j-password:latest"

# 3. Get URL
gcloud run services describe honestly-api --region us-central1 --format 'value(status.url)'
```

---

### Azure Container Apps

```bash
# 1. Create resource group
az group create --name honestly-rg --location eastus

# 2. Create container registry
az acr create --resource-group honestly-rg --name honestlyregistry --sku Basic

# 3. Build and push
az acr build --registry honestlyregistry --image honestly/api:latest .

# 4. Create container app environment
az containerapp env create \
  --name honestly-env \
  --resource-group honestly-rg \
  --location eastus

# 5. Deploy
az containerapp create \
  --name honestly-api \
  --resource-group honestly-rg \
  --environment honestly-env \
  --image honestlyregistry.azurecr.io/honestly/api:latest \
  --target-port 8000 \
  --ingress external \
  --env-vars "ENVIRONMENT=production"
```

---

## Configuration

### Environment Variables

**Required:**
```bash
# Database
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-secure-password

# Security
JWT_SECRET=your-32-character-secret-key-here
JWT_ALGORITHM=RS256
JWT_ISSUER=https://honestly.dev

# Server
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://honestly.dev,https://app.honestly.dev
```

**Optional:**
```bash
# Caching
REDIS_URL=redis://:password@redis:6379/0
CACHE_TTL=3600

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
PROMETHEUS_PORT=9090

# Features
ENABLE_KAFKA=true
KAFKA_BROKERS=kafka:9092
ENABLE_FAISS=true
```

---

### SSL/TLS Certificates

**Using Let's Encrypt:**
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.honestly.dev

# Auto-renewal (cron)
0 0 * * * certbot renew --quiet
```

**Using cert-manager (Kubernetes):**
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@honestly.dev
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

---

## Monitoring

### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
```

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'honestly-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'
```

---

### Logging

**Using Loki:**
```yaml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yaml:/etc/promtail/config.yml
```

---

## Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set security headers
- [ ] Review environment variables
- [ ] Scan images for vulnerabilities
- [ ] Set up secrets management (Vault/AWS Secrets Manager)

---

### Post-Deployment

- [ ] Test health endpoints
- [ ] Verify rate limiting works
- [ ] Check security headers
- [ ] Test SSL/TLS configuration
- [ ] Run security scan (OWASP ZAP)
- [ ] Verify backups are working
- [ ] Test disaster recovery
- [ ] Set up monitoring alerts
- [ ] Review logs for errors
- [ ] Document deployment

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs api
kubectl logs -f deployment/honestly-api

# Check health
curl http://localhost:8000/health/live

# Check environment
docker-compose exec api env | grep NEO4J
kubectl exec -it deployment/honestly-api -- env | grep NEO4J
```

---

### Connection Errors

```bash
# Test Neo4j connection
docker-compose exec api python -c "from neo4j import GraphDatabase; driver = GraphDatabase.driver('bolt://neo4j:7687', auth=('neo4j', 'password')); driver.verify_connectivity()"

# Test Redis connection
docker-compose exec api python -c "import redis; r = redis.Redis(host='redis', port=6379); print(r.ping())"
```

---

### High Memory Usage

```bash
# Check resource usage
docker stats

# Kubernetes
kubectl top pods -n honestly
kubectl top nodes

# Adjust limits in docker-compose.yml or k8s manifests
```

---

### SSL Certificate Issues

```bash
# Check certificate
openssl s_client -connect api.honestly.dev:443 -servername api.honestly.dev

# Test with curl
curl -vI https://api.honestly.dev

# Renew Let's Encrypt
certbot renew --dry-run
```

---

## Additional Resources

- [Production Readiness Checklist](PRODUCTION-READY.md)
- [Monitoring Guide](docs/monitoring.md)
- [Security Policy](SECURITY.md)
- [Resilience Guide](RESILIENCE.md)

---

<div align="center">

**Need Help?**

[GitHub Issues](https://github.com/veridicusio/honestly/issues) • [Documentation](DOCUMENTATION_INDEX.md) • [Security](SECURITY.md)

</div>
