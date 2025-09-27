from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import create_engine, text


# --- alert model ---
class Alert(BaseModel):
    motor_id: str
    timestamp: datetime
    sensor_type: str
    value: float


# --- database client ---
class PostgresClient:
    """Client for inserting alerts to Postgres DB"""
    def __init__(self, url: str, table_name: str):
        self.engine = create_engine(url)
        self.table_name = table_name

    def insert_alert(self, alert: Alert):
        sql = text(f"""
                   INSERT INTO {self.table_name}
                   (motor_id, sensor_type, timestamp, value)
                   VALUES
                   (:motor_id, :sensor_type, :timestamp, :value)
                   """)
        try:
            with self.engine.begin() as conn:
                conn.execute(sql, alert.model_dump())
        except Exception as e:
            raise RuntimeError(f"Database error while inserting alert: {e}")
