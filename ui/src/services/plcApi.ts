import axios from 'axios';
import type { LadderProject } from '@/types/ladder';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';
const API_URL = API_BASE_URL ? `${API_BASE_URL}/api/generate-logic` : '/api/generate-logic';

export interface LogicGenerationResult {
    project: LadderProject;
    explanation: string;
    instructionList: string;
    metadata: {
        ragStatus: "active" | "not_initialized" | "no_results";
        sourceDocuments: string[];
    };
}

export const generateLogic = async (input: string): Promise<LogicGenerationResult> => {
    const response = await axios.post<LogicGenerationResult>(
        API_URL,
        { input },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        }
    );

    return response.data;
};
