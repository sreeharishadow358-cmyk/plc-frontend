import { LadderBlock } from '../store/plcStore';

export interface LogicGenerationResult {
    ladder: LadderBlock[];
    explanation: string;
    instructionList: string;
}

export const generateLogic = async (input: string): Promise<LogicGenerationResult> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Intentionally ignoring the actual input for the mock API response, but logging to avoid unused var warning
            console.log('Generating artificial logic for input:', input);
            resolve({
                ladder: [
                    { type: "contact", label: "X0" },
                    { type: "contact_nc", label: "X2" },
                    { type: "coil", label: "Y0" }
                ],
                explanation: "Based on the input logic description:\n- X0 acts as the start contact (normally open).\n- X2 acts as an emergency stop or safety interlocking condition (normally closed).\n- Y0 is the output coil representing the activated motor or device.\n\n⚠️ Ensure Emergency Stop is also hardwired for safety redundancy.",
                instructionList: "LD X0\nANDN X2\nOUT Y0"
            });
        }, 1000);
    });
};
