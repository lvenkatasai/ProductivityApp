import React from 'react';
import { 
  Sparkles, 
  BarChart3, 
  TrendingUp, 
  Flame, 
  AlertTriangle, 
  Award, 
  ShieldCheck 
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const AREA_XP = [
    { area: 'Career', xp: 1250, level: 6, max: 1500, color: 'bg-accent' },
    { area: 'Learning', xp: 820, level: 4, max: 1000, color: 'bg-done' },
    { area: 'Fitness', xp: 640, level: 3, max: 800, color: 'bg-warn' },
    { area: 'Spiritual', xp: 740, level: 4, max: 800, color: 'bg-accent' },
  ];

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
            Every number explainable. Ranks use original names. No XP loss, ever (PRD §7.5, §8.7).
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted">Overall Rank</div>
          <div className="text-sm font-semibold text-accent flex items-center gap-1.5 justify-end">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Adept Architect (Level 12)</span>
          </div>
        </div>
      </div>

      {/* Review Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-line rounded p-4">
          <div className="text-xs text-muted font-medium">Weekly Overall</div>
          <div className="text-2xl font-bold font-stat text-done mt-1">88.4%</div>
          <div className="text-[11px] text-muted mt-1">+4.2% from last week</div>
        </div>

        <div className="bg-surface border border-line rounded p-4">
          <div className="text-xs text-muted font-medium">Best Day</div>
          <div className="text-2xl font-bold font-stat text-accent mt-1">Tuesday</div>
          <div className="text-[11px] text-muted mt-1">98.0% execution score</div>
        </div>

        <div className="bg-surface border border-line rounded p-4">
          <div className="text-xs text-muted font-medium">Weakest Horizon</div>
          <div className="text-2xl font-bold font-stat text-warn mt-1">Fitness</div>
          <div className="text-[11px] text-muted mt-1">3 of 4 sessions logged</div>
        </div>

        <div className="bg-surface border border-line rounded p-4">
          <div className="text-xs text-muted font-medium">Total Focus Invested</div>
          <div className="text-2xl font-bold font-stat text-text mt-1">14.5 hrs</div>
          <div className="text-[11px] text-muted mt-1">Across 18 sessions</div>
        </div>
      </div>

      {/* XP Progression per Life Area */}
      <div className="bg-surface border border-line rounded p-6 space-y-4">
        <h3 className="text-xs font-semibold text-muted">
          Mastery by Life Area (Rising Level Curves)
        </h3>

        <div className="space-y-4">
          {AREA_XP.map((item) => {
            const pct = Math.round((item.xp / item.max) * 100);
            return (
              <div key={item.area} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text">
                    {item.area} <span className="text-muted font-normal">• Lvl {item.level}</span>
                  </span>
                  <span className="font-stat text-muted">
                    {item.xp} / {item.max} XP ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-raised rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${item.color} h-full transition-[width] duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Honest Skip / Miss Reason Analysis */}
      <div className="bg-surface border border-line rounded p-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold text-muted">
            Neutral Reason Analysis (Non-Judgmental)
          </h3>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          The app records misses neutrally with zero punitive language. Over the past 14 days, 
          2 quests were excused for <strong className="text-text">Low Energy</strong> and 1 for <strong className="text-text">Travel</strong>. 
          No guilt; only actionable data for recalibrating weekly volume.
        </p>
      </div>
    </div>
  );
};
