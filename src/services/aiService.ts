import { LadderProject } from "@/types/ladder";
import { parseLadderFromAI } from "@/services/ladderParser";

/**
 * Metadata about the generation process
 */
interface GenerationMetadata {
  ragStatus: "disabled" | "active" | "not_initialized" | "no_results" | "error";
  sourceDocuments: string[];
}

/**
 * Response structure from the AI ladder generation API endpoint.
 */
interface AIServiceResponse {
  /** Generated ladder logic project */
  project: LadderProject;

  /** Human-readable explanation of the generated logic */
  explanation: string;

  /** List of instructions used to generate the ladder */
  instructionList: string;

  /** Metadata about the generation process (RAG status, sources etc.) */
  metadata?: GenerationMetadata;
}

/**
 * Generates PLC ladder logic from a natural language instruction using the backend AI service.
 * 
 * This function:
 * 1. Sends the instruction to the backend API
 * 2. Receives raw ladder structure data
 * 3. Validates and parses the ladder structure
 * 4. Returns validated project with explanation and instruction list
 * 
 * @param instruction - Natural language description of the desired ladder logic
 * @returns Promise resolving to validated ladder generation result
 * @throws Error with descriptive message if API call fails or response is invalid
 * 
 * @example
 * const result = await generateLadderLogic("Turn on motor when start button pressed");
 * console.log(result.project.name); // Generated project name
 * console.log(result.explanation);  // Explanation of the logic
 */
export async function generateLadderLogic(instruction: string): Promise<AIServiceResponse> {
  // Step 1: Validate input
  if (!instruction || typeof instruction !== "string") {
    throw new Error("Invalid input: instruction must be a non-empty string");
  }

  const trimmedInstruction = instruction.trim();
  if (trimmedInstruction.length === 0) {
    throw new Error("Invalid input: instruction cannot be empty or whitespace only");
  }

  try {
    // Step 2: Build API request
    const requestBody = {
      input: trimmedInstruction,
    };

    // Step 3: Call backend API endpoint
    const response = await fetch("/api/generate-logic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Step 4: Check HTTP response status
    if (!response.ok) {
      // Handle specific HTTP error codes
      if (response.status === 400) {
        throw new Error(
          `Bad request: Invalid instruction format or missing required fields`
        );
      } else if (response.status === 401) {
        throw new Error("Unauthorized: API authentication failed");
      } else if (response.status === 403) {
        throw new Error("Forbidden: Access to API endpoint denied");
      } else if (response.status === 500) {
        throw new Error("Server error: AI service encountered an internal error");
      } else if (response.status === 503) {
        throw new Error("Service unavailable: AI service is temporarily down");
      } else {
        throw new Error(
          `API request failed with status ${response.status}: ${response.statusText}`
        );
      }
    }

    // Step 5: Parse response body
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error(
        "Failed to parse API response: response is not valid JSON"
      );
    }

    // Step 6: Validate response structure
    if (!responseData || typeof responseData !== "object") {
      throw new Error(
        "Invalid API response: expected object, received " + typeof responseData
      );
    }

    const data = responseData as Record<string, unknown>;

    // Check required fields exist
    if (!data.project) {
      throw new Error(
        "Invalid API response: missing 'project' field in response"
      );
    }

    if (!data.explanation || typeof data.explanation !== "string") {
      throw new Error(
        "Invalid API response: 'explanation' field is required and must be a string"
      );
    }

    if (!data.instructionList || typeof data.instructionList !== "string") {
      throw new Error(
        "Invalid API response: 'instructionList' field is required and must be a string"
      );
    }

    // Step 7: Validate and parse ladder project
    let parsedProject: LadderProject;
    try {
      parsedProject = parseLadderFromAI(data.project);
    } catch (parsingError) {
      throw new Error(
        `Failed to parse ladder structure: ${parsingError instanceof Error ? parsingError.message : "Unknown parsing error"}`
      );
    }

    // Step 8: Extract metadata if available
    const meta = data._meta as Record<string, unknown> | undefined;
    const validRagStatuses = ["disabled", "active", "not_initialized", "no_results", "error"] as const;
    let ragStatus: "disabled" | "active" | "not_initialized" | "no_results" | "error" = "disabled";
    
    if (meta?.ragStatus && validRagStatuses.includes(meta.ragStatus as any)) {
      ragStatus = meta.ragStatus as any;
    }
    
    const metadata: GenerationMetadata = {
      ragStatus,
      sourceDocuments: (meta?.sourceDocuments as string[]) || [],
    };

    // Step 9: Return validated response
    return {
      project: parsedProject,
      explanation: data.explanation.trim(),
      instructionList: data.instructionList.trim(),
      metadata,
    };
  } catch (error) {
    // Step 9: Handle network and other errors
    if (error instanceof TypeError) {
      throw new Error(
        `Network error: Failed to connect to AI service. ${error.message}`
      );
    }

    // Re-throw known errors as-is
    if (error instanceof Error) {
      throw error;
    }

    // Handle unknown error types
    throw new Error("Unknown error occurred while generating ladder logic");
  }
}
