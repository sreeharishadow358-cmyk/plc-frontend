/**
 * Represents a single PLC instruction element in ladder logic.
 * 
 * Each block is a discrete instruction that appears in a ladder rung.
 * Types include:
 * - contact: Normally open (NO) contact - passes signal when condition is true
 * - contact_nc: Normally closed (NC) contact - passes signal when condition is false
 * - coil: Output or relay - energized when logic above evaluates to true
 * - timer: Time-based instruction for delaying or measuring duration
 * - counter: Counts occurrences of an input signal
 */
export interface LadderBlock {
  /** Unique identifier for this block */
  id: string;

  /** Type of instruction this block represents */
  type: "contact" | "contact_nc" | "coil" | "timer" | "counter";

  /** Display name or associated tag for this block */
  label: string;
}

/**
 * Represents a single horizontal rung in ladder logic.
 * 
 * A rung is equivalent to one line of logic in a PLC program.
 * It contains an ordered sequence of blocks that form the logic path.
 * The logic evaluates left to right, with contacts in series (AND) or
 * parallel (OR) based on connection topology.
 */
export interface LadderRung {
  /** Unique identifier for this rung */
  id: number;

  /** Collection of instruction blocks that comprise this rung */
  blocks: LadderBlock[];
}

/**
 * Represents a complete PLC project.
 * 
 * A project encompasses the entire ladder logic program including
 * all rungs. This is the top-level container for a PLC application.
 */
export interface LadderProject {
  /** Project name */
  name: string;

  /** Collection of rungs that make up the complete program */
  rungs: LadderRung[];
}

/**
 * Represents a PLC tag (variable or memory location).
 * 
 * Tags are named references to physical or logical memory locations.
 * They store values used throughout ladder logic instructions.
 * Different address types map to different memory regions in the PLC.
 */
export interface Tag {
  /** Symbolic name of the tag */
  name: string;

  /** Memory address or location identifier */
  address: string;

  /** Category of memory this tag references */
  type: "input" | "output" | "memory" | "register";
}
