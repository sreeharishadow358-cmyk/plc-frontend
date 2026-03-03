import axios from 'axios';
import { LadderBlock } from '../store/plcStore';

export interface LogicGenerationResult {
    ladder: LadderBlock[];
    explanation: string;
    instructionList: string;
}

// ─────────────────────────────────────────────
// generateLogic
// Calls the Next.js API route which forwards to Gemini.
// Swap the URL to an external backend if you move off Next.js.
// ─────────────────────────────────────────────
export const generateLogic = async (input: string): Promise<LogicGenerationResult> => {
    const response = await axios.post<LogicGenerationResult>(
        '/api/generate-logic',
        { input },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000, // 30s — AI calls can be slow on first token
        }
    );

    return response.data;
};
