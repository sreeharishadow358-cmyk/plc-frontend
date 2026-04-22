import { LadderBlock } from '../types/ladder.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fixedResponse?: {
    ladder: LadderBlock[];
    explanation: string;
    instructionList: string;
  };
}

const VALID_BLOCK_TYPES = ['contact', 'contact_nc', 'coil', 'timer', 'counter'] as const;
type ValidBlockType = (typeof VALID_BLOCK_TYPES)[number];

const ADDRESS_PATTERNS = {
  input: /^X([0-7]{1,3})$/,
  output: /^Y([0-7]{1,3})$/,
  memory: /^M(\d+)$/,
  register: /^D(\d+)$/,
  timer: /^T(\d+)$/,
  counter: /^C(\d+)$/,
};

type FixableBlock = Partial<LadderBlock> & Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isValidBlockType(value: unknown): value is ValidBlockType {
  return typeof value === 'string' && VALID_BLOCK_TYPES.includes(value as ValidBlockType);
}

function normalizeBlock(block: FixableBlock): LadderBlock | null {
  if (
    typeof block.id !== 'string' ||
    !isValidBlockType(block.type) ||
    typeof block.label !== 'string'
  ) {
    return null;
  }

  return {
    id: block.id.trim(),
    type: block.type,
    label: block.label.trim(),
  };
}

export function isValidAddress(address: string): boolean {
  const inputMatch = address.match(ADDRESS_PATTERNS.input);
  if (inputMatch) {
    return parseInt(inputMatch[1], 8) <= parseInt('377', 8);
  }

  const outputMatch = address.match(ADDRESS_PATTERNS.output);
  if (outputMatch) {
    return parseInt(outputMatch[1], 8) <= parseInt('377', 8);
  }

  const memoryMatch = address.match(ADDRESS_PATTERNS.memory);
  if (memoryMatch) {
    return Number(memoryMatch[1]) <= 9999;
  }

  const registerMatch = address.match(ADDRESS_PATTERNS.register);
  if (registerMatch) {
    return Number(registerMatch[1]) <= 9999;
  }

  const timerMatch = address.match(ADDRESS_PATTERNS.timer);
  if (timerMatch) {
    return Number(timerMatch[1]) <= 255;
  }

  const counterMatch = address.match(ADDRESS_PATTERNS.counter);
  if (counterMatch) {
    return Number(counterMatch[1]) <= 255;
  }

  return false;
}

function validateLadderBlock(block: unknown, index: number): string[] {
  const errors: string[] = [];

  if (!isRecord(block)) {
    errors.push(`Block ${index}: Not an object`);
    return errors;
  }

  if (!isValidBlockType(block.type)) {
    errors.push(
      `Block ${index}: Invalid type "${block.type}". Must be one of: ${VALID_BLOCK_TYPES.join(', ')}`
    );
  }

  if (typeof block.label !== 'string') {
    errors.push(`Block ${index}: Missing or invalid label`);
  } else if (block.label.trim().length === 0) {
    errors.push(`Block ${index}: Label cannot be empty`);
  } else if (!isValidAddress(block.label.trim())) {
    errors.push(`Block ${index}: Invalid PLC address "${block.label}"`);
  }

  if (block.id !== undefined && typeof block.id !== 'string') {
    errors.push(`Block ${index}: Invalid id - must be a string`);
  }

  return errors;
}

function validateLadderStructure(ladder: unknown[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (ladder.length === 0) {
    warnings.push('Ladder is empty - at least one block is recommended');
  }
  if (ladder.length > 20) {
    errors.push(`Ladder has ${ladder.length} blocks - exceeds maximum of 20`);
  }

  const coilCount = ladder.filter(
    (block) => isRecord(block) && block.type === 'coil'
  ).length;
  if (coilCount === 0) {
    errors.push('Ladder must contain at least one coil (output)');
  }
  if (coilCount > 1) {
    warnings.push(`Ladder has ${coilCount} coils - typically should be 1 per rung`);
  }

  const lastBlock = ladder[ladder.length - 1];
  if (isRecord(lastBlock) && lastBlock.type !== 'coil') {
    errors.push('Last block in ladder must be a coil (output)');
  }

  let seenCoil = false;
  for (let i = 0; i < ladder.length; i++) {
    const block = ladder[i];
    if (!isRecord(block)) {
      continue;
    }

    if (block.type === 'coil') {
      seenCoil = true;
    } else if (seenCoil && (block.type === 'contact' || block.type === 'contact_nc')) {
      errors.push(`Block ${i}: Contact found after coil - wrong order`);
    }
  }

  return { errors, warnings };
}

export function validateResponse(response: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(response)) {
    return {
      valid: false,
      errors: ['Response is not a valid object'],
      warnings: [],
    };
  }

  if (!Array.isArray(response.ladder)) {
    errors.push('Response missing "ladder" array');
  }
  if (typeof response.explanation !== 'string') {
    errors.push('Response missing or invalid "explanation" field');
  }
  if (typeof response.instructionList !== 'string') {
    errors.push('Response missing or invalid "instructionList" field');
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const ladder = response.ladder as unknown[];
  const explanation = response.explanation as string;
  const instructionList = response.instructionList as string;
  for (let i = 0; i < ladder.length; i++) {
    errors.push(...validateLadderBlock(ladder[i], i));
  }

  const structureValidation = validateLadderStructure(ladder);
  errors.push(...structureValidation.errors);
  warnings.push(...structureValidation.warnings);

  if (explanation.length < 10) {
    warnings.push('Explanation is very short - may lack helpful details');
  }
  if (explanation.length > 2000) {
    warnings.push('Explanation is very long - consider being more concise');
  }

  if (!instructionList.includes('END')) {
    warnings.push('Instruction list should end with "END"');
  }
  if (instructionList.length < 5) {
    warnings.push('Instruction list seems incomplete');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fixedResponse: errors.length === 0
      ? {
          ladder: response.ladder as LadderBlock[],
          explanation,
          instructionList,
        }
      : undefined,
  };
}
