import type { Intent, MotorIntent } from '../types/intent.js';
import type { LogicStructure } from './logicBuilder.js';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateSafety(intent: Intent, logic: LogicStructure): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = logic.instructions
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const coils = new Set<string>();
  const contacts = new Set<string>();

  for (const line of lines) {
    const parts = line.split(' ');
    if (parts.length !== 2) continue;
    const [op, addr] = parts;

    if (op === 'OUT') {
      if (coils.has(addr)) {
        errors.push(`Duplicate coil: ${addr}`);
      }
      coils.add(addr);
    } else if (op === 'LD' || op === 'ANI') {
      contacts.add(addr);
    }
  }

  for (const coil of coils) {
    if (contacts.has(coil)) {
      errors.push(`Output ${coil} used as input`);
    }
  }

  if (intent.type === 'motor_control') {
    const motorIntent = intent as unknown as MotorIntent;
    const emergencyAddr = motorIntent.emergency;
    if (!contacts.has(emergencyAddr)) {
      errors.push('Emergency stop missing');
    }

    const hasEmergencyANI = lines.some(
      (line) => line.startsWith('ANI ') && line.includes(motorIntent.emergency)
    );
    if (!hasEmergencyANI) {
      errors.push('Emergency stop not properly configured');
    }
  }

  return { valid: errors.length === 0, warnings, errors };
}
