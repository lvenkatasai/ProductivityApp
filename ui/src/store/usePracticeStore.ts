import { create } from 'zustand';

export type MediaType = 'text' | 'image' | 'audio' | 'video';

export interface PracticeMedia {
  type: MediaType;
  /** For text: the string content. For image/audio/video: a data URL (base64). */
  content: string;
  /** Original filename, for display purposes */
  filename?: string;
}

export interface Practice {
  id: string;
  name: string;
  /** Required reps target per session */
  reps: number;
  /** Optional media attachments — stored persistently in memory */
  media: PracticeMedia[];
  /** Current session count */
  count: number;
  /** XP reward on completion */
  xp: number;
  createdAt: string;
}

interface PracticeState {
  practices: Practice[];
  addPractice: (p: Omit<Practice, 'id' | 'count' | 'createdAt'>) => void;
  removePractice: (id: string) => void;
  increment: (id: string, delta: number) => void;
  decrement: (id: string) => void;
  reset: (id: string) => void;
  addMedia: (id: string, media: PracticeMedia) => void;
  removeMedia: (id: string, mediaIdx: number) => void;
}

const INITIAL_PRACTICES: Practice[] = [
  {
    id: 'p-1',
    name: '108 Concentration Breath Practice',
    reps: 108,
    media: [
      {
        type: 'text',
        content:
          'Breathe in stillness, breathe out clarity. Focus on the breath alone — each count is a single, complete cycle.',
      },
    ],
    count: 0,
    xp: 30,
    createdAt: new Date().toISOString(),
  },
];

function uid(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  practices: INITIAL_PRACTICES,

  addPractice: (p) =>
    set((state) => ({
      practices: [
        ...state.practices,
        { ...p, id: uid(), count: 0, createdAt: new Date().toISOString() },
      ],
    })),

  removePractice: (id) =>
    set((state) => ({ practices: state.practices.filter((p) => p.id !== id) })),

  increment: (id, delta) =>
    set((state) => ({
      practices: state.practices.map((p) =>
        p.id === id ? { ...p, count: Math.min(p.count + delta, p.reps) } : p
      ),
    })),

  decrement: (id) =>
    set((state) => ({
      practices: state.practices.map((p) =>
        p.id === id ? { ...p, count: Math.max(0, p.count - 1) } : p
      ),
    })),

  reset: (id) =>
    set((state) => ({
      practices: state.practices.map((p) =>
        p.id === id ? { ...p, count: 0 } : p
      ),
    })),

  addMedia: (id, media) =>
    set((state) => ({
      practices: state.practices.map((p) =>
        p.id === id ? { ...p, media: [...p.media, media] } : p
      ),
    })),

  removeMedia: (id, mediaIdx) =>
    set((state) => ({
      practices: state.practices.map((p) =>
        p.id === id
          ? { ...p, media: p.media.filter((_, i) => i !== mediaIdx) }
          : p
      ),
    })),
}));
