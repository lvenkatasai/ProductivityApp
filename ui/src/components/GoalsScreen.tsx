import React, { useState } from 'react';
import { useGoalsStore, Goal } from '../store/useGoalsStore';
import { Target, CheckCircle2, Circle, Plus, Calendar, Compass, Trash2 } from 'lucide-react';
import { AddGoalModal } from './AddGoalModal';

export const GoalsScreen: React.FC = () => {
  const { goals, updateGoalProgress, toggleMilestone, removeGoal } = useGoalsStore();
  const [showAddGoalModal, setShowAddGoalModal] = useState<boolean>(false);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Target className="w-4 h-4 text-accent" />
            <span>Direction & Aspirations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text mt-1">
            Life Goals & Milestones
          </h1>
          <p className="text-sm text-muted">
            Goals set direction; tiny tasks do not inflate outcomes. Strictly one method per goal.
          </p>
        </div>

        <button 
          onClick={() => setShowAddGoalModal(true)}
          className="bg-accent hover:bg-accent/90 text-bg font-semibold text-xs py-2 px-3 rounded transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <GoalCard 
            key={goal.id} 
            goal={goal} 
            onDelta={(d) => updateGoalProgress(goal.id, d)}
            onToggleMilestone={(mId) => toggleMilestone(goal.id, mId)}
            onRemove={() => removeGoal(goal.id)}
          />
        ))}
      </div>

      {/* Add Goal Modal */}
      <AddGoalModal 
        isOpen={showAddGoalModal} 
        onClose={() => setShowAddGoalModal(false)} 
      />
    </div>
  );
};

interface GoalCardProps {
  goal: Goal;
  onDelta: (d: number) => void;
  onToggleMilestone: (mId: string) => void;
  onRemove: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onDelta, onToggleMilestone, onRemove }) => {
  const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);

  return (
    <div className="bg-surface border border-line rounded p-5 flex flex-col justify-between space-y-4 hover:border-line/80 transition group">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] capitalize font-semibold px-2 py-0.5 rounded bg-raised text-muted border border-line">
              {goal.area} • {goal.period}
            </span>
            {goal.deadline && (
              <span className="text-xs text-muted font-stat flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {goal.deadline}
              </span>
            )}
          </div>
          <button
            onClick={onRemove}
            className="text-muted hover:text-missed opacity-0 group-hover:opacity-100 transition p-1 hover:bg-raised rounded"
            title="Remove goal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-text mt-3 tracking-tight">
          {goal.name}
        </h3>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-xs text-muted capitalize">
            Method: {goal.method}
          </span>
          <span className="font-stat text-sm font-bold text-accent">
            {goal.current} / {goal.target} {goal.unit} ({pct}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-raised rounded-full h-1.5 mt-2 overflow-hidden">
          <div 
            className="bg-accent h-full transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Milestones list if method is milestones */}
      {goal.method === 'milestones' && goal.milestones && (
        <div className="space-y-2 pt-2 border-t border-line/60">
          <div className="text-[11px] font-semibold text-muted">
            Milestones
          </div>
          <div className="space-y-1.5">
            {goal.milestones.map((m) => {
              const done = !!m.completed_at;
              return (
                <div 
                  key={m.id}
                  onClick={() => onToggleMilestone(m.id)}
                  className="flex items-center gap-2.5 text-xs text-text p-2 rounded bg-bg/50 hover:bg-bg border border-line/40 cursor-pointer transition-colors"
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-done flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-line flex-shrink-0" />
                  )}
                  <span className={`truncate flex-1 ${done ? 'line-through text-muted' : ''}`}>
                    {m.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick increment for numeric goals */}
      {goal.method === 'numeric' && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
          <button 
            onClick={() => onDelta(-10)}
            className="px-2 py-1 text-xs font-stat bg-raised hover:bg-line text-text rounded border border-line"
          >
            -10
          </button>
          <button 
            onClick={() => onDelta(10)}
            className="px-2 py-1 text-xs font-stat bg-raised hover:bg-line text-text rounded border border-line"
          >
            +10
          </button>
          <button 
            onClick={() => onDelta(50)}
            className="px-2 py-1 text-xs font-stat bg-raised hover:bg-line text-text rounded border border-line"
          >
            +50
          </button>
        </div>
      )}
    </div>
  );
};
