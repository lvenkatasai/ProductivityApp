import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HabitSchedule =
  | { type: 'daily' }
  | { type: 'weekdays' }
  | { type: 'weekly'; days: number[] }
  | { type: 'times_per_week'; times: number }
  | { type: 'every_n_days'; interval: number };

export interface Habit {
  id: string;
  name: string;
  area: 'Career' | 'Learning' | 'Fitness' | 'Spiritual' | 'Personal' | 'Finance';
  schedule: HabitSchedule;
  target: number;
  unit: string;
  tier: 'core' | 'standard' | 'bonus';
  active: boolean;
  streak: number;
  best_streak: number;
  consistency_pct: number;
}

interface HabitsState {
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;
  toggleActive: (id: string) => void;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      habits: [],
      addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
      removeHabit: (id) => set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),
      toggleActive: (id) =>
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, active: !h.active } : h)),
        })),
    }),
    { name: 'prod-os-habits-v1', version: 1 }
  )
);
