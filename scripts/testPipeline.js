#!/usr/bin/env node

/**
 * RAG pipeline test for the current monorepo layout.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

function section(title) {
  console.log(`\n== ${title} ==\n`);
}

async function main() {
  try {
    console.log('\nRAG pipeline diagnostic\n');

    section('Dataset');
    const datasetPath = path.join(projectRoot, 'dataset');
    if (!fs.existsSync(datasetPath)) {
      throw new Error(`dataset directory not found at ${datasetPath}`);
    }

    const pdfFiles = fs.readdirSync(datasetPath).filter((file) => file.toLowerCase().endsWith('.pdf'));
    console.log(`Found ${pdfFiles.length} PDF file(s)`);
    pdfFiles.forEach((file, index) => {
      const filePath = path.join(datasetPath, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${index + 1}. ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });

    section('PDF Processing');
    const { processPDFs } = await import('../ai/src/services/pdfProcessor.ts');
    const chunks = await processPDFs();
    console.log(`Generated ${chunks.length} chunk(s) from the dataset`);
    if (chunks[0]) {
      console.log(`First chunk source: ${chunks[0].source}`);
      console.log(`First chunk length: ${chunks[0].text.length} characters`);
    }

    section('Vector Database');
    const { getVectorDatabaseStats } = await import('../ai/src/services/embeddingService.ts');
    const vectorStats = getVectorDatabaseStats();
    console.log(`Database path: ${vectorStats.path}`);
    console.log(`Initialized: ${vectorStats.exists}`);
    console.log(`Embedding count: ${vectorStats.count}`);
    console.log(`Embedding dimension: ${vectorStats.embeddingDim}`);

    section('Retrieval');
    const { retrieveContext } = await import('../ai/src/services/ragService.ts');
    const query = 'motor control startup sequence';
    const context = await retrieveContext(query);
    console.log(`Query: ${query}`);
    console.log(`Retrieved chunks: ${context.chunks.length}`);
    console.log(`Combined context length: ${context.combinedContext.length}`);

    section('Validation');
    const { validateAIResponse } = await import('../ai/src/services/responseValidator.ts');
    const sampleResponse = {
      ladder: [
        { type: 'contact', label: 'X0', id: 'block-1' },
        { type: 'coil', label: 'Y0', id: 'block-2' },
      ],
      explanation: 'Basic start and output control.',
      instructionList: 'LD X0\nOUT Y0\nEND',
    };
    const validation = validateAIResponse(sampleResponse);
    console.log(`Valid sample response: ${validation.isValid}`);
    if (validation.errors.length > 0) {
      validation.errors.forEach((error) => console.log(`  - ${error}`));
    }

    section('Summary');
    console.log('Pipeline check completed.');
    console.log('If retrieval returned zero chunks, run npm run rag:init or npm run rag:init:mock.');
  } catch (error) {
    console.error(`Pipeline test failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
