CREATE TABLE motor_alerts (
    id SERIAL PRIMARY KEY,
    motor_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    value NUMERIC NOT NULL,
    alert_type TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (alert_type IN ('ACTIVE','INACTIVE'))
);

CREATE INDEX idx_motor_alerts_motor_id_timestamp ON motor_alerts (motor_id, timestamp DESC);
CREATE INDEX idx_motor_alerts_timestamp ON motor_alerts (timestamp);
