import React, { useState } from 'react';
import { useHabitsStore, Habit } from '../store/useHabitsStore';
import { CheckSquare, Flame, TrendingUp, Plus, Calendar, Trash2 } from 'lucide-react';
import { AddHabitModal } from './AddHabitModal';

export const HabitsScreen: React.FC = () => {
  const { habits, toggleActive, removeHabit } = useHabitsStore();
  const [showAddHabitModal, setShowAddHabitModal] = useState<boolean>(false);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
            <CheckSquare className="w-4 h-4 text-accent" />
            <span>Identity & Discipline</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text mt-1">
            Habit Disciplines & Streaks
          </h1>
          <p className="text-sm text-muted">
            Habits define who you become. Streaks are tracked honestly, never as the sole motivator.
          </p>
        </div>

        <button 
          onClick={() => setShowAddHabitModal(true)}
          className="bg-accent hover:bg-accent/90 text-bg font-semibold text-xs py-2 px-3 rounded transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {/* Habit List */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <HabitRow 
            key={habit.id} 
            habit={habit} 
            onToggleActive={() => toggleActive(habit.id)}
            onRemove={() => removeHabit(habit.id)}
          />
        ))}
      </div>

      {/* Add Habit Modal */}
      <AddHabitModal 
        isOpen={showAddHabitModal} 
        onClose={() => setShowAddHabitModal(false)} 
      />
    </div>
  );
};

interface HabitRowProps {
  habit: Habit;
  onToggleActive: () => void;
  onRemove: () => void;
}

const HabitRow: React.FC<HabitRowProps> = ({ habit, onToggleActive, onRemove }) => {
  return (
    <div className="bg-surface border border-line rounded p-4 flex items-center justify-between hover:border-line/80 transition-all group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-2.5 h-2.5 rounded-full ${habit.active ? 'bg-done' : 'bg-muted'}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text truncate">
              {habit.name}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
              habit.tier === 'core' 
                ? 'bg-accent/10 text-accent border border-accent/20' 
                : 'bg-raised text-muted border border-line'
            }`}>
              {habit.tier}
            </span>
            <span className="text-[10px] text-muted font-mono bg-raised px-1.5 py-0.5 rounded border border-line">
              {habit.area}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted mt-1.5 font-stat">
            <span>Target: {habit.target} {habit.unit}</span>
            <span>•</span>
            <span className="capitalize">{habit.schedule.type.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 flex-shrink-0">
        {/* Streak counter */}
        <div className="text-right">
          <div className="text-[11px] text-muted">Current Streak</div>
          <div className="text-sm font-stat font-bold text-warn flex items-center gap-1 justify-end">
            <Flame className="w-3.5 h-3.5 text-warn fill-warn/20" />
            <span>{habit.streak}d</span>
            <span className="text-xs text-muted font-normal">(best {habit.best_streak}d)</span>
          </div>
        </div>

        {/* Consistency % */}
        <div className="text-right min-w-[70px]">
          <div className="text-[11px] text-muted">Consistency</div>
          <div className="text-sm font-stat font-bold text-done flex items-center gap-1 justify-end">
            <TrendingUp className="w-3.5 h-3.5 text-done" />
            <span>{habit.consistency_pct}%</span>
          </div>
        </div>

        <button 
          onClick={onToggleActive}
          className={`text-xs px-2.5 py-1 rounded border transition-colors ${
            habit.active 
              ? 'bg-raised hover:bg-line text-muted border-line' 
              : 'bg-accent/10 hover:bg-accent/20 text-accent border-accent/30'
          }`}
        >
          {habit.active ? 'Active' : 'Paused'}
        </button>

        <button
          onClick={onRemove}
          className="text-muted hover:text-missed opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-raised rounded"
          title="Remove habit"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
