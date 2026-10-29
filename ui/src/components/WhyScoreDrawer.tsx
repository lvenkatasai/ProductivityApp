import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, HelpCircle, Check, AlertCircle } from 'lucide-react';

export const WhyScoreDrawer: React.FC = () => {
  const { scoreResult, showWhyDrawer, setShowWhyDrawer } = useAppStore();

  if (!showWhyDrawer) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 animate-fadeIn">
      <div className="w-full max-w-md bg-surface border-l border-line h-full flex flex-col justify-between p-6 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text">Daily Score Breakdown</h2>
            </div>
            <button 
              onClick={() => setShowWhyDrawer(false)}
              className="text-muted hover:text-text p-1 rounded hover:bg-raised transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Explainable Formula Box */}
          <div className="bg-raised p-4 rounded border border-line text-xs space-y-2 text-muted leading-relaxed">
            <div className="font-semibold text-text text-xs">
              Deterministic Formula (PRD §7.3)
            </div>
            <p>
              • <strong className="text-accent">Core</strong>: 3 pts weight | <strong className="text-text">Standard</strong>: 2 pts weight | <strong className="text-warn">Bonus</strong>: +2.5 pts each (capped at +10)
            </p>
            <p>
              • Base Score = (Earned Weight / Due Weight) × 100
            </p>
            <p>
              • Skipped quests are excluded from due weight; missed count as 0 earned.
            </p>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted">
              Quest Contributions
            </div>

            <div className="space-y-2">
              {scoreResult.breakdown.map((item) => (
                <div key={item.entry_id} className="p-3 bg-bg rounded border border-line text-xs space-y-1">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-text truncate max-w-[200px]">{item.name}</span>
                    <span className="font-stat font-bold text-accent">
                      {item.tier === 'bonus' 
                        ? `+${item.points_contributed.toFixed(1)} pts` 
                        : `${(item.earned_fraction * item.weight).toFixed(1)} / ${item.weight} pts`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted text-[11px]">
                    <span className="capitalize">{item.tier} • status: {item.status}</span>
                    <span className="font-stat">{(item.earned_fraction * 100).toFixed(0)}% completion</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="border-t border-line pt-4 mt-6">
          <div className="flex items-center justify-between text-sm font-bold text-text">
            <span>Final Calculated Score</span>
            <span className="text-accent font-stat text-lg">{scoreResult.final_score}%</span>
          </div>
          <div className="text-[11px] text-muted mt-1 text-center">
            Honest, explainable metrics • History is append-only
          </div>
        </div>
      </div>
    </div>
  );
};
