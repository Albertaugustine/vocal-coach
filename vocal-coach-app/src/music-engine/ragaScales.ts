export type Note = {
  name: string;
  ratio: number;
};

export type RagaScale = {
  name: string;
  type: 'Hindustani' | 'Carnatic';
  difficulty: 
    | 'BEGINNER_1' | 'BEGINNER_2' | 'BEGINNER_3'
    | 'INTERMEDIATE_1' | 'INTERMEDIATE_2' | 'INTERMEDIATE_3'
    | 'ADVANCED_1' | 'ADVANCED_2' | 'ADVANCED_3';
  notes: Note[];
};

export const RAGA_DATABASE: Record<string, RagaScale> = {
  diagnostic_basic: {
    name: 'Diagnostic Baseline',
    type: 'Hindustani',
    difficulty: 'BEGINNER_1',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Re', ratio: 1.125 },
      { name: 'Ga', ratio: 1.25 }
    ]
  },
  hold_sa: {
    name: 'Shruti Foundation (Hold Sa)',
    type: 'Hindustani',
    difficulty: 'BEGINNER_1',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Sa', ratio: 1.0 },
      { name: 'Sa', ratio: 1.0 }
    ]
  },
  thalam_adi: {
    name: 'Thalam Foundation (Rhythm)',
    type: 'Carnatic',
    difficulty: 'BEGINNER_1',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Sa', ratio: 1.0 },
      { name: 'Pa', ratio: 1.5 }
    ]
  },
  sarali_varisai_1: {
    name: 'Sarali Varisai (Base Scale)',
    type: 'Carnatic',
    difficulty: 'BEGINNER_2',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Ri', ratio: 1.0667 },
      { name: 'Ga', ratio: 1.25 },
      { name: 'Ma', ratio: 1.3333 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha', ratio: 1.6 },
      { name: 'Ni', ratio: 1.875 },
      { name: 'Sa(H)', ratio: 2.0 }
    ]
  },
  jantai_varisai_1: {
    name: 'Jantai Varisai (Double Notes)',
    type: 'Carnatic',
    difficulty: 'BEGINNER_3',
    notes: [
      { name: 'Sa', ratio: 1.0 }, { name: 'Sa', ratio: 1.0 },
      { name: 'Ri', ratio: 1.0667 }, { name: 'Ri', ratio: 1.0667 },
      { name: 'Ga', ratio: 1.25 }, { name: 'Ga', ratio: 1.25 },
      { name: 'Ma', ratio: 1.3333 }, { name: 'Ma', ratio: 1.3333 },
      { name: 'Pa', ratio: 1.5 }, { name: 'Pa', ratio: 1.5 },
      { name: 'Dha', ratio: 1.6 }, { name: 'Dha', ratio: 1.6 },
      { name: 'Ni', ratio: 1.875 }, { name: 'Ni', ratio: 1.875 },
      { name: 'Sa(H)', ratio: 2.0 }, { name: 'Sa(H)', ratio: 2.0 }
    ]
  },
  bhupali: {
    name: 'Raga Bhupali',
    type: 'Hindustani',
    difficulty: 'BEGINNER_2',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Re', ratio: 1.125 },
      { name: 'Ga', ratio: 1.25 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha', ratio: 1.6875 }
    ]
  },
  mohanam: {
    name: 'Raga Mohanam',
    type: 'Carnatic',
    difficulty: 'BEGINNER_2',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Ri', ratio: 1.125 },
      { name: 'Ga', ratio: 1.25 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha', ratio: 1.6875 }
    ]
  },
  durga: {
    name: 'Raga Durga',
    type: 'Hindustani',
    difficulty: 'BEGINNER_3',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Re', ratio: 1.125 },
      { name: 'Ma', ratio: 1.3333 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha', ratio: 1.6875 }
    ]
  },
  yaman: {
    name: 'Raga Yaman',
    type: 'Hindustani',
    difficulty: 'INTERMEDIATE_1',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Re', ratio: 1.125 },
      { name: 'Ga', ratio: 1.25 },
      { name: 'Ma(t)', ratio: 1.4238 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha', ratio: 1.6875 },
      { name: 'Ni', ratio: 1.875 }
    ]
  },
  hamsadhvani: {
    name: 'Raga Hamsadhvani',
    type: 'Carnatic',
    difficulty: 'INTERMEDIATE_2',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Ri', ratio: 1.125 },
      { name: 'Ga', ratio: 1.25 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Ni', ratio: 1.875 }
    ]
  },
  mayamalavagowla: {
    name: 'Raga Mayamalavagowla',
    type: 'Carnatic',
    difficulty: 'INTERMEDIATE_2',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Ri', ratio: 1.0667 },
      { name: 'Ga', ratio: 1.25 },
      { name: 'Ma', ratio: 1.3333 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha', ratio: 1.6 },
      { name: 'Ni', ratio: 1.875 }
    ]
  },
  bageshri: {
    name: 'Raga Bageshri',
    type: 'Hindustani',
    difficulty: 'INTERMEDIATE_3',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Re', ratio: 1.125 },
      { name: 'Ga(k)', ratio: 1.2 },
      { name: 'Ma', ratio: 1.3333 },
      { name: 'Dha', ratio: 1.6875 },
      { name: 'Ni(k)', ratio: 1.8 }
    ]
  },
  kalyani: {
    name: 'Raga Kalyani',
    type: 'Carnatic',
    difficulty: 'INTERMEDIATE_1',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Ri', ratio: 1.125 },
      { name: 'Ga', ratio: 1.25 },
      { name: 'Ma(t)', ratio: 1.4238 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha', ratio: 1.6875 },
      { name: 'Ni', ratio: 1.875 }
    ]
  },
  bhairavi: {
    name: 'Raga Bhairavi',
    type: 'Hindustani',
    difficulty: 'ADVANCED_1',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Re(k)', ratio: 1.0667 },
      { name: 'Ga(k)', ratio: 1.2 },
      { name: 'Ma', ratio: 1.3333 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha(k)', ratio: 1.6 },
      { name: 'Ni(k)', ratio: 1.8 }
    ]
  },
  darbari: {
    name: 'Raga Darbari',
    type: 'Hindustani',
    difficulty: 'ADVANCED_3',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Re', ratio: 1.125 },
      { name: 'Ga(k)', ratio: 1.2 },
      { name: 'Ma', ratio: 1.3333 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha(k)', ratio: 1.6 },
      { name: 'Ni(k)', ratio: 1.8 }
    ]
  },
  todi: {
    name: 'Raga Todi',
    type: 'Carnatic',
    difficulty: 'ADVANCED_2',
    notes: [
      { name: 'Sa', ratio: 1.0 },
      { name: 'Ri', ratio: 1.0667 },
      { name: 'Ga', ratio: 1.125 },
      { name: 'Ma', ratio: 1.3333 },
      { name: 'Pa', ratio: 1.5 },
      { name: 'Dha', ratio: 1.6 },
      { name: 'Ni', ratio: 1.6875 }
    ]
  }
};

/**
 * Utility function to extract just the ratio numbers from a given raga.
 * This can be directly passed to the validateNote() function.
 */
export const getAllowedRatios = (ragaId: keyof typeof RAGA_DATABASE): number[] => {
  return RAGA_DATABASE[ragaId].notes.map(note => note.ratio);
};
