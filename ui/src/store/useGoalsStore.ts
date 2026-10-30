import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;
  updateGoalProgress: (id: string, delta: number) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: [],
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      removeGoal: (id) => set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),
      updateGoalProgress: (id, delta) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id === id) {
              const next = Math.min(Math.max(0, g.current + delta), g.target);
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
    }),
    { name: 'prod-os-goals-v1', version: 1 }
  )
);
