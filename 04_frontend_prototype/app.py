import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text


POSTGRES_URL = os.environ.get("POSTGRES_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
ALERTS_TABLE = "motor_alerts"

engine = create_engine(POSTGRES_URL)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/active-alerts")
def get_active_alerts():
    sql = text(f"""
        SELECT id, motor_id, sensor_type, timestamp, value, alert_type
        FROM {ALERTS_TABLE}
        WHERE alert_type = 'ACTIVE'
        ORDER BY timestamp DESC
    """)
    with engine.connect() as conn:
        result = conn.execute(sql)
        rows = result.fetchall()
        return [dict(row._mapping) for row in rows]


@app.get("/daily-counts")
def get_daily_counts():
    sql = text(f"""
        SELECT DATE(timestamp AT TIME ZONE 'UTC') AS alert_date, COUNT(*) AS count
        FROM {ALERTS_TABLE}
        GROUP BY alert_date
        ORDER BY alert_date
    """)
    with engine.connect() as conn:
        result = conn.execute(sql)
        rows = result.fetchall()
        return [{"date": str(row.alert_date), "count": row.count} for row in rows]


def main():
    uvicorn.run(app, host="localhost", port=8000)


if __name__ == "__main__":
    main()
