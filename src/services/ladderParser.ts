import { LadderProject, LadderRung, LadderBlock } from "@/types/ladder";

/**
 * Valid block types that can appear in ladder logic.
 * Used for type validation during parsing.
 */
const VALID_BLOCK_TYPES = ["contact", "contact_nc", "coil", "timer", "counter"] as const;

/**
 * Parses raw JSON output from AI model and converts it into a valid LadderProject object.
 * 
 * This function performs comprehensive validation of the ladder structure to ensure
 * data integrity before creating the project object. Invalid data triggers descriptive
 * error messages to aid debugging.
 * 
 * @param data - Raw JSON data from AI model (likely untyped or partially typed)
 * @returns A validated LadderProject object ready for use in the application
 * @throws Error with descriptive message if validation fails
 * 
 * @example
 * const aiOutput = { name: "My Program", rungs: [...] };
 * const project = parseLadderFromAI(aiOutput);
 */
export function parseLadderFromAI(data: unknown): LadderProject {
  // Step 1: Validate that data is not null or undefined
  if (!data || typeof data !== "object") {
    throw new Error("Invalid ladder data: expected an object, received " + typeof data);
  }

  const obj = data as Record<string, unknown>;

  // Step 2: Validate project name exists and is a string
  if (typeof obj.name !== "string") {
    throw new Error(
      "Invalid project structure: 'name' field is required and must be a string"
    );
  }

  const projectName = obj.name.trim();
  if (projectName.length === 0) {
    throw new Error("Invalid project name: project name cannot be empty");
  }

  // Step 3: Validate rungs array exists and is an array
  if (!Array.isArray(obj.rungs)) {
    throw new Error(
      "Invalid ladder structure: 'rungs' field is required and must be an array"
    );
  }

  if (obj.rungs.length === 0) {
    throw new Error("Invalid ladder structure: project must contain at least one rung");
  }

  // Step 4: Parse and validate each rung
  const parsedRungs: LadderRung[] = [];

  for (let rungIndex = 0; rungIndex < obj.rungs.length; rungIndex++) {
    const rungData = obj.rungs[rungIndex];

    // Validate rung is an object
    if (!rungData || typeof rungData !== "object") {
      throw new Error(
        `Invalid rung at index ${rungIndex}: expected object, received ${typeof rungData}`
      );
    }

    const rung = rungData as Record<string, unknown>;

    // Validate rung has id field
    if (typeof rung.id !== "number") {
      throw new Error(
        `Invalid rung at index ${rungIndex}: 'id' field is required and must be a number`
      );
    }

    // Validate rung has blocks array
    if (!Array.isArray(rung.blocks)) {
      throw new Error(
        `Invalid rung at index ${rungIndex}: 'blocks' field is required and must be an array`
      );
    }

    if (rung.blocks.length === 0) {
      throw new Error(
        `Invalid rung at index ${rungIndex}: rung must contain at least one block`
      );
    }

    // Step 5: Parse and validate each block within the rung
    const parsedBlocks: LadderBlock[] = [];

    for (let blockIndex = 0; blockIndex < rung.blocks.length; blockIndex++) {
      const blockData = rung.blocks[blockIndex];

      // Validate block is an object
      if (!blockData || typeof blockData !== "object") {
        throw new Error(
          `Invalid block at rung ${rungIndex}, index ${blockIndex}: expected object, received ${typeof blockData}`
        );
      }

      const block = blockData as Record<string, unknown>;

      // Validate block id exists and is a string
      if (typeof block.id !== "string") {
        throw new Error(
          `Invalid block at rung ${rungIndex}, index ${blockIndex}: 'id' field is required and must be a string`
        );
      }

      if (block.id.trim().length === 0) {
        throw new Error(
          `Invalid block at rung ${rungIndex}, index ${blockIndex}: block id cannot be empty`
        );
      }

      // Validate block type exists and is one of the valid types
      if (typeof block.type !== "string") {
        throw new Error(
          `Invalid block at rung ${rungIndex}, index ${blockIndex}: 'type' field is required and must be a string`
        );
      }

      if (!VALID_BLOCK_TYPES.includes(block.type as typeof VALID_BLOCK_TYPES[number])) {
        throw new Error(
          `Invalid block type "${block.type}" at rung ${rungIndex}, index ${blockIndex}. ` +
          `Valid types are: ${VALID_BLOCK_TYPES.join(", ")}`
        );
      }

      // Validate block label exists and is a string
      if (typeof block.label !== "string") {
        throw new Error(
          `Invalid block at rung ${rungIndex}, index ${blockIndex}: 'label' field is required and must be a string`
        );
      }

      if (block.label.trim().length === 0) {
        throw new Error(
          `Invalid block at rung ${rungIndex}, index ${blockIndex}: block label cannot be empty`
        );
      }

      // Create validated block object
      parsedBlocks.push({
        id: block.id.trim(),
        type: block.type as "contact" | "contact_nc" | "coil" | "timer" | "counter",
        label: block.label.trim(),
      });
    }

    // Create validated rung object
    parsedRungs.push({
      id: rung.id,
      blocks: parsedBlocks,
    });
  }

  // Step 6: Return fully validated and parsed LadderProject
  return {
    name: projectName,
    rungs: parsedRungs,
  };
}
