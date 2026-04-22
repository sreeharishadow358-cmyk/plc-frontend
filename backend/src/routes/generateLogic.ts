import { Router } from 'express';
import Groq from 'groq-sdk';
import { validateApiRequest, errorResponse, successResponse } from '../lib/apiMiddleware.js';
import { retrieveContext } from '@plc/ai';
import { validateSafety } from '../services/safetyValidator.js';
import { validateResponse } from '../services/responseValidator.js';

const SYSTEM_PROMPT = `You are an expert Mitsubishi PLC engineer with 20+ years of experience.

Your task is to generate ladder logic JSON based on user instructions.

CRITICAL REQUIREMENTS:
- Generate VALID JSON only - no extra text, no explanations outside JSON
- Follow Mitsubishi PLC addressing: X (inputs), Y (outputs), M (internal relays), T (timers), C (counters)
- Include safety logic: emergency stops should be normally closed contacts
- Output must be a single rung (one LadderRung object in rungs array)
- Each rung has id (number) and blocks (array of LadderBlock)

JSON SCHEMA:
{
  "project": {
    "name": "Generated Ladder Logic",
    "rungs": [
      {
        "id": 0,
        "blocks": [
          {"id": "block1", "type": "contact", "label": "X0"},
          {"id": "block2", "type": "contact_nc", "label": "X2"},
          {"id": "block3", "type": "coil", "label": "Y0"}
        ]
      }
    ]
  },
  "explanation": "Human-readable explanation of the logic",
  "instructionList": "Mitsubishi instruction list format"
}

BLOCK TYPES:
- contact: Normally open contact (LD/AND)
- contact_nc: Normally closed contact (LDI/ANDN) - for emergency stops
- coil: Output coil (OUT)

SAFETY FIRST: Always include emergency stop as normally closed if mentioned.`;

export const generateLogicRouter = Router();

generateLogicRouter.post('/', async (req, res) => {
  const validation = validateApiRequest(req);
  if (!validation.valid) {
    return errorResponse(res, validation.message ?? 'Invalid request', 400);
  }

  const { input } = req.body as { input?: unknown };
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return errorResponse(res, 'Input is required and must be a non-empty string.', 400);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_')) {
    console.error('❌ GROQ_API_KEY not configured');
    return errorResponse(res, 'AI API not configured. Please add GROQ_API_KEY to .env.local', 500);
  }

  let ragContext = '';
  let ragStatus: 'active' | 'not_initialized' | 'no_results' = 'not_initialized';
  let sourceDocuments: string[] = [];

  try {
    const contextResult = await retrieveContext(input);
    if (contextResult.chunks.length > 0) {
      ragContext = contextResult.combinedContext;
      ragStatus = 'active';
      sourceDocuments = Array.from(contextResult.sourceDocuments);
    } else {
      ragStatus = 'no_results';
    }
  } catch (ragError) {
    console.warn('RAG retrieval failed, continuing without context:', ragError);
    ragStatus = 'not_initialized';
  }

  const userPrompt = ragContext
    ? `CONTEXT FROM PLC MANUALS:\n${ragContext}\n\nUSER INSTRUCTION:\n${input}\n\nGenerate ladder logic JSON based on the above context and instruction.`
    : `USER INSTRUCTION:\n${input}\n\nGenerate ladder logic JSON based on the instruction.`;

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  try {
    const groq = new Groq({ apiKey });
    const aiResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: fullPrompt }],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const aiContent = aiResponse.choices[0]?.message?.content?.trim();
    if (!aiContent) {
      return errorResponse(res, 'AI returned empty response', 500);
    }

    let parsedResponse;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiContent);
      return errorResponse(res, 'AI response was not valid JSON', 500);
    }

    if (!parsedResponse.project || !parsedResponse.explanation || !parsedResponse.instructionList) {
      return errorResponse(res, 'AI response missing required fields', 500);
    }

    const project = parsedResponse.project;
    const explanation = parsedResponse.explanation;
    const instructionList = parsedResponse.instructionList;

    if (project.rungs && project.rungs.length > 0) {
      const firstRung = project.rungs[0];
      const responseValidation = validateResponse({
        ladder: firstRung.blocks,
        explanation,
        instructionList,
      });
      if (!responseValidation.valid) {
        console.warn('Response validation failed:', responseValidation.errors);
      }
    }

    const logic = { instructions: instructionList };
    const validationResult = validateSafety({ type: 'unknown' }, logic);
    if (!validationResult.valid) {
      console.warn('Safety validation warnings:', validationResult.warnings);
    }

    const result = {
      project,
      explanation,
      instructionList,
      metadata: {
        ragStatus,
        sourceDocuments,
      },
    };

    return successResponse(res, result);
  } catch (error) {
    console.error('Logic generation error:', error);
    return errorResponse(res, 'Failed to generate logic', 500);
  }
});
