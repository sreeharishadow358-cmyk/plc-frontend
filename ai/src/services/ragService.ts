import {
  generateEmbedding,
  loadVectorDatabase,
  searchSimilarEmbeddings,
} from './embeddingService.js';

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

export async function retrieveContext(
  userInput: string,
  topK: number = 4
): Promise<RetrievedContext> {
  if (!userInput || userInput.trim().length === 0) {
    throw new Error('Cannot retrieve context for empty input');
  }

  console.log(`🔍 Retrieving context for query: "${userInput.substring(0, 50)}..."`);
  const vectorDB = loadVectorDatabase();
  if (vectorDB.length === 0) {
    console.warn('⚠️ Vector database is empty - RAG will not provide context');
    return {
      chunks: [],
      combinedContext: '',
      sourceDocuments: new Set(),
    };
  }

  console.log('🧮 Generating query embedding...');
  const queryEmbedding = await generateEmbedding(userInput);
  console.log(`🔎 Searching for top ${topK} similar chunks...`);
  const similarChunks = searchSimilarEmbeddings(queryEmbedding, vectorDB, topK);

  if (similarChunks.length === 0) {
    console.warn('⚠️ No similar chunks found in vector database');
    return {
      chunks: [],
      combinedContext: '',
      sourceDocuments: new Set(),
    };
  }

  const chunks = similarChunks.map((chunk) => ({
    text: chunk.text,
    source: chunk.source,
    pageNumber: chunk.pageNumber,
    similarity: Number(chunk.similarity.toFixed(3)),
  }));

  const combinedContext = chunks
    .map((chunk) => {
      return `[Source: ${chunk.source}, Page ${chunk.pageNumber}, Relevance: ${(chunk.similarity * 100).toFixed(0)}%]\n${chunk.text}`;
    })
    .join('\n\n---\n\n');

  const sourceDocuments = new Set(chunks.map((chunk) => chunk.source));

  console.log(`✅ Retrieved ${chunks.length} relevant chunks from ${sourceDocuments.size} document(s)`);

  return {
    chunks,
    combinedContext,
    sourceDocuments,
  };
}

export function constructRAGPrompt(
  userInput: string,
  retrievedContext: RetrievedContext
): string {
  let prompt = '';

  if (retrievedContext.combinedContext.length > 0) {
    prompt += `\n\n═══════════════════════════════════════════════════════════════════════════════\nREFERENCE KNOWLEDGE FROM PLC DOCUMENTATION:\n═══════════════════════════════════════════════════════════════════════════════\n\n${retrievedContext.combinedContext}\n\n═══════════════════════════════════════════════════════════════════════════════\nEND OF REFERENCE KNOWLEDGE\n═══════════════════════════════════════════════════════════════════════════════\n\n`;
  }

  if (retrievedContext.sourceDocuments.size > 0) {
    prompt += `\n[This query was enhanced with knowledge from: ${Array.from(retrievedContext.sourceDocuments).join(', ')}]\n`;
  }

  prompt += `\nUSER REQUEST:\n${userInput}`;
  return prompt;
}

export function isRAGInitialized(): boolean {
  return loadVectorDatabase().length > 0;
}

export function getRAGStats() {
  const vectorDB = loadVectorDatabase();
  return {
    initialized: vectorDB.length > 0,
    chunkCount: vectorDB.length,
    ready: vectorDB.length > 0,
    message: vectorDB.length > 0
      ? `✅ RAG ready with ${vectorDB.length} chunks from PDF knowledge base`
      : '⚠️ RAG not initialized - run initialization script first',
  };
}
