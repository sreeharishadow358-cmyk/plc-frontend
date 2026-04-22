export interface Intent {
  type: string;
  [key: string]: unknown;
}

export interface MotorIntent {
  type: "motor_control";
  start: string;
  stop: string;
  emergency: string;
  output: string;
}

export interface SimpleSwitchIntent {
  type: "simple_switch";
  input: string;
  output: string;
}
