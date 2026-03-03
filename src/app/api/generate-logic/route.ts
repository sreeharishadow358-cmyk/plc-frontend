import { NextRequest, NextResponse } from 'next/server';
import { LadderBlock } from '@/store/plcStore';

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
// POST /api/generate-logic
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { input } = body;

        if (!input || typeof input !== 'string' || input.trim().length === 0) {
            return NextResponse.json(
                { error: 'Input is required and must be a non-empty string.' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GROQ_API_KEY is not configured. Add it to .env.local.' },
                { status: 500 }
            );
        }

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
                    { role: 'user', content: input.trim() },
                ],
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error('Groq API error:', errText);
            let errMessage = `Groq API returned ${groqRes.status}.`;
            try {
                const errJson = JSON.parse(errText);
                if (errJson?.error?.message) errMessage = errJson.error.message;
            } catch { /* keep generic message */ }
            return NextResponse.json({ error: errMessage }, { status: 502 });
        }

        const groqData = await groqRes.json();
        const raw = groqData.choices?.[0]?.message?.content;

        if (!raw) {
            return NextResponse.json(
                { error: 'Groq returned an empty response.' },
                { status: 502 }
            );
        }

        // ── Parse & Validate ─────────────────────────
        let parsed: LogicGenerationResult;
        try {
            parsed = JSON.parse(raw);
        } catch {
            console.error('JSON parse failed. Raw response:', raw);
            return NextResponse.json(
                { error: 'AI returned malformed JSON. Check server logs.' },
                { status: 502 }
            );
        }

        // Basic shape validation before sending to frontend
        if (!Array.isArray(parsed.ladder) || parsed.ladder.length === 0) {
            return NextResponse.json(
                { error: 'AI response is missing valid ladder data.' },
                { status: 502 }
            );
        }

        const validTypes = new Set(['contact', 'contact_nc', 'coil']);
        const isValidLadder = parsed.ladder.every(
            (block) => validTypes.has(block.type) && typeof block.label === 'string'
        );

        if (!isValidLadder) {
            return NextResponse.json(
                { error: 'AI returned invalid ladder block types or missing labels.' },
                { status: 502 }
            );
        }

        return NextResponse.json(parsed, { status: 200 });

    } catch (error) {
        console.error('Unexpected error in /api/generate-logic:', error);
        return NextResponse.json(
            { error: 'Internal server error.' },
            { status: 500 }
        );
    }
}
