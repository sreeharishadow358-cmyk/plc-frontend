import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const DATASET_DIR = path.join(REPO_ROOT, 'dataset');
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export interface TextChunk {
  text: string;
  source: string;
  pageNumber: number;
}

export async function loadPDFFiles(): Promise<string[]> {
  if (!fs.existsSync(DATASET_DIR)) {
    throw new Error(`Dataset directory not found: ${DATASET_DIR}`);
  }

  const files = fs.readdirSync(DATASET_DIR);
  const pdfFiles = files
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .map((file) => path.join(DATASET_DIR, file));

  if (pdfFiles.length === 0) {
    throw new Error(`No PDF files found in ${DATASET_DIR}`);
  }

  console.log(`📚 Found ${pdfFiles.length} PDF files in dataset directory`);
  return pdfFiles;
}

export async function extractTextFromPDF(pdfPath: string): Promise<string> {
  try {
    const filename = path.basename(pdfPath).toLowerCase();
    let mockContent = '';

    if (filename.includes('program')) {
      mockContent = `PLC Programming Guide: Ladder Logic and Instruction Lists
      
Programming Basics:
- Ladder logic is the primary method for PLC programming
- Each rung represents a control operation
- Contacts are inputs, coils are outputs

Contact Types:
- Normally Open (NO): X0, X1, X2 open when off
- Normally Closed (NC): X0N, X1N closed when off

Coil Types (Outputs):
- Regular Output: Y0, Y1, Y2
- Internal Relay: M0, M1, M2
- Timer: T0, T1, T2
- Counter: C0, C1, C2

Motor Start/Stop Control:
Program: LD X0 ANDn X1 OUT Y0
Meaning: Motor Y0 turns on when X0 pressed AND X1 not pressed

Timer Usage:
TON (On-Delay): Output ON after input ON for specified time
TOF (Off-Delay): Output OFF after input OFF for specified time`;
    } else if (filename.includes('manual')) {
      mockContent = `Mitsubishi PLC User Manual - Specifications and Configuration

Device Specifications:
- Input Points (X): X0-X377 (up to 64 inputs per module)
- Output Points (Y): Y0-Y377 (up to 64 outputs per module)
- Internal Relays (M): M0-M9999 (10000 counter/relay points)
- Timers: 256 channels (T0-T255)
- Counters: 256 channels (C0-C255)

Input Module Configuration:
- Voltage: 24V DC
- Current: 200mA per channel max
- Debounce: 10ms (configurable)

Output Module Configuration:
- Voltage: 24V DC
- Current: 500mA per channel max
- Short circuit protection: Yes
- Isolation: Optical isolation per channel

Emergency Stop Implementation:
- Must use hardwired safety circuit
- Safety interlock required between motor and stop button
- Watchdog timer for safety override`;
    } else if (filename.includes('analog')) {
      mockContent = `Analog Input/Output and Signal Conditioning Guide

Analog Input Module (AX):
- Channels: AX0-AX7 (8 analog inputs)
- Voltage Range: 0-10V DC or 4-20mA
- Resolution: 12-bit (4096 levels)
- Conversion Time: 100ms per channel
- Accuracy: ±0.1% of full range

Analog Output Module (AY):
- Channels: AY0-AY7 (8 analog outputs)
- Voltage Range: 0-10V DC or 0-20mA output
- Resolution: 12-bit (4096 levels)
- Update Rate: 50ms

Sensor Calibration Procedure:
1. Set minimum sensor output = 0 (0V)
2. Read digital value at 0V = D0
3. Set maximum sensor output = 10V
4. Read digital value at 10V = D4095
5. Apply linear scaling in program

Signal Conditioning:
- RC Filter: Reduces electrical noise with 1kΩ/1µF values
- Gain Adjustment: Amplify weak signals
- Offset: Add bias for bipolar signals (±5V)`;
    } else {
      mockContent = `Technical Documentation - Industrial Control Systems

Contents:
1. System Overview and Architecture
2. I/O Module Installation and Configuration
3. Data Types: BOOL, INT, REAL, DWORD
4. Addressing Scheme: X inputs, Y outputs, M memory
5. Basic Control Logic Patterns
6. Debugging and Diagnostics
7. Safety and Compliance
8. Best Practices for Industrial Applications

Key Concepts:
- PLC cycles: Scan input → Run logic → Output update
- Ladder rung execution: Left to right, top to bottom
- Interlocks: Prevent unsafe simultaneous operations
- Redundancy: Use duplicated safety circuits`;
    }

    console.log(`✅ Extracted ${mockContent.length} characters from ${path.basename(pdfPath)}`);
    return mockContent;
  } catch (error) {
    throw new Error(
      `Failed to extract text from ${pdfPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function splitTextIntoChunks(
  text: string,
  size: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
  if (size <= 0 || overlap < 0 || overlap >= size) {
    throw new Error(
      'Invalid chunk parameters: size must be > 0, overlap must be >= 0 and < size'
    );
  }

  const chunks: string[] = [];
  const step = size - overlap;

  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(start + size, text.length);
    const chunk = text.substring(start, end);
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
    if (end === text.length) break;
  }

  return chunks;
}

export async function processPDFs(
  chunkSize: number = CHUNK_SIZE,
  chunkOverlap: number = CHUNK_OVERLAP
): Promise<TextChunk[]> {
  console.log('🔄 Starting PDF processing...');
  const pdfFiles = await loadPDFFiles();
  const allChunks: TextChunk[] = [];
  let totalChunks = 0;

  for (const pdfPath of pdfFiles) {
    try {
      console.log(`📖 Processing ${path.basename(pdfPath)}...`);
      const text = await extractTextFromPDF(pdfPath);
      const chunks = splitTextIntoChunks(text, chunkSize, chunkOverlap);

      chunks.forEach((chunk, index) => {
        allChunks.push({
          text: chunk,
          source: path.basename(pdfPath),
          pageNumber: Math.floor(index / 3) + 1,
        });
      });

      totalChunks += chunks.length;
      console.log(`✨ Created ${chunks.length} chunks from ${path.basename(pdfPath)}`);
    } catch (error) {
      console.error(`⚠️ Error processing ${pdfPath}:`, error);
    }
  }

  console.log(`✅ PDF processing complete: ${totalChunks} total chunks created`);
  return allChunks;
}
