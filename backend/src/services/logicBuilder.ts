import { Intent, MotorIntent, SimpleSwitchIntent } from '../types/intent.js';

export interface LogicStructure {
  instructions: string;
}

export function buildLogic(intent: Intent): LogicStructure {
  switch (intent.type) {
    case 'motor_control':
      return buildMotorControl(intent as unknown as MotorIntent);
    case 'simple_switch':
      return buildSimpleSwitch(intent as unknown as SimpleSwitchIntent);
    default:
      throw new Error(`Unsupported intent type: ${intent.type}`);
  }
}

function buildMotorControl(intent: MotorIntent): LogicStructure {
  const { start, stop, emergency, output } = intent;
  const instructions = [
    `LD ${start}`,
    `ANI ${emergency}`,
    `ANI ${stop}`,
    `OUT ${output}`,
  ].join('\n');

  return { instructions };
}

function buildSimpleSwitch(intent: SimpleSwitchIntent): LogicStructure {
  const { input, output } = intent;
  const instructions = [
    `LD ${input}`,
    `OUT ${output}`,
  ].join('\n');

  return { instructions };
}
