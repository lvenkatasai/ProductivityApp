import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FocusSession {
  id: string;
  linkedTitle: string;
  category: 'Task' | 'Project' | 'Goal' | 'Area';
  plannedMinutes: number;
  actualMinutes: number;
  date: string; // YYYY-MM-DD
}

interface FocusState {
  sessions: FocusSession[];
  addSession: (session: Omit<FocusSession, 'id'>) => void;
  removeSession: (id: string) => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (session) =>
        set((state) => ({
          sessions: [{ ...session, id: `fs-${Date.now()}` }, ...state.sessions],
        })),
      removeSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
    }),
    { name: 'prod-os-focus-v1', version: 1 }
  )
);
