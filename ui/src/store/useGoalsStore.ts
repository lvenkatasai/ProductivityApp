import { create } from 'zustand';

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'one_time' | 'ongoing';
export type GoalMethod = 'numeric' | 'milestones' | 'tasks';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type GoalOutcome = 'met' | 'partial' | 'missed';

export interface Milestone {
  id: string;
  name: string;
  target_value: number;
  completed_at?: string;
}

export interface Goal {
  id: string;
  name: string;
  area: 'Career' | 'Learning' | 'Fitness' | 'Spiritual' | 'Personal' | 'Finance';
  period: GoalPeriod;
  method: GoalMethod;
  target: number;
  current: number;
  unit: string;
  deadline?: string;
  status: GoalStatus;
  milestones?: Milestone[];
  linked_task_ids?: string[];
}

export interface GoalPeriodResult {
  goal_id: string;
  period_key: string;
  target: number;
  achieved: number;
  outcome: GoalOutcome;
}

const INITIAL_GOALS: Goal[] = [
  {
    id: 'g-1',
    name: 'Build and ship Productivity OS v1.0',
    area: 'Career',
    period: 'monthly',
    method: 'milestones',
    target: 4,
    current: 2,
    unit: 'milestones',
    deadline: '2026-11-30',
    status: 'active',
    milestones: [
      { id: 'm-1', name: 'Core domain & score algorithm in Rust', target_value: 1, completed_at: '2026-10-23' },
      { id: 'm-2', name: 'SQLite single records table & backup engine', target_value: 2, completed_at: '2026-10-23' },
      { id: 'm-3', name: 'Today, Goals, and Habits UI screens', target_value: 3 },
      { id: 'm-4', name: 'Windows native .exe packaging', target_value: 4 },
    ],
  },
  {
    id: 'g-2',
    name: '1000 Pages of Systems Engineering Books',
    area: 'Learning',
    period: 'monthly',
    method: 'numeric',
    target: 1000,
    current: 420,
    unit: 'pages',
    deadline: '2026-12-31',
    status: 'active',
  },
  {
    id: 'g-3',
    name: 'Consistency in Strength Training',
    area: 'Fitness',
    period: 'weekly',
    method: 'numeric',
    target: 4,
    current: 3,
    unit: 'sessions',
    status: 'active',
  },
];

interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;
  updateGoalProgress: (id: string, delta: number) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: INITIAL_GOALS,
  addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
  removeGoal: (id) => set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),
  updateGoalProgress: (id, delta) =>
    set((state) => ({
      goals: state.goals.map((g) => {
        if (g.id === id) {
          const next = Math.max(0, g.current + delta);
          return { ...g, current: next };
        }
        return g;
      }),
    })),
  toggleMilestone: (goalId, milestoneId) =>
    set((state) => ({
      goals: state.goals.map((g) => {
        if (g.id === goalId && g.milestones) {
          const updated = g.milestones.map((m) => {
            if (m.id === milestoneId) {
              const isCompleted = !!m.completed_at;
              return { ...m, completed_at: isCompleted ? undefined : new Date().toISOString() };
            }
            return m;
          });
          const completedCount = updated.filter((m) => !!m.completed_at).length;
          return { ...g, milestones: updated, current: completedCount };
        }
        return g;
      }),
    })),
}));
