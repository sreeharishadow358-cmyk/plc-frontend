import { useMutation } from '@tanstack/react-query';
import { generateLogic } from '../services/plcApi';
import { usePlcStore } from '../store/plcStore';

export const useGenerateLogic = () => {
    const { setLadderData, setExplanation, setInstructionList, setLoading } = usePlcStore();

    return useMutation({
        mutationFn: (input: string) => generateLogic(input),
        onMutate: () => {
            setLoading(true);
        },
        onSuccess: (data) => {
            setLadderData(data.ladder);
            setExplanation(data.explanation);
            setInstructionList(data.instructionList);
        },
        onError: (error) => {
            console.error('Logic Generation Failed:', error);
            // Depending on requirements, we could set an error state here
        },
        onSettled: () => {
            setLoading(false);
        },
    });
};
