import { create } from 'zustand';
import type { LadderBlock } from '@/types/ladder';

// Re-export for backward compatibility
export type { LadderBlock };

interface PlcState {
    inputText: string;
    ladderData: LadderBlock[];
    explanation: string;
    instructionList: string;
    isLoading: boolean;
    errorMessage: string;

    setInputText: (text: string) => void;
    setLadderData: (data: LadderBlock[]) => void;
    setExplanation: (text: string) => void;
    setInstructionList: (text: string) => void;
    setLoading: (isLoading: boolean) => void;
    setErrorMessage: (msg: string) => void;
    resetAll: () => void;
}

export const usePlcStore = create<PlcState>((set) => ({
    inputText: '',
    ladderData: [],
    explanation: '',
    instructionList: '',
    isLoading: false,
    errorMessage: '',

    setInputText: (text) => set({ inputText: text }),
    setLadderData: (data) => set({ ladderData: data }),
    setExplanation: (text) => set({ explanation: text }),
    setInstructionList: (text) => set({ instructionList: text }),
    setLoading: (isLoading) => set({ isLoading }),
    setErrorMessage: (msg) => set({ errorMessage: msg }),
    resetAll: () => set({
        inputText: '',
        ladderData: [],
        explanation: '',
        instructionList: '',
        isLoading: false,
        errorMessage: '',
    })
}));
