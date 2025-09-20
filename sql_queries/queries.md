### create table motor_alerts
```sql
CREATE TABLE motor_alerts (
    id SERIAL PRIMARY KEY,
    motor_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    value NUMERIC NOT NULL,
    alert_type TEXT NOT NULL,
);
```

### query recent 5 alerts for a given motor
```sql
SELECT id, motor_id, sensor_type, timestamp, value, alert_type
FROM motor_alerts
WHERE motor_id = :motorId
ORDER BY timestamp DESC 
LIMIT 5;
```

### query daily alert counts per motor 
```sql
SELECT motor_id, DATE(timestamp) AS alert_date, COUNT(*) AS count
FROM motor_alerts 
WHERE timestamp >= :start AND timestamp <= :end
GROUP BY motor_id, DATE(timestamp)
```