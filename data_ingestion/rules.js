// --- rule values ---
export const RULES = {
    vibration_g: {
        validateMin: 0,
        thresholdMax: 2.5,
        sensorType: "vibration",
        alertType: "HIGH_VIBRATION",
    },
    temperature_c: {
        validateMin: -50,
        thresholdMax: 80,
        sensorType: "temperature",
        alertType: "HIGH_TEMPERATURE",
    },
}

// --- rule helpers ---
export function validateData(data) {
    const errors = [];
    for (const [field, rule] of Object.entries(RULES)) {
        if (data[field] <= rule.validateMin) {
            errors.push(`${field} must be > ${rule.validateMin}`);
        }
    }
    return errors;
}

export function checkThreshold(data) {
    const triggers = [];
    for (const [field, rule] of Object.entries(RULES)) {
        if (data[field] > rule.thresholdMax) {
            triggers.push(rule.alertType);
        }
    }
    return triggers;
}