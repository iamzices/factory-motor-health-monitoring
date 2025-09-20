import express from "express";
import Joi from "joi";
import RabbitMQClient from "./rabbitmq.js";
import { RULES, validateData, checkThreshold } from "./rules.js";

// --- configs ---
const PORT = 3000;
const RABBITMQ_URL = "amqp://test:test@localhost:5672/";
const ALERTS_EXCHANGE = "motor.alerts";

// --- rabbitmq client ---
const rabbitMqClient = new RabbitMQClient(RABBITMQ_URL, ALERTS_EXCHANGE);

// --- request body ---
const sensorSchema = Joi.object({
    motor_id: Joi.string().required(),
    timestamp: Joi.string().isoDate().required(),
    temperature_c: Joi.number().required(),
    vibration_g: Joi.number().required(),
})

// --- helpers ---
function buildAlert(body, alertType){
    const entry = Object.entries(RULES).find(([, rule]) => rule.alertType === alertType);
    const [fieldKey, rule] = entry;
    return {
        motor_id: body.motor_id,
        timestamp: body.timestamp,
        sensor_type: rule.sensorType,
        value: body[fieldKey],
        threshold: rule.thresholdMax, 
        alert_type: alertType,
    }
}

function sendResponse(res, { status = 200, accepted = true, errors = [], triggers = [] }) {
    return res.status(status).json({ accepted, errors, triggers })
}

// --- api setup ---
const app = express();
app.use(express.json());

// --- routes ---
app.post("/api/sensor", (req, res) => {
    try {
        console.log(`[API] Received sensor data body=${JSON.stringify(req.body)}`);

        // 1. check request schema 
        const schemaValidationResult = sensorSchema.validate(req.body);
        if (schemaValidationResult.error) {
            console.warn(`[API] Schema validation failed body=${JSON.stringify(req.body)}`);
            return sendResponse(res, {
                status: 400,
                accepted: false,
                errors: ["Invalid request body"],
            });
        }

        // 2. validate bounds
        const errors = validateData(req.body);
        if (errors.length > 0) {
            console.warn(`[API] Domain validation failed errors=${errors.join(",")} body=${JSON.stringify(req.body)}`);
            return sendResponse(res, {
                status: 422,
                accepted: false,
                errors,
            });
        }

        // 3. check threshold for alerts
        const triggers = checkThreshold(req.body);
        if (triggers.length > 0) {
            console.log(`[Alerts] Triggered=${triggers.join(",")} body=${JSON.stringify(req.body)}`);
            for (const type of triggers) {
                const alert = buildAlert(req.body, type);
                rabbitMqClient.publish(`alert.${alert.sensor_type}`, alert);
            }
        }

        // 4. return valid response 
        return sendResponse(res, { status: 201, triggers });

    } catch (error) {
        console.error("Error processing [API] request:", error);
        return sendResponse(res, {
            status: 500,
            accepted: false,
            errors: ["Internal server error"],
        })
    }
});

// --- start server ---
(async () => {
    try {
        await rabbitMqClient.connect();
        const server = app.listen(PORT, () => {
            console.log(`[Server] Running on port ${PORT}`);
        });

        const shutdown = async (sig) => {
            console.log(`[Server] Shutting down...`);
            try { await rabbitMqClient.close(); } 
            finally { server.close(() => process.exit(0)); }
        };

        ["SIGINT", "SIGTERM"].forEach(sig => process.once(sig, () => void shutdown(sig)));
    } catch (error) {
        console.error("[Server] Startup failed:", error, "exiting...");
        process.exit(1);
    }
})();