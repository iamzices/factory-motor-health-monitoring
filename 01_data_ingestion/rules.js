// --- rule values ---
export const RULES = {
  vibration_g: {
    validateMin: 0,
    thresholdMax: 2.5,
  },
  temperature_c: {
    validateMin: -50,
    thresholdMax: 80,
  },
}

// --- rule helpers ---
/**
 * Checks if sensor data exceeds threshold values
 */
export function checkThreshold(data) {
  const triggers = [];
  for (const [field, rule] of Object.entries(RULES)) {
    if (data[field] > rule.thresholdMax) {
      triggers.push(field);
    }
  }
  return triggers;
}