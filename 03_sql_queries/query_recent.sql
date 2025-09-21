SELECT id, motor_id, sensor_type, timestamp, value, alert_type
FROM motor_alerts
WHERE motor_id = :motor_id
ORDER BY timestamp DESC
LIMIT 5;