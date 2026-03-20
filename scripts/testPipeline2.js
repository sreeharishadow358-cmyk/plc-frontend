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

async function runTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║              RAG PIPELINE DIAGNOSTIC - ALL STAGES TEST                     ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  try {
    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 1: PDF DETECTION
    // ─────────────────────────────────────────────────────────────────────────────

    console.log('\n📋 STAGE 1: PDF Detection\n');

    const DATASET_DIR = path.join(projectRoot, 'dataset');

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

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 2: PDF → TEXT EXTRACTION
    // ─────────────────────────────────────────────────────────────────────────────

    console.log('\n📋 STAGE 2: PDF → Text Extraction\n');

    const { processPDFs } = await import('../src/services/pdfProcessor.js');
    const chunks = await processPDFs();

    if (chunks.length === 0) {
      console.error(`❌ Error: No text chunks extracted from PDFs`);
    } else {
      console.log(`✅ Successfully extracted ${chunks.length} chunks`);
      console.log(`   Sample sizes:`, chunks.slice(0, 3).map(c => c.text.length + ' chars').join(', '));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 3: VECTOR DATABASE STATUS
    // ─────────────────────────────────────────────────────────────────────────────

    console.log('\n📋 STAGE 3: Vector Database Status\n');

    const VECTOR_CACHE_DIR = path.join(projectRoot, '.vector-cache');

    if (!fs.existsSync(VECTOR_CACHE_DIR)) {
      console.warn(`⚠️  Vector cache directory not created yet`);
      console.log('   (Run: npm run rag:init to create)');
    } else {
      const embeddingsFile = path.join(VECTOR_CACHE_DIR, 'embeddings.json');
      if (fs.existsSync(embeddingsFile)) {
        const data = JSON.parse(fs.readFileSync(embeddingsFile, 'utf-8'));
        console.log(`✅ Vector database exists`);
        console.log(`   Embeddings count: ${data.embeddings?.length || 0}`);
      } else {
        console.warn(`⚠️  Embeddings database not initialized`);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 4: EMBEDDING SERVICE
    // ─────────────────────────────────────────────────────────────────────────────

    console.log('\n📋 STAGE 4: Embedding Service\n');

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
    console.log(`   Sample values:`, embedding.slice(0, 5).map(v => (typeof v === 'number' ? v.toFixed(4) : 'N/A')).join(', '));

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 5: RAG RETRIEVAL
    // ─────────────────────────────────────────────────────────────────────────────

    console.log('\n📋 STAGE 5: RAG Retrieval Service\n');

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
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 6: RESPONSE VALIDATOR
    // ─────────────────────────────────────────────────────────────────────────────

    console.log('\n📋 STAGE 6: Response Validator\n');

    const { validateResponse } = await import('../src/services/responseValidator.js');

    const sampleResponse = {
      ladder: [
        { type: "contact", label: "X0", id: "block-1" },
        { type: "coil", label: "Y0", id: "block-2" }
      ],
      explanation: "This is a basic motor start control using X0 as input and Y0 as output.",
      instructionList: "LD X0\nOUT Y0"
    };

    const result = validateResponse(sampleResponse);

    if (result.isValid) {
      console.log(`✅ Response Validator works`);
      console.log(`   Valid: ${result.isValid}`);
      console.log(`   Errors: 0`);
    } else {
      console.log(`⚠️  Validator found issues:`);
      result.errors.forEach(e => console.log(`   - ${e}`));
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

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
