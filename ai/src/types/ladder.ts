export interface LadderBlock {
  id: string;
  type: 'contact' | 'contact_nc' | 'coil' | 'timer' | 'counter';
  label: string;
}

export interface LadderRung {
  id: number;
  blocks: LadderBlock[];
}

export interface LadderProject {
  name: string;
  rungs: LadderRung[];
}
