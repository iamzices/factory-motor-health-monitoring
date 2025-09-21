SELECT motor_id, DATE(timestamp AT TIME ZONE 'UTC') AS alert_date, COUNT(*) AS count
FROM motor_alerts
WHERE timestamp >= :start AND timestamp < :end
GROUP BY motor_id, DATE(timestamp AT TIME ZONE 'UTC')
ORDER BY motor_id, alert_date;