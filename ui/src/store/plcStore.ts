import { create } from 'zustand';
import type { LadderRung } from '@/types/ladder';
import type { Intent } from '@/types/intent';

// Re-export for backward compatibility
export type { LadderRung };

interface PlcState {
    inputText: string;
    intent: Intent | null;
    ladderData: LadderRung[];
    explanation: string;
    instructionList: string;
    isLoading: boolean;
    errorMessage: string;

    setInputText: (text: string) => void;
    setIntent: (intent: Intent | null) => void;
    setLadderData: (data: LadderRung[]) => void;
    setExplanation: (text: string) => void;
    setInstructionList: (text: string) => void;
    setLoading: (isLoading: boolean) => void;
    setErrorMessage: (msg: string) => void;
    resetAll: () => void;
}

export const usePlcStore = create<PlcState>((set) => ({
    inputText: '',
    intent: null,
    ladderData: [],
    explanation: '',
    instructionList: '',
    isLoading: false,
    errorMessage: '',

    setInputText: (text) => set({ inputText: text }),
    setIntent: (intent) => set({ intent }),
    setLadderData: (data) => set({ ladderData: data }),
    setExplanation: (text) => set({ explanation: text }),
    setInstructionList: (text) => set({ instructionList: text }),
    setLoading: (isLoading) => set({ isLoading }),
    setErrorMessage: (msg) => set({ errorMessage: msg }),
    resetAll: () => set({
        inputText: '',
        intent: null,
        ladderData: [],
        explanation: '',
        instructionList: '',
        isLoading: false,
        errorMessage: '',
    })
}));
