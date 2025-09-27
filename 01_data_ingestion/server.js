import express from "express";
import Joi from "joi";
import { v4 as uuidv4 } from 'uuid';
import RabbitMQClient from "./rabbitmq.js";
import { RULES, checkThreshold } from "./rules.js";

// --- configs ---
const PORT = 3000;
const RABBITMQ_URL = "amqp://rabbitmq:rabbitmq@localhost:5672/";
const ALERTS_EXCHANGE = "motor.alerts";

// --- request body ---
const sensorSchema = Joi.object({
  motor_id: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  temperature_c: Joi.number().required().greater(RULES.temperature_c.validateMin),
  vibration_g: Joi.number().required().greater(RULES.vibration_g.validateMin),
}).required().unknown(false)

// --- helpers ---
function buildAlert(body, fieldKey){
  return {
    motor_id: body.motor_id,
    timestamp: body.timestamp,
    sensor_type: fieldKey,
    value: body[fieldKey],
  }
}

function sendResponse(res, { status = 200 }) {
  return res.status(status).end();
}

// --- api setup ---
const app = express();
app.use(express.json());

// --- rabbitmq client ---
const rabbitMqClient = new RabbitMQClient(RABBITMQ_URL, ALERTS_EXCHANGE);

// --- routes ---
app.post("/api/sensor", async (req, res) => {
  const id = uuidv4(); // generate unique ID for tracking in logs
  try {
    console.log(`[API] (id=${id}) Received sensor data body=${JSON.stringify(req.body)}`);

    // 1. check request schema 
    const schemaValidationResult = sensorSchema.validate(req.body);
    if (schemaValidationResult.error) {
      console.warn(`[API] Schema validation failed (id=${id})`);
      return sendResponse(res, {
        status: 400,
      });
    }

    // 2. check threshold for alerts
    const triggers = checkThreshold(req.body);
    if (triggers.length > 0) {
      console.log(`[Alerts] Triggered=${triggers.join(",")} (id=${id})`);
      let publishErrors = false;
      for (const fieldKey of triggers) {
        const alert = buildAlert(req.body, fieldKey);
        const published = rabbitMqClient.publish(`alert.${fieldKey}`, alert, id);
        if (!published) publishErrors = true;
      }
      if (publishErrors) {
        console.error(`[API] Failed to publish one or more alerts (id=${id})`);
        throw new Error();
      }
    }

    // 3. return valid response 
    return sendResponse(res, { status: 201 });

  } catch (error) {
    console.error(`[API] Error processing request (id=${id}):`, error);
    return sendResponse(res, {
      status: 500
    })
  }
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
    console.log(`[Server] Shutting down...`);
    server.close();
    await rabbitMqClient.close();
    process.exit(0);
  };
  
  // Register shutdown signals
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();