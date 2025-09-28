# Factory Motor Health Monitoring

A tiny pipeline for factory motor monitoring with RabbitMQ.

![System Architecture](assets/architecture.png)

## Tasks

| Folder | Task |
|---|---|
| `01_data_ingestion/` | Sensor data ingestion API (Node.js) |
| `02_alert_processing/` | Alert processing service (Python) |
| `03_sql_queries/` | SQL schema and queries |
| `04_frontend_prototype/` | Dashboard prototype |

## Quick start

1. Start RabbitMQ and PostgreSQL, then install dependencies:
   ```bash
   make infra
   make install
   ```
2. Run each service in its own terminal:
   ```bash
   make ingestion
   make processor
   make dashboard
   ```
3. Open `04_frontend_prototype/index.html` in a browser.
4. Send sample data:
   ```bash
   make test
   ```

## Configuration

| Variable | Default |
|---|---|
| `RABBITMQ_URL` | `amqp://rabbitmq:rabbitmq@localhost:5672/` |
| `POSTGRES_URL` | `postgresql://postgres:postgres@localhost:5432/postgres` |

## API

### `POST /api/sensor` (port 3000)

```json
{
  "motor_id": "MTR-001",
  "timestamp": "2025-07-22T14:35:20Z",
  "temperature_c": 76.4,
  "vibration_g": 2.3
}
```

All fields required, `timestamp` is ISO 8601, unknown fields rejected. Invalid bodies return `400` with `{ "error": "<reason>" }`.

### Dashboard API (port 8000)

| Endpoint | Returns |
|---|---|
| `GET /active-alerts` | 100 most recent active alerts |
| `GET /daily-counts` | Alert count per UTC day |
