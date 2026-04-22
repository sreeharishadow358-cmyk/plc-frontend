import { LadderRung, LadderBlock } from '../types/ladder.js';
import { LogicStructure } from './logicBuilder.js';

export interface CompiledLadder {
  instructionList: string;
  ladder: LadderRung[];
}

export function compileToLadder(logic: LogicStructure): CompiledLadder {
  const instructionList = logic.instructions;
  const lines = instructionList.split('\n').map((line) => line.trim()).filter(Boolean);

  const blocks: LadderBlock[] = [];
  let blockId = 1;

  for (const line of lines) {
    const parts = line.split(' ');
    if (parts.length !== 2) continue;
    const [op, addr] = parts;

    let type: LadderBlock['type'];
    if (op === 'LD') {
      type = 'contact';
    } else if (op === 'ANI') {
      type = 'contact_nc';
    } else if (op === 'OUT') {
      type = 'coil';
    } else {
      continue;
    }

    blocks.push({
      id: blockId.toString(),
      type,
      label: addr,
    });
    blockId += 1;
  }

  const rung: LadderRung = {
    id: 1,
    blocks,
  };

  return {
    instructionList,
    ladder: [rung],
  };
}
