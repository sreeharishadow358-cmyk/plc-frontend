#!/usr/bin/env node

/**
 * RAG System Diagnostic Script
 * 
 * Verifies that the RAG system is properly configured and functional.
 * 
 * Usage: npm run rag:diag
 * Or:    node scripts/diagnostics.js
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   RAG SYSTEM DIAGNOSTIC TOOL                               ║
║                 Checking system configuration and status                   ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function pass(msg) {
  console.log(`  ✅ ${msg}`);
  passCount++;
}

function fail(msg) {
  console.log(`  ❌ ${msg}`);
  failCount++;
}

function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
  warnCount++;
}

async function runDiagnostics() {
  console.log('\n📋 CHECKING CONFIGURATION...\n');

  // Check 1: Node version
  const nodeVersion = process.version;
  if (parseFloat(nodeVersion.slice(1)) >= 16) {
    pass(`Node.js version: ${nodeVersion}`);
  } else {
    fail(`Node.js version: ${nodeVersion} (requires 16+)`);
  }

  // Check 2: Environment variables
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && !groqKey.includes('your_')) {
    pass(`GROQ_API_KEY configured`);
  } else {
    fail(`GROQ_API_KEY not configured (see .env.example)`);
  }

  // Check 3: Dependencies installed
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const requiredDeps = ['pdf-parse', '@xenova/transformers', 'js-tiktoken'];
    
    let allDepsPresent = true;
    for (const dep of requiredDeps) {
      if (!pkg.dependencies[dep]) {
        fail(`Missing dependency: ${dep}`);
        allDepsPresent = false;
      }
    }
    if (allDepsPresent) {
      pass(`All RAG dependencies installed`);
    }
  }

  // Check 4: node_modules exist
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    pass(`node_modules directory exists`);
  } else {
    fail(`node_modules not found - run: npm install`);
  }

  // Check 5: Dataset folder
  console.log('\n📋 CHECKING PDF DATASET...\n');
  
  const datasetPath = path.join(projectRoot, 'dataset');
  if (fs.existsSync(datasetPath)) {
    pass(`dataset/ directory found`);
    
    const files = fs.readdirSync(datasetPath);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length > 0) {
      pass(`Found ${pdfFiles.length} PDF file(s):`);
      pdfFiles.forEach(f => console.log(`      • ${f}`));
    } else {
      warn(`No PDF files found in dataset/`);
    }
  } else {
    fail(`dataset/ directory not found`);
  }

  // Check 6: Vector database
  console.log('\n📋 CHECKING VECTOR DATABASE...\n');
  
  const vectorCachePath = path.join(projectRoot, '.vector-cache');
  if (fs.existsSync(vectorCachePath)) {
    pass(`Vector database found at: .vector-cache/`);
    
    const embeddingsPath = path.join(vectorCachePath, 'embeddings.json');
    if (fs.existsSync(embeddingsPath)) {
      try {
        const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));
        const count = embeddings.length;
        pass(`Database contains ${count} embeddings`);
        
        if (count === 0) {
          warn(`Vector database is empty - run: npm run rag:init`);
        }
      } catch (e) {
        fail(`unable to parse embeddings.json: ${e.message}`);
      }
    } else {
      fail(`embeddings.json not found - run: npm run rag:init`);
    }
    
    const metadataPath = path.join(vectorCachePath, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        pass(`Embedding dimension: ${metadata.embeddingDim}`);
        pass(`Model: ${metadata.model}`);
      } catch (e) {
        warn(`unable to read metadata: ${e.message}`);
      }
    }
  } else {
    warn(`Vector database not found - RAG not initialized`);
    warn(`To initialize, run: npm run rag:init`);
  }

  // Check 7: Source files
  console.log('\n📋 CHECKING SOURCE FILES...\n');
  
  const requiredFiles = [
    'src/services/pdfProcessor.ts',
    'src/services/embeddingService.ts',
    'src/services/ragService.ts',
    'src/services/responseValidator.ts',
    'src/app/api/generate-logic/route.ts',
    'scripts/initializeRAG.js',
  ];
  
  for (const file of requiredFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      pass(`${file}`);
    } else {
      fail(`${file} - MISSING`);
    }
  }

  // Check 8: Documentation
  console.log('\n📋 CHECKING DOCUMENTATION...\n');
  
  const docs = [
    'RAG_SETUP.md',
    'RAG_QUICKSTART.md',
  ];
  
  for (const doc of docs) {
    const fullPath = path.join(projectRoot, doc);
    if (fs.existsSync(fullPath)) {
      pass(`${doc}`);
    } else {
      warn(`${doc} - not found (optional)`);
    }
  }

  // Summary
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                          DIAGNOSTIC SUMMARY                               ║
╚════════════════════════════════════════════════════════════════════════════╝

  ✅ Passed: ${passCount}
  ❌ Failed: ${failCount}
  ⚠️  Warnings: ${warnCount}
`);

  if (failCount === 0 && warnCount === 0) {
    console.log('  🚀 RAG System is fully configured and ready!\n');
    console.log('  Next steps:');
    console.log('    1. Initialize: npm run rag:init');
    console.log('    2. Start:      npm run dev');
    console.log('    3. Test:       Try generating ladder logic\n');
  } else if (failCount === 0) {
    console.log('  ℹ️  System is mostly ready, but see warnings above.\n');
    console.log('  Recommendations:');
    if (!fs.existsSync(path.join(projectRoot, '.vector-cache'))) {
      console.log('    • Initialize vector DB: npm run rag:init');
    }
    console.log('    • Check warnings above\n');
  } else {
    console.log('  ❌ System has issues. Fix failures above before proceeding.\n');
    console.log('  Common fixes:');
    console.log('    • Install dependencies: npm install');
    console.log('    • Set GROQ_API_KEY in .env.local');
    console.log('    • Create dataset/ folder with PDFs\n');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

runDiagnostics().catch(error => {
  console.error('Diagnostic error:', error);
  process.exit(1);
});
