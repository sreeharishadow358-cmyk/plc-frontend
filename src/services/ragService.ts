import {
  generateEmbedding,
  loadVectorDatabase,
  searchSimilarEmbeddings,
} from "./embeddingService";

/**
 * Represents context retrieved for a user query
 */
export interface RetrievedContext {
  chunks: Array<{
    text: string;
    source: string;
    pageNumber: number;
    similarity: number;
  }>;
  combinedContext: string;
  sourceDocuments: Set<string>;
}

/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * Coordinates the RAG pipeline:
 * 1. Takes user input
 * 2. Generates embedding for the query
 * 3. Searches vector database for similar chunks
 * 4. Returns combined context for use in prompt
 * 
 * @module ragService
 */

/**
 * Retrieves relevant context from the vector database for a user query
 * 
 * Main entry point for RAG. Uses semantic similarity to find the most
 * relevant chunks from the PDF knowledge base.
 * 
 * @param userInput - Natural language query from user
 * @param topK - Number of top results to retrieve (default: 4)
 * @returns Promise resolving to retrieved context and combined text
 * @throws Error if embedding or search fails
 */
export async function retrieveContext(
  userInput: string,
  topK: number = 4
): Promise<RetrievedContext> {
  try {
    // Step 1: Validate input
    if (!userInput || userInput.trim().length === 0) {
      throw new Error("Cannot retrieve context for empty input");
    }

    console.log(`🔍 Retrieving context for query: "${userInput.substring(0, 50)}..."`);

    // Step 2: Load vector database
    const vectorDB = loadVectorDatabase();
    if (vectorDB.length === 0) {
      console.warn("⚠️ Vector database is empty - RAG will not provide context");
      return {
        chunks: [],
        combinedContext: "",
        sourceDocuments: new Set(),
      };
    }

    // Step 3: Generate embedding for user query
    console.log("🧮 Generating query embedding...");
    const queryEmbedding = await generateEmbedding(userInput);

    // Step 4: Search for similar chunks
    console.log(`🔎 Searching for top ${topK} similar chunks...`);
    const similarChunks = searchSimilarEmbeddings(queryEmbedding, vectorDB, topK);

    if (similarChunks.length === 0) {
      console.warn("⚠️ No similar chunks found in vector database");
      return {
        chunks: [],
        combinedContext: "",
        sourceDocuments: new Set(),
      };
    }

    // Step 5: Format results and combine context
    const chunks = similarChunks.map((chunk) => ({
      text: chunk.text,
      source: chunk.source,
      pageNumber: chunk.pageNumber,
      similarity: Number(chunk.similarity.toFixed(3)),
    }));

    // Combine chunks into a single context string for the prompt
    const combinedContext = chunks
      .map((chunk, index) => {
        return `[Source: ${chunk.source}, Page ${chunk.pageNumber}, Relevance: ${(chunk.similarity * 100).toFixed(0)}%]\n${chunk.text}`;
      })
      .join("\n\n---\n\n");

    // Extract unique source documents
    const sourceDocuments = new Set(chunks.map((chunk) => chunk.source));

    console.log(
      `✅ Retrieved ${chunks.length} relevant chunks from ${sourceDocuments.size} document(s)`
    );

    return {
      chunks,
      combinedContext,
      sourceDocuments,
    };
  } catch (error) {
    console.error("❌ Context retrieval failed:", error);
    throw new Error(
      `Failed to retrieve context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Constructs the final prompt with RAG context for the LLM
 * 
 * Combines:
 * 1. System instructions for PLC ladder logic generation
 * 2. Retrieved context from knowledge base
 * 3. User input
 * 
 * The grounded context helps the AI make better decisions and refer to
 * specific PLC instructions from the documentation.
 * 
 * @param userInput - User's natural language instruction
 * @param retrievedContext - Context retrieved from RAG
 * @param systemPrompt - Base system instructions
 * @returns Complete prompt for the LLM
 */
export function constructRAGPrompt(
  userInput: string,
  retrievedContext: RetrievedContext,
  systemPrompt: string
): string {
  let prompt = systemPrompt;

  // Add context section if we have retrieved chunks
  if (retrievedContext.combinedContext.length > 0) {
    prompt += `

═══════════════════════════════════════════════════════════════════════════════
REFERENCE KNOWLEDGE FROM PLC DOCUMENTATION:
═══════════════════════════════════════════════════════════════════════════════

${retrievedContext.combinedContext}

═══════════════════════════════════════════════════════════════════════════════
END OF REFERENCE KNOWLEDGE
═══════════════════════════════════════════════════════════════════════════════

IMPORTANT: Use the reference knowledge above to inform your response. If the user's request 
relates to concepts mentioned in the reference knowledge, incorporate those specific details 
and Mitsubishi addresses/instructions into your ladder logic output.
`;
  }

  // Add context hints if available
  if (retrievedContext.sourceDocuments.size > 0) {
    prompt += `\n[This query was enhanced with knowledge from: ${Array.from(retrievedContext.sourceDocuments).join(", ")}]\n`;
  }

  // Add user input
  prompt += `\nUSER REQUEST:\n${userInput}`;

  return prompt;
}

/**
 * Checks if RAG database is initialized and ready
 * 
 * @returns true if vector database exists and has embeddings, false otherwise
 */
export function isRAGInitialized(): boolean {
  const vectorDB = loadVectorDatabase();
  return vectorDB.length > 0;
}

/**
 * Gets RAG system statistics
 * 
 * @returns Stats including database size and readiness
 */
export function getRAGStats(): {
  initialized: boolean;
  chunkCount: number;
  ready: boolean;
  message: string;
} {
  const vectorDB = loadVectorDatabase();
  const initialized = vectorDB.length > 0;

  return {
    initialized,
    chunkCount: vectorDB.length,
    ready: initialized,
    message: initialized
      ? `✅ RAG ready with ${vectorDB.length} chunks from PDF knowledge base`
      : "⚠️ RAG not initialized - run initialization script first",
  };
}
