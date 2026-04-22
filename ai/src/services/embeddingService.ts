import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface EmbeddingPipelineProgress {
  status?: string;
  name?: string;
  progress?: number;
}

interface EmbeddingPipelineResult {
  data: Float32Array | number[];
}

interface EmbeddingPipeline {
  (text: string, options: { pooling: 'mean'; normalize: boolean }): Promise<EmbeddingPipelineResult>;
}

export interface StoredEmbedding {
  id: string;
  text: string;
  source: string;
  pageNumber: number;
  embedding: number[];
}

let pipeline: EmbeddingPipeline | null = null;
let embeddingMode: 'transformer' | 'fallback' = 'transformer';
let activeEmbeddingModel = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIM = 384;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(__dirname, '../../..');
const SHARED_VECTOR_DB_DIR = path.join(REPO_ROOT, '.vector-cache');
const LEGACY_VECTOR_DB_DIR = path.join(PACKAGE_ROOT, '.vector-cache');

function getEmbeddingsFile(dir: string): string {
  return path.join(dir, 'embeddings.json');
}

function getMetadataFile(dir: string): string {
  return path.join(dir, 'metadata.json');
}

function hasStoredEmbeddings(dir: string): boolean {
  return fs.existsSync(getEmbeddingsFile(dir));
}

function getReadableVectorDBDir(): string {
  if (hasStoredEmbeddings(SHARED_VECTOR_DB_DIR)) {
    return SHARED_VECTOR_DB_DIR;
  }

  if (hasStoredEmbeddings(LEGACY_VECTOR_DB_DIR)) {
    return LEGACY_VECTOR_DB_DIR;
  }

  return SHARED_VECTOR_DB_DIR;
}

function getWritableVectorDBDir(): string {
  return SHARED_VECTOR_DB_DIR;
}

function ensureVectorDBDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateFallbackEmbedding(text: string): number[] {
  const vector = new Array(EMBEDDING_DIM).fill(0);
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 0; i < vector.length; i++) {
    const seed = (hash + i) * 12345678;
    vector[i] = Math.sin(seed) * 0.5 + 0.5;
  }

  return vector;
}

async function initializeEmbeddings(): Promise<void> {
  if (pipeline !== null || embeddingMode === 'fallback') {
    return;
  }

  try {
    console.log('Initializing embedding model (this may take a minute)...');
    const { pipeline: transformersPipeline } = await import('@xenova/transformers');

    pipeline = (await transformersPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      revision: 'main',
      progress_callback: (progress: EmbeddingPipelineProgress) => {
        if (progress.status === 'progress') {
          console.log(
            `  -> ${progress.name || 'Loading'}: ${Math.round((progress.progress || 0) * 100)}%`
          );
        }
      },
    })) as EmbeddingPipeline;

    console.log('Embedding model initialized (MiniLM-L6-v2, 384 dims)');
  } catch (error) {
    embeddingMode = 'fallback';
    activeEmbeddingModel = 'fallback-hash-embedding';
    console.warn(
      `Falling back to deterministic hash embeddings: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  await initializeEmbeddings();

  if (embeddingMode === 'fallback') {
    return generateFallbackEmbedding(text);
  }

  if (!pipeline) {
    throw new Error('Embedding pipeline was not initialized');
  }

  const result = await pipeline(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(result.data);
}

export function saveVectorDatabase(embeddings: StoredEmbedding[]): void {
  const vectorDBDir = getWritableVectorDBDir();
  const embeddingsFile = getEmbeddingsFile(vectorDBDir);
  const metadataFile = getMetadataFile(vectorDBDir);

  ensureVectorDBDir(vectorDBDir);
  fs.writeFileSync(embeddingsFile, JSON.stringify(embeddings, null, 2));

  const metadata = {
    count: embeddings.length,
    timestamp: new Date().toISOString(),
    embeddingDim: EMBEDDING_DIM,
    model: activeEmbeddingModel,
  };
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

  console.log(`Saved ${embeddings.length} embeddings to ${vectorDBDir}`);
}

export function loadVectorDatabase(): StoredEmbedding[] {
  const vectorDBDir = getReadableVectorDBDir();
  const embeddingsFile = getEmbeddingsFile(vectorDBDir);

  if (!fs.existsSync(embeddingsFile)) {
    console.log(`Vector database not found yet at ${vectorDBDir}`);
    return [];
  }

  const data = fs.readFileSync(embeddingsFile, 'utf-8');
  return JSON.parse(data) as StoredEmbedding[];
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimension');
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
    return 0;
  }

  return dotProduct / (magA * magB);
}

export function searchSimilarEmbeddings(
  queryEmbedding: number[],
  existingEmbeddings: StoredEmbedding[],
  topK: number = 5
): Array<StoredEmbedding & { similarity: number }> {
  if (existingEmbeddings.length === 0) {
    return [];
  }

  const results = existingEmbeddings.map((embedding) => ({
    ...embedding,
    similarity: cosineSimilarity(queryEmbedding, embedding.embedding),
  }));

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

export function clearVectorDatabase(): void {
  const candidateDirs = new Set([getWritableVectorDBDir(), LEGACY_VECTOR_DB_DIR]);

  for (const dir of candidateDirs) {
    ensureVectorDBDir(dir);

    const embeddingsFile = getEmbeddingsFile(dir);
    const metadataFile = getMetadataFile(dir);

    if (fs.existsSync(embeddingsFile)) {
      fs.unlinkSync(embeddingsFile);
    }
    if (fs.existsSync(metadataFile)) {
      fs.unlinkSync(metadataFile);
    }
  }

  console.log('Vector database cleared');
}

export function getVectorDatabaseStats(): {
  count: number;
  path: string;
  exists: boolean;
  embeddingDim: number;
} {
  const vectorDBDir = getReadableVectorDBDir();
  const embeddingsFile = getEmbeddingsFile(vectorDBDir);
  const exists = fs.existsSync(embeddingsFile);

  return {
    count: exists ? (JSON.parse(fs.readFileSync(embeddingsFile, 'utf-8')) as StoredEmbedding[]).length : 0,
    path: vectorDBDir,
    exists,
    embeddingDim: EMBEDDING_DIM,
  };
}
