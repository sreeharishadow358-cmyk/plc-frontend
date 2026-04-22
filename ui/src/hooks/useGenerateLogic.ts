import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { generateLogic } from '../services/plcApi';
import { usePlcStore } from '../store/plcStore';

export const useGenerateLogic = () => {
    const { setLadderData, setExplanation, setInstructionList, setLoading, setErrorMessage } = usePlcStore();

    return useMutation({
        mutationFn: (input: string) => generateLogic(input),
        onMutate: () => {
            setLoading(true);
            setErrorMessage('');
        },
        onSuccess: (data) => {
            setLadderData(data.project.rungs);
            setExplanation(data.explanation);
            setInstructionList(data.instructionList);
        },
        onError: (error) => {
            console.error('Logic Generation Failed:', error);
            const msg =
                isAxiosError(error) && typeof error.response?.data?.error === 'string'
                    ? error.response.data.error
                    : 'Logic generation failed. Please try again.';
            setErrorMessage(msg);
        },
        onSettled: () => {
            setLoading(false);
        },
    });
};
