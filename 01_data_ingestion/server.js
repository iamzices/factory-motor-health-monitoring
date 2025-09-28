import { randomUUID } from "node:crypto";
import express from "express";
import Joi from "joi";
import RabbitMQClient from "./rabbitmq.js";
import { RULES, checkThreshold } from "./rules.js";

// --- configs ---
const PORT = 3000;
const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://rabbitmq:rabbitmq@localhost:5672/";
const ALERTS_EXCHANGE = "motor.alerts";

// --- request body ---
const sensorSchema = Joi.object({
  motor_id: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  temperature_c: Joi.number().required().min(RULES.temperature_c.validateMin),
  vibration_g: Joi.number().required().min(RULES.vibration_g.validateMin),
}).required();

// --- helpers ---
function buildAlert(body, fieldKey) {
  return {
    motor_id: body.motor_id,
    timestamp: body.timestamp,
    sensor_type: fieldKey,
    value: body[fieldKey],
  };
}

// --- api setup ---
const app = express();
app.use(express.json());

// --- rabbitmq client ---
const rabbitMqClient = new RabbitMQClient(RABBITMQ_URL, ALERTS_EXCHANGE);

// --- routes ---
app.post("/api/sensor", async (req, res) => {
  const id = randomUUID(); // generate unique ID for tracking in logs
  try {
    console.log(`[API] (id=${id}) Received sensor data body=${JSON.stringify(req.body)}`);

    // 1. check request schema
    const { error: validationError, value: data } = sensorSchema.validate(req.body);
    if (validationError) {
      console.warn(`[API] Schema validation failed (id=${id}): ${validationError.message}`);
      return res.status(400).json({ error: validationError.message });
    }

    // 2. check threshold for alerts
    const triggers = checkThreshold(data);
    if (triggers.length > 0) {
      console.log(`[Alerts] Triggered=${triggers.join(",")} (id=${id})`);
      let publishErrors = false;
      for (const fieldKey of triggers) {
        const alert = buildAlert(data, fieldKey);
        const published = rabbitMqClient.publish(`alert.${fieldKey}`, alert, id);
        if (!published) publishErrors = true;
      }
      if (publishErrors) {
        console.error(`[API] Failed to publish one or more alerts (id=${id})`);
        return res.status(500).end();
      }
    }

    // 3. return valid response
    return res.status(201).end();

  } catch (error) {
    console.error(`[API] Error processing request (id=${id}):`, error);
    return res.status(500).end();
  }
});

// --- error handler ---
app.use((err, req, res, next) => {
  console.warn(`[API] Rejected request: ${err.message}`);
  res.status(err.status ?? 500).json({ error: err.expose ? err.message : "Internal server error" });
});

// --- start server ---
(async () => {
  let server;
  try {
    await rabbitMqClient.connect();
    server = app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Server] Startup failed:", error, "exiting...");
    process.exit(1);
  }

  // Graceful shutdown handler
  const shutdown = async (signal) => {
    console.log(`[Server] ${signal} received, shutting down...`);
    server.close();
    await rabbitMqClient.close();
    process.exit(0);
  };

  // Register shutdown signals
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
})();
