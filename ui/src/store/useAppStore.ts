import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  QuestEntry,
  UserStats,
  DailyScoreResult,
  EntryStatus,
  SkipReason,
  Tier,
  DayScoreRecord,
} from '../types';
import { calculateDailyScore, calculateDailyXP } from '../services/scoreCalculator';

export const todayKey = (): string => new Date().toISOString().split('T')[0];

const RANKS: [number, string][] = [
  [1, 'Novice'],
  [4, 'Apprentice'],
  [8, 'Journeyman'],
  [14, 'Adept Architect'],
  [22, 'Master Architect'],
  [32, 'Eternal Architect'],
];

export function levelForXp(xp: number): number {
  return 1 + Math.floor(Math.max(0, xp) / 100);
}

export function rankForLevel(level: number): string {
  let rank = RANKS[0][1];
  for (const [minLevel, name] of RANKS) {
    if (level >= minLevel) rank = name;
  }
  return rank;
}

export const EMPTY_STATS: UserStats = {
  level: 1,
  rank: 'Novice',
  overall_xp: 0,
  current_streak: 0,
  day_begun: false,
  began_at: undefined,
};

interface AppState {
  isTauri: boolean;
  activeTab: string;
  currentDay: string;
  intention: string;
  entries: QuestEntry[];
  history: DayScoreRecord[];
  stats: UserStats;
  scoreResult: DailyScoreResult;
  showWhyDrawer: boolean;

  setActiveTab: (tab: string) => void;
  setIntention: (intention: string) => void;
  setShowWhyDrawer: (show: boolean) => void;
  beginDay: () => void;
  closeDay: () => void;
  addEntry: (name: string, tier: Tier, target: number) => void;
  removeEntry: (id: string) => void;
  toggleDone: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  skipEntry: (id: string, reason: SkipReason) => void;
  undoEntry: (id: string) => void;
}

function withXp(stats: UserStats, prevEntries: QuestEntry[], nextEntries: QuestEntry[]): UserStats {
  const delta = calculateDailyXP(nextEntries) - calculateDailyXP(prevEntries);
  const overall = Math.max(0, stats.overall_xp + delta);
  const level = levelForXp(overall);
  return { ...stats, overall_xp: overall, level, rank: rankForLevel(level) };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isTauri: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
      activeTab: 'today',
      currentDay: todayKey(),
      intention: '',
      entries: [],
      history: [],
      stats: EMPTY_STATS,
      scoreResult: calculateDailyScore([]),
      showWhyDrawer: false,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setIntention: (intention) => set({ intention }),
      setShowWhyDrawer: (show) => set({ showWhyDrawer: show }),

      beginDay: () => {
        const nowStr = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        set((state) => ({
          stats: { ...state.stats, day_begun: true, began_at: nowStr },
        }));
      },

      closeDay: () => {
        set((state) => {
          if (state.entries.length === 0) {
            return { stats: { ...state.stats, day_begun: false } };
          }
          const updated = state.entries.map((e) =>
            e.status === 'pending'
              ? { ...e, status: 'missed' as EntryStatus, resolved_at: new Date().toISOString() }
              : e
          );
          const result = calculateDailyScore(updated);
          const done = updated.filter((e) => e.status === 'done').length;
          const record: DayScoreRecord = {
            date: state.currentDay,
            score: result.final_score,
            done,
            total: updated.length,
          };
          return {
            entries: updated,
            scoreResult: result,
            history: [...state.history.filter((h) => h.date !== state.currentDay), record],
            stats: { ...state.stats, day_begun: false },
          };
        });
      },

      addEntry: (name, tier, target) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => {
          const entry: QuestEntry = {
            id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            day_key: state.currentDay,
            source_type: 'task',
            source_id: `t-${Date.now()}`,
            name: trimmed,
            tier,
            target: Math.max(1, target),
            progress: 0,
            status: 'pending',
            reclassify_until: new Date(Date.now() + 172800000).toISOString(),
          };
          const entries = [...state.entries, entry];
          return { entries, scoreResult: calculateDailyScore(entries) };
        });
      },

      removeEntry: (id) =>
        set((state) => {
          const entries = state.entries.filter((e) => e.id !== id);
          return {
            entries,
            scoreResult: calculateDailyScore(entries),
            stats: withXp(state.stats, state.entries, entries),
          };
        }),

      toggleDone: (id) => {
        set((state) => {
          const updated = state.entries.map((e) => {
            if (e.id !== id) return e;
            const nextStatus: EntryStatus = e.status === 'done' ? 'pending' : 'done';
            return {
              ...e,
              status: nextStatus,
              progress: nextStatus === 'done' ? e.target : 0,
              resolved_at: nextStatus === 'done' ? new Date().toISOString() : undefined,
            };
          });
          return {
            entries: updated,
            scoreResult: calculateDailyScore(updated),
            stats: withXp(state.stats, state.entries, updated),
          };
        });
      },

      updateProgress: (id, progress) => {
        set((state) => {
          const updated = state.entries.map((e) => {
            if (e.id !== id) return e;
            const clamped = Math.min(Math.max(progress, 0), e.target);
            const isDone = Math.abs(clamped - e.target) < 0.0001 && e.target > 0;
            const nextStatus: EntryStatus = isDone ? 'done' : 'partial';
            return {
              ...e,
              progress: clamped,
              status: nextStatus,
              resolved_at: new Date().toISOString(),
            };
          });
          return {
            entries: updated,
            scoreResult: calculateDailyScore(updated),
            stats: withXp(state.stats, state.entries, updated),
          };
        });
      },

      skipEntry: (id, reason) => {
        set((state) => {
          const updated = state.entries.map((e) => {
            if (e.id !== id) return e;
            return {
              ...e,
              status: 'skipped' as EntryStatus,
              reason,
              resolved_at: new Date().toISOString(),
            };
          });
          return {
            entries: updated,
            scoreResult: calculateDailyScore(updated),
            stats: withXp(state.stats, state.entries, updated),
          };
        });
      },

      undoEntry: (id) => {
        set((state) => {
          const updated = state.entries.map((e) => {
            if (e.id !== id) return e;
            return {
              ...e,
              status: 'pending' as EntryStatus,
              progress: 0,
              reason: undefined,
              resolved_at: undefined,
            };
          });
          return {
            entries: updated,
            scoreResult: calculateDailyScore(updated),
            stats: withXp(state.stats, state.entries, updated),
          };
        });
      },
    }),
    {
      name: 'prod-os-app-v1',
      version: 1,
      partialize: (state) => ({
        activeTab: state.activeTab,
        currentDay: state.currentDay,
        intention: state.intention,
        entries: state.entries,
        history: state.history,
        stats: state.stats,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const day = todayKey();
        const sameDay = p.currentDay === day;
        const entries = sameDay ? p.entries ?? [] : [];
        return {
          ...current,
          ...p,
          currentDay: day,
          entries,
          stats: sameDay
            ? p.stats ?? EMPTY_STATS
            : { ...(p.stats ?? EMPTY_STATS), day_begun: false },
          scoreResult: calculateDailyScore(entries),
        } as AppState;
      },
    }
  )
);
