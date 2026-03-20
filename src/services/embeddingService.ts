import * as fs from "fs";
import * as path from "path";

/**
 * Embedding and Vector Database Service
 * 
 * Handles embedding generation and local vector storage using a file-based approach.
 * Uses Xenova transformers for generating embeddings locally (no API calls needed).
 * Stores embeddings and chunks in JSON files for persistence.
 * 
 * @module embeddingService
 */

// Lazy load transformers to avoid slow startup times
let pipeline: any = null;
let EMBEDDING_DIM = 384; // Default for sentence-transformers-based model

const VECTOR_DB_DIR = path.join(process.cwd(), ".vector-cache");
const CHUNKS_FILE = path.join(VECTOR_DB_DIR, "chunks.json");
const EMBEDDINGS_FILE = path.join(VECTOR_DB_DIR, "embeddings.json");
const METADATA_FILE = path.join(VECTOR_DB_DIR, "metadata.json");

/**
 * Interface for stored embedding data
 */
interface StoredEmbedding {
  id: string;
  text: string;
  source: string;
  pageNumber: number;
  embedding: number[];
}

/**
 * Initializes the embedding service by loading or creating the transformer pipeline
 */
async function initializeEmbeddings(): Promise<void> {
  if (pipeline !== null) return; // Already initialized

  try {
    console.log("🔧 Initializing embedding model (first time may take 1-2 minutes)...");
    
    const { pipeline: transformersPipeline } = await import("@xenova/transformers");
    
    // Using a lightweight model that works well for semantic search
    pipeline = await transformersPipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      revision: "main",
      progress_callback: (progress: any) => {
        if (progress.status === "progress") {
          console.log(
            `  ⏳ ${progress.name || "Loading"}: ${Math.round((progress.progress || 0) * 100)}%`
          );
        }
      },
    });

    console.log("✅ Embedding model initialized (MiniLM-L6-v2, 384 dims)");
  } catch (error) {
    throw new Error(
      `Failed to initialize embedding model: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generates embedding for a single text string
 * 
 * @param text - Text to embed
 * @returns Promise resolving to embedding vector (384 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

  try {
    await initializeEmbeddings();

    // Generate embedding using the transformer pipeline
    const result = await pipeline(text, {
      pooling: "mean",
      normalize: true,
    });

    // Convert tensor to array
    const embedding = Array.from(result.data as Float32Array);
    return embedding;
  } catch (error) {
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Ensures vector database directory exists
 */
function ensureVectorDBDir(): void {
  if (!fs.existsSync(VECTOR_DB_DIR)) {
    fs.mkdirSync(VECTOR_DB_DIR, { recursive: true });
  }
}

/**
 * Saves embeddings and chunks to disk
 * 
 * @param embeddings - Array of stored embeddings to save
 */
export function saveVectorDatabase(embeddings: StoredEmbedding[]): void {
  try {
    ensureVectorDBDir();

    // Save embeddings
    fs.writeFileSync(EMBEDDINGS_FILE, JSON.stringify(embeddings, null, 2));

    // Save metadata
    const metadata = {
      count: embeddings.length,
      timestamp: new Date().toISOString(),
      embeddingDim: EMBEDDING_DIM,
      model: "Xenova/all-MiniLM-L6-v2",
    };
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));

    console.log(
      `💾 Saved ${embeddings.length} embeddings to ${path.relative(process.cwd(), VECTOR_DB_DIR)}`
    );
  } catch (error) {
    throw new Error(
      `Failed to save vector database: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Loads embeddings from disk
 * 
 * @returns Array of stored embeddings, or empty array if database doesn't exist
 */
export function loadVectorDatabase(): StoredEmbedding[] {
  try {
    if (!fs.existsSync(EMBEDDINGS_FILE)) {
      console.log("📦 No vector database found - will create on first initialization");
      return [];
    }

    const data = fs.readFileSync(EMBEDDINGS_FILE, "utf-8");
    const embeddings = JSON.parse(data) as StoredEmbedding[];
    console.log(`✅ Loaded ${embeddings.length} embeddings from vector database`);
    return embeddings;
  } catch (error) {
    console.error("⚠️ Failed to load vector database:", error);
    return [];
  }
}

/**
 * Computes cosine similarity between two vectors
 * 
 * @param vecA - First embedding vector
 * @param vecB - Second embedding vector
 * @returns Similarity score between -1 and 1 (higher = more similar)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same dimension");
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) {
    return 0; // Handle zero vectors
  }

  return dotProduct / (magA * magB);
}

/**
 * Searches for similar embeddings in the vector database
 * 
 * @param queryEmbedding - Embedding vector of the query
 * @param existingEmbeddings - All stored embeddings to search through
 * @param topK - Number of top results to return (default: 5)
 * @returns Array of matches sorted by similarity (highest first)
 */
export function searchSimilarEmbeddings(
  queryEmbedding: number[],
  existingEmbeddings: StoredEmbedding[],
  topK: number = 5
): Array<StoredEmbedding & { similarity: number }> {
  if (existingEmbeddings.length === 0) {
    return [];
  }

  // Compute similarity scores
  const results = existingEmbeddings.map((emb) => ({
    ...emb,
    similarity: cosineSimilarity(queryEmbedding, emb.embedding),
  }));

  // Sort by similarity descending and return top K
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * Clears the vector database (useful for regeneration)
 */
export function clearVectorDatabase(): void {
  try {
    ensureVectorDBDir();
    if (fs.existsSync(EMBEDDINGS_FILE)) {
      fs.unlinkSync(EMBEDDINGS_FILE);
    }
    if (fs.existsSync(METADATA_FILE)) {
      fs.unlinkSync(METADATA_FILE);
    }
    console.log("🧹 Vector database cleared");
  } catch (error) {
    console.error("⚠️ Failed to clear vector database:", error);
  }
}

/**
 * Gets the vector database statistics
 */
export function getVectorDatabaseStats(): {
  count: number;
  path: string;
  exists: boolean;
  embeddingDim: number;
} {
  return {
    count: fs.existsSync(EMBEDDINGS_FILE)
      ? (JSON.parse(fs.readFileSync(EMBEDDINGS_FILE, "utf-8")) as StoredEmbedding[]).length
      : 0,
    path: VECTOR_DB_DIR,
    exists: fs.existsSync(EMBEDDINGS_FILE),
    embeddingDim: EMBEDDING_DIM,
  };
}

/**
 * Export types
 */
export type { StoredEmbedding };
