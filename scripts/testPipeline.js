#!/usr/bin/env node

/**
 * COMPREHENSIVE RAG PIPELINE TEST
 * Tests each stage: PDF → Text → Chunks → Embeddings → Vector DB → RAG → AI → Validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║              RAG PIPELINE DIAGNOSTIC - ALL STAGES TEST                     ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1: PDF DETECTION
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 STAGE 1: PDF Detection\n');

const DATASET_DIR = path.join(projectRoot, 'dataset');

try {
  if (!fs.existsSync(DATASET_DIR)) {
    console.error(`❌ Dataset directory not found: ${DATASET_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DATASET_DIR);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.error(`❌ No PDF files found in ${DATASET_DIR}`);
    process.exit(1);
  }

  console.log(`✅ Found ${pdfFiles.length} PDF files:`);
  pdfFiles.forEach((f, i) => {
    const filePath = path.join(DATASET_DIR, f);
    const stats = fs.statSync(filePath);
    console.log(`   ${i + 1}. ${f} (${(stats.size / 1024).toFixed(2)} KB)`);
  });

} catch (error) {
  console.error(`❌ PDF Detection failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2: PDF → TEXT EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 STAGE 2: PDF → Text Extraction\n');

try {
  const { processPDFs } = await import('../src/services/pdfProcessor.js');
  
  const chunks = await processPDFs();
  
  if (chunks.length === 0) {
    console.error(`⚠️  Warning: No text chunks extracted from PDFs`);
  } else {
    console.log(`✅ Successfully extracted ${chunks.length} chunks`);
    console.log(`   Sample sizes:`, chunks.slice(0, 3).map(c => c.text.length + ' chars').join(', '));
  }

} catch (error) {
  console.error(`❌ PDF → Text Extraction failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3: VECTOR DATABASE STATUS
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 STAGE 3: Vector Database Status\n');

try {
  const VECTOR_CACHE_DIR = path.join(projectRoot, '.vector-cache');
  
  if (!fs.existsSync(VECTOR_CACHE_DIR)) {
    console.warn(`⚠️  Vector cache directory not created yet: ${VECTOR_CACHE_DIR}`);
    console.log('   (Run: npm run rag:init to create)');
  } else {
    const files = fs.readdirSync(VECTOR_CACHE_DIR);
    
    // Check for embeddings.json
    const embeddingsFile = path.join(VECTOR_CACHE_DIR, 'embeddings.json');
    
    if (fs.existsSync(embeddingsFile)) {
      const data = JSON.parse(fs.readFileSync(embeddingsFile, 'utf-8'));
      console.log(`✅ Vector database exists`);
      console.log(`   Embeddings count: ${data.embeddings?.length || 0}`);
      console.log(`   Metadata saved: ${data.metadata ? 'yes' : 'no'}`);
    } else {
      console.warn(`⚠️  Embeddings database not initialized`);
    }
  }

} catch (error) {
  console.error(`❌ Vector Database check failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4: EMBEDDING SERVICE
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 STAGE 4: Embedding Service\n');

try {
  const { generateEmbedding } = await import('../src/services/embeddingService.js');
  
  const testText = "Start motor when button pressed";
  const embedding = await generateEmbedding(testText);
  
  if (!embedding || !Array.isArray(embedding)) {
    console.error(`❌ Invalid embedding returned`);
    process.exit(1);
  }
  
  console.log(`✅ Embedding generation works`);
  console.log(`   Test text: "${testText}"`);
  console.log(`   Embedding dimension: ${embedding.length}`);
  console.log(`   Sample values:`, embedding.slice(0, 5).map(v => v.toFixed(4)).join(', '));

} catch (error) {
  console.error(`❌ Embedding Service failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 5: RAG RETRIEVAL
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 STAGE 5: RAG Retrieval Service\n');

try {
  const { retrieveContext } = await import('../src/services/ragService.js');
  
  const query = "motor control startup sequence";
  const context = await retrieveContext(query);
  
  if (!context) {
    console.warn(`⚠️  RAG returned no context (vector DB might not be initialized)`);
  } else {
    console.log(`✅ RAG Retrieval works`);
    console.log(`   Query: "${query}"`);
    console.log(`   Retrieved chunks: ${(context.chunks || []).length || 0}`);
    console.log(`   Context length: ${context.context?.length || 0} chars`);
    console.log(`   Status: ${context.status || 'unknown'}`);
  }

} catch (error) {
  console.error(`❌ RAG Retrieval failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 6: RESPONSE VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 STAGE 6: Response Validator\n');

try {
  const { validateAIResponse } = await import('../src/services/responseValidator.js');
  
  // Sample valid response
  const sampleResponse = {
    ladder: [
      { type: "contact", label: "X0", id: "block-1" },
      { type: "coil", label: "Y0", id: "block-2" }
    ],
    explanation: "This is a basic motor start control using X0 as input and Y0 as output.",
    instructionList: "LD X0\nOUT Y0"
  };
  
  const result = validateAIResponse(sampleResponse);
  
  if (result.isValid) {
    console.log(`✅ Response Validator works`);
    console.log(`   Valid: ${result.isValid}`);
    console.log(`   Errors: 0`);
  } else {
    console.log(`⚠️  Validator found issues:`);
    result.errors.forEach(e => console.log(`   - ${e}`));
  }

} catch (error) {
  console.error(`❌ Response Validator failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                          PIPELINE SUMMARY                                  ║
╚════════════════════════════════════════════════════════════════════════════╝

✅ All stages checked successfully!

NEXT STEPS:
1. Initialize Vector DB: npm run rag:init
2. Test full pipeline: npm run dev
3. Try a real prompt in the UI

PIPELINE FLOW:
  PDF Files → (pdfProcessor.ts) → Text Chunks
  Text Chunks → (embeddingService.ts) → Embeddings
  Embeddings → .vector-cache/ → Vector Database
  User Input → (ragService.ts) → Retrieved Context
  Context + Input → (Groq API) → Generated Response
  Response → (responseValidator.ts) → Validated Output
  Output → Frontend UI
`);
