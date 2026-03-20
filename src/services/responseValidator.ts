import { LadderBlock } from "@/types/ladder";

/**
 * Validation results for AI responses
 */
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

/**
 * Valid PLC instruction types and Mitsubishi addresses
 */
const VALID_BLOCK_TYPES = ["contact", "contact_nc", "coil", "timer", "counter"] as const;

// Mitsubishi PLC address patterns
const ADDRESS_PATTERNS = {
  input: /^X\d{1,3}$/,                // X0-X377 (1-3 digit addresses)
  output: /^Y\d{1,3}$/,               // Y0-Y377 (1-3 digit addresses)
  memory: /^M\d+$/,                   // M0-M9999
  register: /^D\d+$/,                 // D0-D9999
  timer: /^T\d+$/,                    // Timer
  counter: /^C\d+$/,                  // Counter
};

/**
 * Response Validator Service
 * 
 * Ensures AI-generated responses are:
 * 1. Valid JSON structure matching LadderBlock[] format
 * 2. Contain only valid PLC instruction types
 * 3. Use valid Mitsubishi addresses
 * 4. Follow ladder logic rules (contacts before coils, etc.)
 * 5. Don't exceed safe limits (max blocks, instruction length)
 * 
 * Can auto-fix common issues or report detailed validation errors.
 * 
 * @module responseValidator
 */

/**
 * Validates if an address is a valid Mitsubishi PLC address
 * 
 * @param address - Address string to validate (e.g., "X0", "Y42", "M100")
 * @returns true if address is valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  // Check each address type pattern
  return (
    ADDRESS_PATTERNS.input.test(address) ||
    ADDRESS_PATTERNS.output.test(address) ||
    ADDRESS_PATTERNS.memory.test(address) ||
    ADDRESS_PATTERNS.register.test(address) ||
    ADDRESS_PATTERNS.timer.test(address) ||
    ADDRESS_PATTERNS.counter.test(address)
  );
}

/**
 * Validates a single ladder block
 * 
 * @param block - Block to validate
 * @param index - Index in the ladder array
 * @returns Array of error messages (empty if valid)
 */
function validateLadderBlock(block: unknown, index: number): string[] {
  const errors: string[] = [];

  if (!block || typeof block !== "object") {
    errors.push(`Block ${index}: Not an object`);
    return errors;
  }

  const blockObj = block as Record<string, unknown>;

  // Check type
  if (!blockObj.type || !VALID_BLOCK_TYPES.includes(blockObj.type as any)) {
    errors.push(
      `Block ${index}: Invalid type "${blockObj.type}". Must be one of: ${VALID_BLOCK_TYPES.join(", ")}`
    );
  }

  // Check label
  if (!blockObj.label || typeof blockObj.label !== "string") {
    errors.push(`Block ${index}: Missing or invalid label`);
  } else if (blockObj.label.trim().length === 0) {
    errors.push(`Block ${index}: Label cannot be empty`);
  } else if (!isValidAddress(blockObj.label)) {
    errors.push(`Block ${index}: Invalid PLC address "${blockObj.label}"`);
  }

  // Check id (optional during validation, will be auto-generated if missing)
  if (blockObj.id !== undefined && typeof blockObj.id !== "string") {
    errors.push(`Block ${index}: Invalid id - must be a string`);
  }

  return errors;
}

/**
 * Validates ladder logic structure and rules
 * 
 * @param ladder - Array of blocks to validate
 * @returns Object with error and warning arrays
 */
function validateLadderStructure(ladder: unknown[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check size limits
  if (ladder.length === 0) {
    warnings.push("Ladder is empty - at least one block is recommended");
  }
  if (ladder.length > 20) {
    errors.push(`Ladder has ${ladder.length} blocks - exceeds maximum of 20`);
  }

  // Check for at least one coil
  const coilCount = ladder.filter((b: any) => b.type === "coil").length;
  if (coilCount === 0) {
    errors.push("Ladder must contain at least one coil (output)");
  }
  if (coilCount > 1) {
    warnings.push(`Ladder has ${coilCount} coils - typically should be 1 per rung`);
  }

  // Check coil is last
  const lastBlock = ladder[ladder.length - 1] as any;
  if (lastBlock && lastBlock.type !== "coil") {
    errors.push("Last block in ladder must be a coil (output)");
  }

  // Validate block order: contacts should come before coils
  let seenCoil = false;
  for (let i = 0; i < ladder.length; i++) {
    const block = ladder[i] as any;
    if (block.type === "coil") {
      seenCoil = true;
    } else if (seenCoil && (block.type === "contact" || block.type === "contact_nc")) {
      errors.push(`Block ${i}: Contact found after coil - wrong order`);
    }
  }

  return { errors, warnings };
}

/**
 * Validates complete AI response
 * 
 * Checks:
 * 1. Response is valid JSON with required fields
 * 2. ladder array contains valid blocks
 * 3. All blocks use valid PLC addresses
 * 4. Ladder logic structure follows rules
 * 5. Explanation and instruction list are present
 * 
 * @param response - Raw response from AI (should be parsed JSON)
 * @returns Validation result with errors/warnings or fixed response
 */
export function validateResponse(response: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Check structure
  if (!response || typeof response !== "object") {
    return {
      valid: false,
      errors: ["Response is not a valid object"],
      warnings: [],
    };
  }

  const resp = response as Record<string, unknown>;

  // Check required fields
  if (!resp.ladder || !Array.isArray(resp.ladder)) {
    errors.push('Response missing "ladder" array');
  }
  if (typeof resp.explanation !== "string") {
    errors.push('Response missing or invalid "explanation" field');
  }
  if (typeof resp.instructionList !== "string") {
    errors.push('Response missing or invalid "instructionList" field');
  }

  // If structure is invalid, return early
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const ladder = resp.ladder as unknown[];

  // Step 2: Validate each block
  for (let i = 0; i < ladder.length; i++) {
    const blockErrors = validateLadderBlock(ladder[i], i);
    errors.push(...blockErrors);
  }

  // Step 3: Validate structure and rules
  const structureValidation = validateLadderStructure(ladder);
  errors.push(...structureValidation.errors);
  warnings.push(...structureValidation.warnings);

  // Step 4: Validate explanation
  const explanation = (resp.explanation as string) || "";
  if (explanation.length < 10) {
    warnings.push("Explanation is very short - may lack helpful details");
  }
  if (explanation.length > 2000) {
    warnings.push("Explanation is very long - consider being more concise");
  }

  // Step 5: Validate instruction list
  const instructionList = (resp.instructionList as string) || "";
  if (!instructionList.includes("END")) {
    warnings.push('Instruction list should end with "END"');
  }
  if (instructionList.length < 5) {
    warnings.push("Instruction list seems incomplete");
  }

  // Return result
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fixedResponse: errors.length === 0 
      ? (resp as any)
      : undefined,
  };
}

/**
 * Attempts to fix common issues in AI responses
 * 
 * Common fixes:
 * 1. Adds missing IDs to blocks
 * 2. Reorders blocks (contacts before coils)
 * 3. Adds missing "END" to instruction list
 * 4. Cleans up whitespace
 * 
 * @param response - Response to attempt fixing
 * @returns Fixed response or null if unfixable
 */
export function attemptToFixResponse(response: unknown): any {
  try {
    if (!response || typeof response !== "object") {
      return null;
    }

    const resp = { ...response } as any;

    // Fix: Ensure ladder is array
    if (!Array.isArray(resp.ladder)) {
      return null;
    }

    // Fix: Add missing IDs
    resp.ladder = resp.ladder.map((block: any, idx: number) => ({
      ...block,
      id: block.id || `block-${idx}`,
    }));

    // Fix: Reorder blocks - contacts first, coil last
    const contacts = resp.ladder.filter(
      (b: any) => b.type === "contact" || b.type === "contact_nc"
    );
    const coils = resp.ladder.filter((b: any) => b.type === "coil");
    const others = resp.ladder.filter(
      (b: any) => b.type !== "contact" && b.type !== "contact_nc" && b.type !== "coil"
    );

    resp.ladder = [...contacts, ...others, ...coils];

    // Fix: Ensure explanation exists
    if (!resp.explanation || typeof resp.explanation !== "string") {
      resp.explanation = "Generated ladder logic from user specification.";
    }

    // Fix: Ensure instruction list exists and ends with END
    if (!resp.instructionList || typeof resp.instructionList !== "string") {
      resp.instructionList = "LD X0\nOUT Y0\nEND";
    } else if (!resp.instructionList.includes("END")) {
      resp.instructionList += "\nEND";
    }

    // Fix: Clean up whitespace
    resp.explanation = resp.explanation.trim();
    resp.instructionList = resp.instructionList.trim();

    return resp;
  } catch {
    return null;
  }
}

/**
 * Validates and optionally fixes an AI response
 * 
 * @param response - Raw AI response
 * @param autoFix - Whether to attempt automatic fixes (default: true)
 * @returns Comprehensive validation result
 */
export function validateAndFixResponse(
  response: unknown,
  autoFix: boolean = true
): ValidationResult {
  const validation = validateResponse(response);

  if (!validation.valid && autoFix) {
    const fixed = attemptToFixResponse(response);
    if (fixed) {
      const fixedValidation = validateResponse(fixed);
      if (fixedValidation.valid) {
        return {
          valid: true,
          errors: validation.errors.map((e) => `[FIXED] ${e}`),
          warnings: fixedValidation.warnings,
          fixedResponse: fixed,
        };
      }
    }
  }

  return validation;
}
