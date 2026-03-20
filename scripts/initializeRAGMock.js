#!/usr/bin/env node

/**
 * Mock RAG Initialization - Creates sample vector database
 * This allows testing the full RAG system with example ladder logic patterns
 * 
 * Usage: npm run rag:init:mock
 * Or:    node scripts/initializeRAGMock.js
 */

import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock function to generate embeddings (simplified for testing)
// In production, this would use @xenova/transformers
function generateMockEmbedding(text) {
  // Generate a deterministic embedding based on text hash
  const vector = new Array(384).fill(0);
  let hash = 0;
  
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Seed the vector with the hash
  for (let i = 0; i < vector.length; i++) {
    const seed = (hash + i) * 12345678;
    vector[i] = Math.sin(seed) * 0.5 + 0.5; // Normalized between 0-1
  }
  
  return vector;
}

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║            MOCK RAG SYSTEM INITIALIZATION                                  ║
║        Sample PLC Ladder Logic Vector Database Creation                    ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// Sample ladder logic patterns from PLC manuals
const SAMPLE_CHUNKS = [
  {
    text: "Motor Start Stop Control. Use NO contact for start button X0. Use NC contact for stop button X1. Output motor contactor Y0. Wiring pattern: LD X0 AND X1 OUT Y0.",
    source: "Mitsubishi_PLC_Basics.pdf",
    pageNumber: 45
  },
  {
    text: "Safety Interlock Logic. Emergency stop must be NC normally closed contact. Safety interlock X2 prevents motor from running. Design: LD X0 ANI X1 ANI X2 OUT Y0 for safe operation.",
    source: "Safety_Standards.pdf",
    pageNumber: 78
  },
  {
    text: "Timer Delay Application. Use timer T0 with 5 second delay for equipment soft start. After delay, activate output Y0. Timer reset on X1 stop signal. Ladder: LD X0 OUT T0 LD T0 OUT Y0.",
    source: "Timer_Functions.pdf",
    pageNumber: 112
  },
  {
    text: "Conveyor Belt Control. Start button X0, emergency stop X1, and running indicator lamp Y1. Motor contactor Y0. Logic: LD X0 ANI X1 OUT Y0 AND OUT Y1.",
    source: "Industrial_Applications.pdf",
    pageNumber: 234
  },
  {
    text: "Counter Logic for Production Count. Up counter C0 triggered by X0, reset by X1. Count to 100 pieces. Output Y0 when count reached. Use auxiliary relay M0 for status.",
    source: "Counter_Programming.pdf",
    pageNumber: 156
  },
  {
    text: "Normally Open Contact NO represents active high input. X addresses are input terminals. Y addresses are output terminals. M addresses are internal memory relays for intermediate logic.",
    source: "Addressing_Guide.pdf",
    pageNumber: 32
  },
  {
    text: "Normally Closed Contact NC provides inverted logic. NC contacts are used for stop buttons and safety interlocks. Always use NC for emergency stops per IEC 61131 standards.",
    source: "Contact_Types.pdf",
    pageNumber: 89
  },
  {
    text: "Mitsubishi GX Works2 software programming mnemonic instructions: LD loads first NO contact, LDI loads first NC contact, AND adds series contact, ANI adds series NC contact, OUT outputs to coil.",
    source: "GX_Works_Manual.pdf",
    pageNumber: 201
  },
  {
    text: "Analog Processing with D addresses. D0-D9999 store sensor values, counter values, and timer values. Read analog input from X group, process with counters, output to Y group and D registers.",
    source: "Data_Registers.pdf",
    pageNumber: 145
  },
  {
    text: "Pump Control with Auto Shutoff. Start pump with X0, after 10 seconds pressure sensor X2 confirms operation. If no pressure detected, activate alarm Y2. Emergency stop X1 overrides all.",
    source: "Pump_Control_Examples.pdf",
    pageNumber: 287
  }
];

async function initializeMockRAG() {
  try {
    console.log('📋 STEP 1: Preparing sample chunks...\n');
    
    const chunks = SAMPLE_CHUNKS;
    console.log(`✅ Prepared ${chunks.length} sample chunks\n`);

    console.log('📋 STEP 2: Generating embeddings for chunks...\n');

    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = generateMockEmbedding(chunk.text);
      
      embeddings.push({
        id: `chunk-${i}`,
        text: chunk.text,
        source: chunk.source,
        pageNumber: chunk.pageNumber,
        embedding,
      });

      const progress = Math.round(((i + 1) / chunks.length) * 100);
      console.log(`  ✅ [${progress}%] Generated embedding for chunk ${i + 1}/${chunks.length}`);
    }

    console.log(`\n✅ Generated ${embeddings.length} embeddings\n`);

    // Save embeddings to vector database
    console.log('📋 STEP 3: Saving embeddings to vector database...\n');
    
    const vectorCacheDir = path.join(process.cwd(), '.vector-cache');
    if (!fs.existsSync(vectorCacheDir)) {
      fs.mkdirSync(vectorCacheDir, { recursive: true });
    }

    const embeddingsFile = path.join(vectorCacheDir, 'embeddings.json');
    const metadataFile = path.join(vectorCacheDir, 'metadata.json');

    fs.writeFileSync(embeddingsFile, JSON.stringify(embeddings, null, 2));
    
    const metadata = {
      initialized: new Date().toISOString(),
      totalChunks: embeddings.length,
      embeddingDimension: 384,
      model: "mock-embedding",
      sources: [...new Set(embeddings.map(e => e.source))],
    };
    
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    console.log(`✅ Saved embeddings to: ${embeddingsFile}`);
    console.log(`✅ Saved metadata to: ${metadataFile}\n`);

    console.log('📋 STEP 4: Verification...\n');
    
    const stats = {
      totalChunks: embeddings.length,
      embeddingDimension: embeddings[0]?.embedding.length || 0,
      uniqueSources: new Set(embeddings.map(e => e.source)).size,
      vectorDatabaseSize: `${(JSON.stringify(embeddings).length / 1024).toFixed(2)} KB`,
    };

    console.log('✅ INITIALIZATION COMPLETE');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`  Total chunks created:       ${stats.totalChunks}`);
    console.log(`  Embedding dimension:        ${stats.embeddingDimension}`);
    console.log(`  Unique source documents:    ${stats.uniqueSources}`);
    console.log(`  Vector DB size:             ${stats.vectorDatabaseSize}`);
    console.log('════════════════════════════════════════════════════════════════');
    console.log('\n✨ Mock RAG system is ready for testing!');
    console.log('💡 To use real PDFs, replace sample chunks with PDF processing code.\n');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

initializeMockRAG();
