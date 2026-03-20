import { NextRequest, NextResponse } from 'next/server';
import type { LadderBlock } from '@/types/ladder';
import { validateApiRequest, errorResponse, successResponse } from '@/lib/apiMiddleware';
import { retrieveContext, constructRAGPrompt, isRAGInitialized } from '@/services/ragService';
import { validateAndFixResponse } from '@/services/responseValidator';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LogicGenerationResult {
    ladder: LadderBlock[];
    explanation: string;
    instructionList: string;
}

// ─────────────────────────────────────────────
// System Prompt — tells the AI exactly what to return.
// Mirrors the schema defined in ladder_logic_schema.json.
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a Mitsubishi PLC ladder logic expert. Convert natural language automation instructions into structured PLC ladder logic.

You MUST respond with ONLY a valid JSON object — no markdown, no explanation outside the JSON, no code blocks. Return exactly this structure:

{
  "ladder": [
    { "type": "contact" | "contact_nc" | "coil", "label": "<PLC address>" }
  ],
  "explanation": "<human-readable explanation with newlines>",
  "instructionList": "<Mitsubishi GX Works mnemonic instructions, one per line>"
}

LADDER RULES:
- "contact" = Normally Open (NO). Symbol: -| |-. Instruction: LD or AND. Use for: start buttons, sensor triggers.
- "contact_nc" = Normally Closed (NC). Symbol: -|/|-. Instruction: LDI or ANI. Use for: stop buttons, emergency stops, safety interlocks.
- "coil" = Output Coil. Symbol: -( )-. Instruction: OUT. Use for: motors (Y addresses), lamps, internal relays (M addresses).
- Contacts FIRST, coil LAST in the array.
- One coil per rung.
- Use Mitsubishi addresses: X0-X377 (inputs), Y0-Y377 (outputs), M0-M9999 (internal relays).

INSTRUCTION LIST RULES:
- LD = first NO contact in rung
- LDI = first NC contact in rung
- AND = series NO contact
- ANI = series NC contact
- OUT = output coil
- Always end with END on the last line

EXPLANATION RULES:
- Use bullet points starting with -
- Explain each contact and coil
- Add a ⚠️ warning for any safety-critical logic (emergency stops, interlocks)
- Use \\n for line breaks

EXAMPLE OUTPUT for "Start motor X0, stop X1, emergency stop X2, output Y0":
{
  "ladder": [
    { "type": "contact", "label": "X0" },
    { "type": "contact_nc", "label": "X1" },
    { "type": "contact_nc", "label": "X2" },
    { "type": "coil", "label": "Y0" }
  ],
  "explanation": "Motor start/stop control with emergency stop:\\n- X0 (NO) is the Start pushbutton.\\n- X1 (NC) is the Stop pushbutton — breaks circuit when pressed.\\n- X2 (NC) is the Emergency Stop interlock.\\n- Y0 is the motor output contactor.\\n\\n⚠️ Emergency stop X2 should also be hardwired in the physical panel for redundancy.",
  "instructionList": "LD X0\\nANI X1\\nANI X2\\nOUT Y0\\nEND"
}`;

// ─────────────────────────────────────────────
// POST /api/generate-logic (PRIVATE API)
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        // ── SECURITY: Validate request ──────────────────────────
        const validation = validateApiRequest(req);
        if (!validation.valid) {
            return errorResponse(validation.message || 'Invalid request', 429);
        }

        // ── SECURITY: Verify Groq API key is configured ──────────
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_')) {
            console.error('❌ GROQ_API_KEY not configured in .env.local');
            return errorResponse(
                'API not configured. Please add GROQ_API_KEY to .env.local',
                500
            );
        }

        // ── Parse and validate request body ──────────────────────
        const body = await req.json();
        const { input } = body;

        if (!input || typeof input !== 'string' || input.trim().length === 0) {
            return errorResponse('Input is required and must be a non-empty string.', 400);
        }

        if (input.trim().length > 5000) {
            return errorResponse('Input exceeds maximum length of 5000 characters.', 400);
        }

        // ──────────────────────────────────────────────────────────
        // RAG: RETRIEVE CONTEXT FROM KNOWLEDGE BASE
        // ──────────────────────────────────────────────────────────
        let retrievedContext = null;
        let ragStatus = "disabled";

        if (isRAGInitialized()) {
            try {
                console.log("🔍 [RAG] Retrieving context for query...");
                retrievedContext = await retrieveContext(input, 4);
                
                if (retrievedContext.chunks.length > 0) {
                    console.log(`✅ [RAG] Retrieved ${retrievedContext.chunks.length} relevant chunks`);
                    ragStatus = "active";
                } else {
                    console.log("ℹ️ [RAG] No similar chunks found in knowledge base");
                    ragStatus = "no_results";
                }
            } catch (ragError) {
                console.error("⚠️ [RAG] Context retrieval failed:", ragError);
                ragStatus = "error";
                // Continue without RAG - don't fail the entire request
            }
        } else {
            console.log("ℹ️ [RAG] Vector database not initialized - skipping context retrieval");
            ragStatus = "not_initialized";
        }

        // ──────────────────────────────────────────────────────────
        // CONSTRUCT PROMPT WITH RAG CONTEXT
        // ──────────────────────────────────────────────────────────
        let finalPrompt = SYSTEM_PROMPT;
        
        if (retrievedContext && retrievedContext.combinedContext.length > 0) {
            finalPrompt = constructRAGPrompt(input, retrievedContext, SYSTEM_PROMPT);
        } else {
            // Fallback to user input only
            finalPrompt += `\n\nUSER REQUEST:\n${input}`;
        }

        // ──────────────────────────────────────────────────────────
        // CALL GROQ API WITH RAG-ENHANCED PROMPT
        // ──────────────────────────────────────────────────────────
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                temperature: 0.2,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: finalPrompt },
                ],
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error('Groq API error:', errText);
            let errMessage = `Groq API error: ${groqRes.status}`;
            try {
                const errJson = JSON.parse(errText);
                if (errJson?.error?.message) errMessage = errJson.error.message;
            } catch { /* keep generic message */ }
            return errorResponse(errMessage, 502);
        }

        const groqData = await groqRes.json();
        const raw = groqData.choices?.[0]?.message?.content;

        if (!raw) {
            return errorResponse('AI service returned empty response. Please try again.', 502);
        }

        // ──────────────────────────────────────────────────────────
        // PARSE & VALIDATE RESPONSE WITH COMPREHENSIVE VALIDATION
        // ──────────────────────────────────────────────────────────
        let parsed: LogicGenerationResult;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            console.error('JSON parse failed. Raw response:', raw);
            return errorResponse(
                'AI returned invalid JSON format. Please try again.',
                502
            );
        }

        // Validate response with auto-fix capabilities
        const validation_result = validateAndFixResponse(parsed, true);

        if (!validation_result.valid) {
            console.error('❌ Response validation failed:', validation_result.errors);
            return errorResponse(
                `Response validation failed: ${validation_result.errors.join(', ')}`,
                502
            );
        }

        // Use fixed response if available
        const finalResponse = validation_result.fixedResponse || parsed;

        // Log warnings if any
        if (validation_result.warnings.length > 0) {
            console.warn('⚠️ Response warnings:', validation_result.warnings);
        }

        // Add RAG status to response metadata
        const responseWithMetadata = {
            ...finalResponse,
            _meta: {
                ragStatus,
                sourceDocuments: retrievedContext?.sourceDocuments ? Array.from(retrievedContext.sourceDocuments) : [],
            },
        };

        return successResponse(responseWithMetadata);

    } catch (error) {
        console.error('❌ Unexpected error in /api/generate-logic:', error);
        return errorResponse('Internal server error. Please try again later.', 500);
    }
}
