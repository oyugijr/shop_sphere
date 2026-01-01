# ShopSphere Monitoring and Observability Guide

This guide covers monitoring, logging, and observability best practices for ShopSphere in production.

## Table of Contents

1. [Overview](#overview)
2. [Health Checks](#health-checks)
3. [Logging](#logging)
4. [Metrics](#metrics)
5. [Distributed Tracing](#distributed-tracing)
6. [Alerting](#alerting)
7. [Monitoring Tools](#monitoring-tools)
8. [Dashboards](#dashboards)

---

## Overview

### The Three Pillars of Observability

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Metrics   │     │    Logs     │     │   Traces    │
│             │     │             │     │             │
│  Numbers &  │     │  Events &   │     │  Request    │
│  Trends     │     │  Context    │     │  Flow       │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Why Observability Matters:**
- Detect issues before users report them
- Understand system behavior under load
- Debug problems quickly
- Plan capacity and scaling
- Track SLAs and SLOs

---

## Health Checks

### Service Health Endpoints

Each service exposes a `/health` endpoint that returns service status.

**Current Implementation:**

```javascript
// src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };

  // Check database connection
  if (mongoose.connection.readyState === 1) {
    health.database = 'connected';
  } else {
    health.status = 'unhealthy';
    health.database = 'disconnected';
    return res.status(503).json(health);
  }

  res.json(health);
});

module.exports = router;
```

### Enhanced Health Checks

**Add detailed health checks:**

```javascript
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redis = require('redis');

// Simple health check
router.get('/health', async (req, res) => {
  const isHealthy = mongoose.connection.readyState === 1;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {},
  };

  // Database check
  try {
    await mongoose.connection.db.admin().ping();
    health.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // Redis check (if applicable)
  if (process.env.REDIS_URL) {
    const startTime = Date.now();
    try {
      const client = redis.createClient({ url: process.env.REDIS_URL });
      await client.connect();
      await client.ping();
      await client.quit();
      
      health.checks.redis = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      health.status = 'degraded';
      health.checks.redis = {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  // External service checks
  // Add checks for other dependencies

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

### Kubernetes Probes

**Configure liveness and readiness probes:**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  template:
    spec:
      containers:
      - name: user-service
        image: shopsphere-user-service:latest
        livenessProbe:
          httpGet:
            path: /health
            port: 5001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 5001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

---

## Logging

### Structured Logging with Winston

**Install Winston:**

```bash
npm install winston winston-daily-rotate-file
```

**Logger Configuration (`src/config/logger.js`):**

```javascript
const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

// Add colors
winston.addColors(customLevels.colors);

// Create logger
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'shopsphere-service',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file with rotation
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

module.exports = logger;
```

**Usage in Application:**

```javascript
const logger = require('./config/logger');

// Log at different levels
logger.info('User registered', { userId: user.id, email: user.email });
logger.warn('High memory usage detected', { usage: memoryUsage });
logger.error('Database connection failed', { error: error.message, stack: error.stack });
logger.debug('Processing order', { orderId, items: items.length });
```

### Request Logging Middleware

```javascript
// src/middlewares/requestLogger.js
const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger[logLevel]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

module.exports = requestLogger;
```

### Centralized Logging

**ELK Stack (Elasticsearch, Logstash, Kibana):**

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

**Send logs to Logstash:**

```javascript
// Add Logstash transport
const LogstashTransport = require('winston-logstash/lib/winston-logstash-latest');

logger.add(new LogstashTransport({
  port: 5000,
  host: 'logstash',
  node_name: process.env.SERVICE_NAME,
}));
```

---

## Metrics

### Prometheus Metrics

**Install Prometheus client:**

```bash
npm install prom-client
```

**Metrics Configuration (`src/config/metrics.js`):**

```javascript
const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  databaseQueryDuration,
};
```

**Metrics Middleware:**

```javascript
// src/middlewares/metricsMiddleware.js
const { httpRequestDuration, httpRequestTotal } = require('../config/metrics');

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });

  next();
};

module.exports = metricsMiddleware;
```

**Metrics Endpoint:**

```javascript
// src/routes/metricsRoutes.js
const express = require('express');
const router = express.Router();
const { register } = require('../config/metrics');

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = router;
```

**Prometheus Configuration (`prometheus.yml`):**

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'shopsphere-services'
    static_configs:
      - targets:
        - 'api-gateway:3000'
        - 'user-service:5001'
        - 'product-service:5002'
        - 'order-service:5003'
        - 'notification-service:5004'
    metrics_path: /metrics
```

---

## Distributed Tracing

### OpenTelemetry Implementation

**Install OpenTelemetry:**

```bash
npm install @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http
```

**Tracing Configuration (`src/config/tracing.js`):**

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: process.env.SERVICE_NAME || 'shopsphere-service',
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

module.exports = sdk;
```

**Jaeger Setup:**

```yaml
# docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # Jaeger UI
      - "4318:4318"    # OTLP HTTP receiver
    environment:
      - COLLECTOR_OTLP_ENABLED=true
```

---

## Alerting

### Alert Rules

**Prometheus Alert Rules (`alerts.yml`):**

```yaml
groups:
  - name: shopsphere_alerts
    interval: 30s
    rules:
      # Service Down Alert
      - alert: ServiceDown
        expr: up{job="shopsphere-services"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"

      # High Error Rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on {{ $labels.instance }}"
          description: "Error rate is {{ $value }} errors/sec"

      # High Response Time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time on {{ $labels.instance }}"
          description: "95th percentile response time is {{ $value }}s"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Available memory is below 10%"

      # Database Connection Issues
      - alert: DatabaseConnectionFailed
        expr: database_connection_status == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed on {{ $labels.instance }}"
          description: "Cannot connect to database"
```

### Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'team-notifications'

receivers:
  - name: 'team-notifications'
    email_configs:
      - to: 'team@shopsphere.com'
        from: 'alerts@shopsphere.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@shopsphere.com'
        auth_password: 'password'
    
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: 'ShopSphere Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

---

## Monitoring Tools

### Recommended Stack

```yaml
# monitoring-stack.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts.yml:/etc/prometheus/alerts.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3001:3000"
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
    ports:
      - "9093:9093"

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "4318:4318"

volumes:
  prometheus_data:
  grafana_data:
```

---

## Dashboards

### Grafana Dashboard Configuration

**Service Overview Dashboard:**

```json
{
  "dashboard": {
    "title": "ShopSphere Service Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Response Time (95th percentile)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "active_connections"
          }
        ]
      }
    ]
  }
}
```

### Key Metrics to Monitor

**Application Metrics:**
- Request rate (requests/second)
- Error rate (errors/second)
- Response time (p50, p95, p99)
- Active connections
- Queue length (for async operations)

**Infrastructure Metrics:**
- CPU usage (%)
- Memory usage (%)
- Disk I/O
- Network I/O
- Container restarts

**Database Metrics:**
- Query response time
- Connection pool usage
- Active connections
- Slow queries
- Database size

**Business Metrics:**
- User registrations
- Orders created
- Revenue
- Products viewed
- Cart abandonment rate

---

## Monitoring Checklist

### Setup Checklist

- [ ] Health check endpoints on all services
- [ ] Structured logging with Winston
- [ ] Centralized log aggregation (ELK/Loki)
- [ ] Prometheus metrics exposed
- [ ] Grafana dashboards created
- [ ] Alert rules configured
- [ ] Alertmanager notifications set up
- [ ] Distributed tracing with Jaeger
- [ ] Uptime monitoring
- [ ] Performance monitoring

### Daily Operations

- [ ] Check service health dashboards
- [ ] Review error logs
- [ ] Monitor resource usage
- [ ] Check alert status
- [ ] Review slow query logs

---

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [The Twelve-Factor App](https://12factor.net/)

---

**Need help with monitoring?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) or open an issue on GitHub.
