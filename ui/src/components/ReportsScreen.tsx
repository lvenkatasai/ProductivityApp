import React from 'react';
import { Sparkles, Award, ShieldCheck, Target } from 'lucide-react';
import { useAppStore, todayKey } from '../store/useAppStore';
import { useFocusStore } from '../store/useFocusStore';
import { useGoalsStore } from '../store/useGoalsStore';

const AREAS = ['Career', 'Learning', 'Fitness', 'Spiritual', 'Personal', 'Finance'] as const;

const isoDate = (d: Date) => d.toISOString().split('T')[0];

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export const ReportsScreen: React.FC = () => {
  const entries = useAppStore((s) => s.entries);
  const history = useAppStore((s) => s.history);
  const stats = useAppStore((s) => s.stats);
  const scoreResult = useAppStore((s) => s.scoreResult);
  const sessions = useFocusStore((s) => s.sessions);
  const goals = useGoalsStore((s) => s.goals);

  const today = todayKey();
  const liveToday =
    scoreResult.is_empty || history.some((h) => h.date === today)
      ? []
      : [
          {
            date: today,
            score: scoreResult.final_score,
            done: entries.filter((e) => e.status === 'done').length,
            total: entries.length,
          },
        ];
  const allScores = [...history, ...liveToday];

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const prevWeekStart = new Date(now);
  prevWeekStart.setDate(now.getDate() - 13);

  const weekScores = allScores.filter((s) => s.date >= isoDate(weekStart));
  const prevWeekScores = allScores.filter(
    (s) => s.date >= isoDate(prevWeekStart) && s.date < isoDate(weekStart)
  );

  const weeklyOverall = average(weekScores.map((s) => s.score));
  const prevWeekly = average(prevWeekScores.map((s) => s.score));
  const weekDelta =
    weeklyOverall !== null && prevWeekly !== null
      ? Math.round((weeklyOverall - prevWeekly) * 10) / 10
      : null;

  const bestDay = weekScores.reduce<(typeof weekScores)[number] | null>(
    (best, s) => (!best || s.score > best.score ? s : best),
    null
  );
  const bestDayName = bestDay
    ? new Date(`${bestDay.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' })
    : null;

  const areaStats = AREAS.map((area) => {
    const areaGoals = goals.filter((g) => g.area === area);
    const target = areaGoals.reduce((sum, g) => sum + g.target, 0);
    const current = areaGoals.reduce((sum, g) => sum + Math.min(g.current, g.target), 0);
    const pct = target > 0 ? Math.round((current / target) * 100) : null;
    return { area, target, current, pct, count: areaGoals.length };
  });

  const trackedAreas = areaStats.filter((a) => a.pct !== null);
  const weakest = trackedAreas.length
    ? trackedAreas.reduce((worst, a) => ((a.pct as number) < (worst.pct as number) ? a : worst))
    : null;

  const totalFocusMinutes = sessions.reduce((sum, s) => sum + s.actualMinutes, 0);
  const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10;

  const skippedReasons = entries
    .filter((e) => e.status === 'skipped' && e.reason)
    .reduce<Record<string, number>>((acc, e) => {
      const reason = e.reason as string;
      acc[reason] = (acc[reason] ?? 0) + 1;
      return acc;
    }, {});
  const reasonEntries = Object.entries(skippedReasons);
  const missedCount = entries.filter((e) => e.status === 'missed').length;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Award className="w-4 h-4 text-accent" />
            <span>Honest Evaluation & Mastery</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text mt-1">
            Progression Ranks & Weekly Review
          </h1>
          <p className="text-sm text-muted">
            Every number explainable. Ranks use original names. No XP loss, ever.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted">Overall Rank</div>
          <div className="text-sm font-semibold text-accent flex items-center gap-1.5 justify-end">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{stats.rank} (Level {stats.level})</span>
          </div>
        </div>
      </div>

      {/* Review Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-line rounded p-4">
          <div className="text-xs text-muted font-medium">Weekly Overall</div>
          <div className="text-2xl font-bold font-stat text-done mt-1">
            {weeklyOverall === null ? '—' : `${weeklyOverall}%`}
          </div>
          <div className="text-[11px] text-muted mt-1">
            {weekDelta === null
              ? 'Not enough history yet'
              : `${weekDelta >= 0 ? '+' : ''}${weekDelta}% from last week`}
          </div>
        </div>

        <div className="bg-surface border border-line rounded p-4">
          <div className="text-xs text-muted font-medium">Best Day</div>
          <div className="text-2xl font-bold font-stat text-accent mt-1">
            {bestDayName ?? '—'}
          </div>
          <div className="text-[11px] text-muted mt-1">
            {bestDay ? `${bestDay.score}% execution score` : 'No days scored yet'}
          </div>
        </div>

        <div className="bg-surface border border-line rounded p-4">
          <div className="text-xs text-muted font-medium">Weakest Horizon</div>
          <div className="text-2xl font-bold font-stat text-warn mt-1">
            {weakest ? weakest.area : '—'}
          </div>
          <div className="text-[11px] text-muted mt-1">
            {weakest
              ? `${weakest.current} of ${weakest.target} goal progress`
              : 'Add a goal to track this'}
          </div>
        </div>

        <div className="bg-surface border border-line rounded p-4">
          <div className="text-xs text-muted font-medium">Total Focus Invested</div>
          <div className="text-2xl font-bold font-stat text-text mt-1">
            {totalFocusMinutes === 0 ? '—' : `${totalFocusHours} hrs`}
          </div>
          <div className="text-[11px] text-muted mt-1">
            Across {sessions.length} session{sessions.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* XP Progression per Life Area */}
      <div className="bg-surface border border-line rounded p-6 space-y-4">
        <h3 className="text-xs font-semibold text-muted">
          Goal Progress by Life Area
        </h3>

        {trackedAreas.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Target className="w-6 h-6 text-faint mx-auto" />
            <p className="text-xs text-muted">No goals yet. Add one in Goals to see per-area progress.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trackedAreas.map((item) => {
              const pct = item.pct as number;
              return (
                <div key={item.area} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text">
                      {item.area}{' '}
                      <span className="text-muted font-normal">• {item.count} goal{item.count === 1 ? '' : 's'}</span>
                    </span>
                    <span className="font-stat text-muted">
                      {item.current} / {item.target} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-raised rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-accent h-full transition-[width] duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Honest Skip / Miss Reason Analysis */}
      <div className="bg-surface border border-line rounded p-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold text-muted">
            Neutral Reason Analysis (Non-Judgmental)
          </h3>
        </div>
        {reasonEntries.length === 0 && missedCount === 0 ? (
          <p className="text-xs text-muted leading-relaxed">
            No skips or misses recorded today. The app records misses neutrally with zero
            punitive language; reasons will appear here as they happen.
          </p>
        ) : (
          <p className="text-xs text-muted leading-relaxed">
            Today, {missedCount} quest{missedCount === 1 ? ' was' : 's were'} marked missed
            {reasonEntries.length > 0 && (
              <>
                , and excused reasons included{' '}
                {reasonEntries.map(([reason, count], i) => (
                  <span key={reason}>
                    <strong className="text-text">{count}</strong> for{' '}
                    <strong className="text-text">{reason}</strong>
                    {i < reasonEntries.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </>
            )}
            . No guilt; only actionable data for recalibrating weekly volume.
          </p>
        )}
      </div>
    </div>
  );
};
