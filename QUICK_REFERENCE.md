# ShopSphere – Quick Reference Guide

> Keep this doc open while you work. It lists the fastest path to spin up services, run everyday flows, and diagnose trouble. Deep dives live in `/docs`.

## 1. Prerequisites & Workspace Setup

| Tool | Minimum | Notes |
| --- | --- | --- |
| Node.js | 18.x | Required for every microservice |
| npm | 9+ | Ships with Node 18 |
| Docker Desktop | Latest | Runs MongoDB, Redis, and optional service stack |
| MongoDB Shell (`mongosh`) | Latest | Inspect dev data |
| Redis CLI (`redis-cli`) | Latest | Debug rate limiter & notification queue |
| Stripe / PayPal / M-Pesa / Brevo creds | Active accounts | Store in per-service `.env` files (never commit) |

```bash
git clone https://github.com/oyugijr/shop_sphere.git
cd shop_sphere
cp .env.example .env   # then populate secrets
```

## 2. Service Bootstrap Cheatsheet

### Docker-first (recommended)

```bash
docker compose up -d mongodb redis
# bring all services up (feel free to trim the list during dev)
docker compose up -d api-gateway user-service product-service order-service \
  notification-service cart-service payment-service
```

### Local dev with live reload

```bash
for svc in api-gateway user-service product-service order-service \
           notification-service cart-service payment-service; do
  (cd $svc && npm install)
done

docker compose up -d mongodb redis

# Run each service (one terminal per service for nodemon-style reload)
cd user-service && npm run dev
cd product-service && npm run dev
# ...repeat for remaining services
```

| Service | Port | Dev command |
| --- | --- | --- |
| API Gateway | 3000 | `cd api-gateway && npm run dev` |
| User Service | 5001 | `cd user-service && npm run dev` |
| Product Service | 5002 | `cd product-service && npm run dev` |
| Order Service | 5003 | `cd order-service && npm run dev` |
| Notification Service | 5004 | `cd notification-service && npm run dev` |
| Payment Service | 5005 | `cd payment-service && npm run dev` |
| Cart Service | 5006 | `cd cart-service && npm run dev` |

## 3. Environment Variables Snapshot

| Area | Required keys |
| --- | --- |
| Core | `JWT_SECRET`, `MONGO_URI`, `ALLOWED_ORIGINS`, `NODE_ENV` |
| Redis / Queues | `REDIS_HOST`, `REDIS_PORT`, `REDIS_URL` |
| Product Service | `PRODUCT_SERVICE_URL`, `PRODUCT_SERVICE_PORT` |
| Cart Service | `PRODUCT_SERVICE_URL`, `JWT_SECRET` |
| Payment – Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Payment – PayPal | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` |
| Payment – M-Pesa | `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL` |
| Notification | `BREVO_API_KEY`, optional `TWILIO_*`, `FAST2SMS_API_KEY` |

> Tip: keep service-specific `.env` files inside each folder; the root `.env` powers docker-compose only.

## 4. Everyday API Workflows

Export a token once per session:

```bash
AUTH_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"securepass123"}' | jq -r '.token')
```

### 4.1 User auth

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","password":"StrongPass1!"}'

# Fetch profile
curl -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:3000/api/users/me
```

### 4.2 Product CRUD

```bash
# Create product (admin token required)
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","description":"RTX 4080","price":1999.99,"stock":10,"category":"electronics"}'

# List with pagination & sorting
curl "http://localhost:3000/api/products?page=1&limit=20&sortBy=price&sortOrder=asc"
```

### 4.3 Cart flows

```bash
# Add to cart
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"<PRODUCT_ID>","quantity":2,"price":999.99,"name":"Laptop"}'

# Update quantity
curl -X PUT http://localhost:3000/api/cart/items/<PRODUCT_ID> \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":3}'

# Retrieve cart
curl -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:3000/api/cart
```

### 4.4 Orders

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "items":[{"productId":"<PRODUCT_ID>","quantity":2,"price":999.99,"name":"Laptop"}],
        "totalPrice":1999.98,
        "shippingAddress":{
          "fullName":"Jane Doe",
          "phoneNumber":"+15555555555",
          "street":"1 Market St",
          "city":"SF",
          "state":"CA",
          "zipCode":"94103",
          "country":"USA"
        },
        "paymentMethod":"stripe"
      }'
```

### 4.5 Payments

```bash
# Stripe payment intent
curl -X POST http://localhost:5005/api/payments/intent \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_ID>","amount":199998,"currency":"usd"}'

# PayPal order create
curl -X POST http://localhost:5005/api/paypal/create \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_ID>","amount":1999.98,"currency":"USD"}'

# M-Pesa STK push
curl -X POST http://localhost:5005/api/mpesa/initiate \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_ID>","amount":1999.98,"phoneNumber":"254712345678"}'
```

### 4.6 Notifications

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"email","contact":"user@example.com","message":"Order shipped"}'
```

## 5. Testing & Quality Gates

| Scope | Command |
| --- | --- |
| API Gateway middleware tests | `cd api-gateway && npm test` |
| User/Product/Order services | `cd <service> && npm test` |
| Cart service coverage | `cd cart-service && npm run test -- --coverage` |
| Payment service suites (Stripe/PayPal/M-Pesa) | `cd payment-service && npm test` |
| Notification worker tests | `cd notification-service && npm test` |
| Linting (where configured) | `cd <service> && npm run lint` |

> Goal: raise coverage ≥80% and add integration/E2E runners (currently TODO).

## 6. Troubleshooting Quick Hits

| Symptom | Checks |
| --- | --- |
| Service 404/connection refused | `curl http://localhost:<port>/health`; verify dev server running |
| JWT rejected | Ensure `JWT_SECRET` matches across services and header uses `Authorization: Bearer <token>` |
| Cart rejects item | Confirm product exists and has stock via `GET /api/products/:id` |
| Payment webhooks failing | Inspect `payment-service` logs, verify `STRIPE_WEBHOOK_SECRET` + raw body middleware |
| Notification missing | Check Redis (`docker exec shopsphere-redis redis-cli monitor`) and worker logs |
| Mongo errors | Confirm `MONGO_URI` matches docker-compose credentials and Mongo container is healthy |

Handy commands:

```bash
docker compose ps
docker compose logs -f <service>
docker logs <container> --tail 200
docker exec -it shopsphere-mongo mongosh
docker exec -it shopsphere-redis redis-cli PING
```

## 7. Operations & Deployment

- Build & push images: `docker compose build && docker compose push`
- Restart single service: `docker compose restart cart-service`
- Tail production-like logs locally: `docker compose logs -f payment-service`
- Reset local data:

  ```bash
  docker exec shopsphere-mongo mongosh --eval 'db.dropDatabase()'
  docker exec shopsphere-redis redis-cli FLUSHALL
  ```

- Health endpoints to monitor:
  - `GET http://localhost:3000/health` (gateway)
  - `GET http://localhost:5005/health` (payment)
  - `GET http://localhost:5006/health` (cart)

## 8. Active Hardening Focus (Q1 2026)

1. **Cart Service** – Guest cart merge flow, TTL cleanup worker, tracing/observability.
2. **Payment Service** – Reconciliation + settlement reporting, webhook alerting, rate-limit tuning.
3. **Order Service** – Enforce stock validation + transactional writes with Product Service.
4. **Testing & CI** – Build integration/E2E suites and GitHub Actions pipeline.
5. **Observability** – Prometheus metrics + Grafana dashboards for gateway, cart, payment latency.

---

**Last Updated:** January 4, 2026  
**Maintainer:** ShopSphere Core Team
