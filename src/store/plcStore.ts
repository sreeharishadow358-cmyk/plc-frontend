import { create } from 'zustand';

export type LadderBlockType = 'contact' | 'contact_nc' | 'coil';

export interface LadderBlock {
    type: LadderBlockType;
    label: string;
}

interface PlcState {
    inputText: string;
    ladderData: LadderBlock[];
    explanation: string;
    instructionList: string;
    isLoading: boolean;

    setInputText: (text: string) => void;
    setLadderData: (data: LadderBlock[]) => void;
    setExplanation: (text: string) => void;
    setInstructionList: (text: string) => void;
    setLoading: (isLoading: boolean) => void;
    resetAll: () => void;
}

export const usePlcStore = create<PlcState>((set) => ({
    inputText: '',
    ladderData: [],
    explanation: '',
    instructionList: '',
    isLoading: false,

    setInputText: (text) => set({ inputText: text }),
    setLadderData: (data) => set({ ladderData: data }),
    setExplanation: (text) => set({ explanation: text }),
    setInstructionList: (text) => set({ instructionList: text }),
    setLoading: (isLoading) => set({ isLoading }),
    resetAll: () => set({
        inputText: '',
        ladderData: [],
        explanation: '',
        instructionList: '',
        isLoading: false,
    })
}));
