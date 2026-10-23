import { create } from 'zustand';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun, 1=Mon ... 6=Sat

export interface SetTemplate {
  set_number: number;
  reps: number;
  weight_kg: number;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  sets: SetTemplate[];
  note?: string;
}

export interface DayPlan {
  day: DayOfWeek;
  isRest: boolean;
  sessionName: string;
  exercises: ExerciseTemplate[];
}

export interface SetLog {
  set_number: number;
  reps: number;
  weight_kg: number;
  completed: boolean;
}

export interface ExerciseLog {
  templateId: string;
  name: string;
  sets: SetLog[];
}

export interface WorkoutSession {
  date: string; // ISO date YYYY-MM-DD
  day: DayOfWeek;
  exercises: ExerciseLog[];
}

interface WorkoutState {
  weekPlan: DayPlan[];
  // Today's live session
  todaySession: WorkoutSession | null;

  // Week plan actions
  setDayRest: (day: DayOfWeek, isRest: boolean) => void;
  setDaySessionName: (day: DayOfWeek, name: string) => void;
  addExercise: (day: DayOfWeek, exercise: ExerciseTemplate) => void;
  removeExercise: (day: DayOfWeek, exerciseId: string) => void;
  updateExerciseSet: (day: DayOfWeek, exerciseId: string, setIdx: number, field: keyof SetTemplate, value: number) => void;
  addSet: (day: DayOfWeek, exerciseId: string) => void;
  removeSet: (day: DayOfWeek, exerciseId: string, setIdx: number) => void;

  // Today session actions
  initTodaySession: (day: DayOfWeek) => void;
  toggleSetDone: (exerciseIdx: number, setIdx: number) => void;
}

const DEFAULT_WEEK_PLAN: DayPlan[] = [
  {
    day: 0,
    isRest: true,
    sessionName: 'Rest Day',
    exercises: [],
  },
  {
    day: 1,
    isRest: false,
    sessionName: 'Push – Chest & Shoulders',
    exercises: [
      {
        id: 'e-mon-1',
        name: 'Barbell Bench Press',
        sets: [
          { set_number: 1, reps: 5, weight_kg: 80 },
          { set_number: 2, reps: 5, weight_kg: 80 },
          { set_number: 3, reps: 5, weight_kg: 80 },
        ],
      },
      {
        id: 'e-mon-2',
        name: 'Standing Overhead Press',
        sets: [
          { set_number: 1, reps: 5, weight_kg: 50 },
          { set_number: 2, reps: 5, weight_kg: 50 },
          { set_number: 3, reps: 5, weight_kg: 50 },
        ],
      },
      {
        id: 'e-mon-3',
        name: 'Incline Dumbbell Press',
        sets: [
          { set_number: 1, reps: 10, weight_kg: 30 },
          { set_number: 2, reps: 10, weight_kg: 30 },
        ],
      },
    ],
  },
  {
    day: 2,
    isRest: false,
    sessionName: 'Pull – Back & Biceps',
    exercises: [
      {
        id: 'e-tue-1',
        name: 'Weighted Pull-ups',
        sets: [
          { set_number: 1, reps: 8, weight_kg: 10 },
          { set_number: 2, reps: 8, weight_kg: 10 },
          { set_number: 3, reps: 8, weight_kg: 10 },
        ],
      },
      {
        id: 'e-tue-2',
        name: 'Barbell Row',
        sets: [
          { set_number: 1, reps: 5, weight_kg: 70 },
          { set_number: 2, reps: 5, weight_kg: 70 },
          { set_number: 3, reps: 5, weight_kg: 70 },
        ],
      },
    ],
  },
  {
    day: 3,
    isRest: true,
    sessionName: 'Rest / Active Recovery',
    exercises: [],
  },
  {
    day: 4,
    isRest: false,
    sessionName: 'Legs – Squat Focus',
    exercises: [
      {
        id: 'e-thu-1',
        name: 'Back Squat',
        sets: [
          { set_number: 1, reps: 5, weight_kg: 100 },
          { set_number: 2, reps: 5, weight_kg: 100 },
          { set_number: 3, reps: 5, weight_kg: 100 },
        ],
      },
      {
        id: 'e-thu-2',
        name: 'Romanian Deadlift',
        sets: [
          { set_number: 1, reps: 8, weight_kg: 80 },
          { set_number: 2, reps: 8, weight_kg: 80 },
        ],
      },
    ],
  },
  {
    day: 5,
    isRest: false,
    sessionName: 'Full Body – Deadlift',
    exercises: [
      {
        id: 'e-fri-1',
        name: 'Deadlift',
        sets: [
          { set_number: 1, reps: 5, weight_kg: 120 },
          { set_number: 2, reps: 5, weight_kg: 120 },
          { set_number: 3, reps: 3, weight_kg: 130 },
        ],
      },
      {
        id: 'e-fri-2',
        name: 'Farmer Carries',
        sets: [
          { set_number: 1, reps: 1, weight_kg: 40 },
          { set_number: 2, reps: 1, weight_kg: 40 },
        ],
        note: '30m distance each',
      },
    ],
  },
  {
    day: 6,
    isRest: true,
    sessionName: 'Rest Day',
    exercises: [],
  },
];

function makeId(): string {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  weekPlan: DEFAULT_WEEK_PLAN,
  todaySession: null,

  setDayRest: (day, isRest) =>
    set((state) => ({
      weekPlan: state.weekPlan.map((d) =>
        d.day === day
          ? { ...d, isRest, sessionName: isRest ? 'Rest Day' : d.sessionName }
          : d
      ),
    })),

  setDaySessionName: (day, name) =>
    set((state) => ({
      weekPlan: state.weekPlan.map((d) => (d.day === day ? { ...d, sessionName: name } : d)),
    })),

  addExercise: (day, exercise) =>
    set((state) => ({
      weekPlan: state.weekPlan.map((d) =>
        d.day === day ? { ...d, exercises: [...d.exercises, exercise] } : d
      ),
    })),

  removeExercise: (day, exerciseId) =>
    set((state) => ({
      weekPlan: state.weekPlan.map((d) =>
        d.day === day
          ? { ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId) }
          : d
      ),
    })),

  updateExerciseSet: (day, exerciseId, setIdx, field, value) =>
    set((state) => ({
      weekPlan: state.weekPlan.map((d) => {
        if (d.day !== day) return d;
        return {
          ...d,
          exercises: d.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const newSets = ex.sets.map((s, i) =>
              i === setIdx ? { ...s, [field]: value } : s
            );
            return { ...ex, sets: newSets };
          }),
        };
      }),
    })),

  addSet: (day, exerciseId) =>
    set((state) => ({
      weekPlan: state.weekPlan.map((d) => {
        if (d.day !== day) return d;
        return {
          ...d,
          exercises: d.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const last = ex.sets[ex.sets.length - 1];
            const newSet: SetTemplate = {
              set_number: ex.sets.length + 1,
              reps: last?.reps ?? 8,
              weight_kg: last?.weight_kg ?? 0,
            };
            return { ...ex, sets: [...ex.sets, newSet] };
          }),
        };
      }),
    })),

  removeSet: (day, exerciseId, setIdx) =>
    set((state) => ({
      weekPlan: state.weekPlan.map((d) => {
        if (d.day !== day) return d;
        return {
          ...d,
          exercises: d.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const newSets = ex.sets
              .filter((_, i) => i !== setIdx)
              .map((s, i) => ({ ...s, set_number: i + 1 }));
            return { ...ex, sets: newSets };
          }),
        };
      }),
    })),

  initTodaySession: (day) => {
    const plan = get().weekPlan.find((d) => d.day === day);
    if (!plan || plan.isRest) {
      set({ todaySession: null });
      return;
    }
    const session: WorkoutSession = {
      date: new Date().toISOString().split('T')[0],
      day,
      exercises: plan.exercises.map((ex) => ({
        templateId: ex.id,
        name: ex.name,
        sets: ex.sets.map((s) => ({ ...s, completed: false })),
      })),
    };
    set({ todaySession: session });
  },

  toggleSetDone: (exerciseIdx, setIdx) =>
    set((state) => {
      if (!state.todaySession) return state;
      const exercises = state.todaySession.exercises.map((ex, eIdx) => {
        if (eIdx !== exerciseIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) =>
            sIdx === setIdx ? { ...s, completed: !s.completed } : s
          ),
        };
      });
      return { todaySession: { ...state.todaySession, exercises } };
    }),
}));
