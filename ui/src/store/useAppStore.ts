import { create } from 'zustand';
import { QuestEntry, UserStats, DailyScoreResult, EntryStatus, SkipReason } from '../types';
import { calculateDailyScore, calculateDailyXP } from '../services/scoreCalculator';

const INITIAL_ENTRIES: QuestEntry[] = [
  {
    id: '1',
    day_key: new Date().toISOString().split('T')[0],
    source_type: 'main_quest',
    source_id: 'mq-1',
    name: 'Implement Rust memory & storage adapter',
    tier: 'core',
    target: 1,
    progress: 1,
    status: 'done',
    reclassify_until: new Date(Date.now() + 172800000).toISOString(),
  },
  {
    id: '2',
    day_key: new Date().toISOString().split('T')[0],
    source_type: 'workout',
    source_id: 'wo-1',
    name: 'Push Routine: 5x5 Barbell Press & Pull-ups',
    tier: 'core',
    target: 5,
    progress: 3,
    status: 'partial',
    reclassify_until: new Date(Date.now() + 172800000).toISOString(),
  },
  {
    id: '3',
    day_key: new Date().toISOString().split('T')[0],
    source_type: 'practice',
    source_id: 'pr-1',
    name: 'Daily 108 Count Concentration Practice',
    tier: 'core',
    target: 108,
    progress: 108,
    status: 'done',
    reclassify_until: new Date(Date.now() + 172800000).toISOString(),
  },
  {
    id: '4',
    day_key: new Date().toISOString().split('T')[0],
    source_type: 'habit',
    source_id: 'hb-1',
    name: 'Read 20 pages systems programming',
    tier: 'standard',
    target: 20,
    progress: 20,
    status: 'done',
    reclassify_until: new Date(Date.now() + 172800000).toISOString(),
  },
  {
    id: '5',
    day_key: new Date().toISOString().split('T')[0],
    source_type: 'task',
    source_id: 'tk-1',
    name: 'Review PR & dependency audit',
    tier: 'bonus',
    target: 1,
    progress: 1,
    status: 'done',
    reclassify_until: new Date(Date.now() + 172800000).toISOString(),
  },
];

interface AppState {
  isTauri: boolean;
  activeTab: string;
  entries: QuestEntry[];
  stats: UserStats;
  scoreResult: DailyScoreResult;
  showWhyDrawer: boolean;
  
  setActiveTab: (tab: string) => void;
  setShowWhyDrawer: (show: boolean) => void;
  beginDay: () => void;
  closeDay: () => void;
  toggleDone: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  skipEntry: (id: string, reason: SkipReason) => void;
  undoEntry: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isTauri: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
  activeTab: 'today',
  entries: INITIAL_ENTRIES,
  stats: {
    level: 12,
    rank: 'Adept Architect',
    overall_xp: 3450,
    current_streak: 14,
    day_begun: true,
    began_at: '06:30 AM',
  },
  scoreResult: calculateDailyScore(INITIAL_ENTRIES),
  showWhyDrawer: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowWhyDrawer: (show) => set({ showWhyDrawer: show }),

  beginDay: () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      stats: { ...state.stats, day_begun: true, began_at: nowStr },
    }));
  },

  closeDay: () => {
    set((state) => {
      const updated = state.entries.map((e) => {
        if (e.status === 'pending') {
          return { ...e, status: 'missed' as EntryStatus, resolved_at: new Date().toISOString() };
        }
        return e;
      });
      return {
        entries: updated,
        scoreResult: calculateDailyScore(updated),
      };
    });
  },

  toggleDone: (id) => {
    set((state) => {
      const updated = state.entries.map((e) => {
        if (e.id === id) {
          const nextStatus: EntryStatus = e.status === 'done' ? 'pending' : 'done';
          const nextProgress = nextStatus === 'done' ? e.target : 0;
          return {
            ...e,
            status: nextStatus,
            progress: nextProgress,
            resolved_at: nextStatus === 'done' ? new Date().toISOString() : undefined,
          };
        }
        return e;
      });
      return {
        entries: updated,
        scoreResult: calculateDailyScore(updated),
      };
    });
  },

  updateProgress: (id, progress) => {
    set((state) => {
      const updated = state.entries.map((e) => {
        if (e.id === id) {
          const clamped = Math.min(Math.max(progress, 0), e.target);
          const isDone = Math.abs(clamped - e.target) < 0.0001 && e.target > 0;
          const nextStatus: EntryStatus = isDone ? 'done' : 'partial';
          return {
            ...e,
            progress: clamped,
            status: nextStatus,
            resolved_at: new Date().toISOString(),
          };
        }
        return e;
      });
      return {
        entries: updated,
        scoreResult: calculateDailyScore(updated),
      };
    });
  },

  skipEntry: (id, reason) => {
    set((state) => {
      const updated = state.entries.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            status: 'skipped' as EntryStatus,
            reason,
            resolved_at: new Date().toISOString(),
          };
        }
        return e;
      });
      return {
        entries: updated,
        scoreResult: calculateDailyScore(updated),
      };
    });
  },

  undoEntry: (id) => {
    set((state) => {
      const updated = state.entries.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            status: 'pending' as EntryStatus,
            progress: 0,
            reason: undefined,
            resolved_at: undefined,
          };
        }
        return e;
      });
      return {
        entries: updated,
        scoreResult: calculateDailyScore(updated),
      };
    });
  },
}));
