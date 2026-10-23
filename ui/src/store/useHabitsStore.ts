import { create } from 'zustand';

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

const INITIAL_HABITS: Habit[] = [
  {
    id: 'h-1',
    name: 'Morning Wakeup at 06:00',
    area: 'Personal',
    schedule: { type: 'weekdays' },
    target: 1,
    unit: 'wake',
    tier: 'core',
    active: true,
    streak: 14,
    best_streak: 21,
    consistency_pct: 93,
  },
  {
    id: 'h-2',
    name: 'Read 20 pages systems programming',
    area: 'Learning',
    schedule: { type: 'daily' },
    target: 20,
    unit: 'pages',
    tier: 'standard',
    active: true,
    streak: 10,
    best_streak: 18,
    consistency_pct: 88,
  },
  {
    id: 'h-3',
    name: 'Push / Pull strength training',
    area: 'Fitness',
    schedule: { type: 'times_per_week', times: 4 },
    target: 4,
    unit: 'sessions',
    tier: 'core',
    active: true,
    streak: 6,
    best_streak: 12,
    consistency_pct: 85,
  },
  {
    id: 'h-4',
    name: '108 Repetition Concentration Practice',
    area: 'Spiritual',
    schedule: { type: 'daily' },
    target: 108,
    unit: 'reps',
    tier: 'core',
    active: true,
    streak: 24,
    best_streak: 24,
    consistency_pct: 96,
  },
];

interface HabitsState {
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;
  toggleActive: (id: string) => void;
}

export const useHabitsStore = create<HabitsState>((set) => ({
  habits: INITIAL_HABITS,
  addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
  removeHabit: (id) => set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),
  toggleActive: (id) =>
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, active: !h.active } : h)),
    })),
}));
