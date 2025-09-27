# Factory Motor Health Monitoring 

A tiny end-to-end pipeline that ingests sensor readings, raises alerts via RabbitMQ, persists them in Postgres, and exposes an analytics API + HTML dashboard. Architecture: **Node ingestion → RabbitMQ → Python alert processor → Postgres → FastAPI (+ static dashboard)**.

## Quick start

```bash
# 1) RabbitMQ + PostgreSQL DB setup (Uses Docker)
make setup

# 2) Install dependencies
make setup1     # Node.js 
make setup2     # Python 
make setup4     # FastAPI

# 3) Run services
make 1          # Node ingestion API on http://localhost:3000
make 2          # Python alert processor (RabbitMQ -> Postgres)
make app4       # Analytics API on http://localhost:8000
```

View the dashboard at `04_frontend_prototype/index.html`

### Send sample data to Node.js service

```bash
pytest
```
