import React, { useState } from 'react';
import { useGoalsStore, Goal, GoalPeriod, GoalMethod } from '../store/useGoalsStore';
import { X, Target, Plus } from 'lucide-react';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose }) => {
  const { addGoal } = useGoalsStore();

  const [name, setName] = useState('');
  const [area, setArea] = useState<Goal['area']>('Career');
  const [period, setPeriod] = useState<GoalPeriod>('monthly');
  const [method, setMethod] = useState<GoalMethod>('numeric');
  const [target, setTarget] = useState('100');
  const [unit, setUnit] = useState('units');
  const [deadline, setDeadline] = useState('');
  const [milestonesText, setMilestonesText] = useState('Milestone 1\nMilestone 2\nMilestone 3');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let milestones = undefined;
    let targetNum = parseFloat(target) || 1;

    if (method === 'milestones') {
      const lines = milestonesText
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);
      milestones = lines.map((line: string, idx: number) => ({
        id: `m-${Date.now()}-${idx}`,
        name: line,
        target_value: idx + 1,
      }));
      targetNum = milestones.length;
    }

    const newGoal: Goal = {
      id: `g-${Date.now()}`,
      name: name.trim(),
      area,
      period,
      method,
      target: targetNum,
      current: 0,
      unit: method === 'milestones' ? 'milestones' : unit.trim() || 'units',
      deadline: deadline ? deadline : undefined,
      status: 'active',
      milestones,
    };

    addGoal(newGoal);
    onClose();
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-surface border border-line rounded p-6 shadow-2xl flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text">Create New Goal</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-text p-1 rounded hover:bg-raised transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Goal Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Goal Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Master Distributed Systems"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
              />
            </div>

            {/* Area & Period */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Life Area</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as any)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="Career">Career</option>
                  <option value="Learning">Learning</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Spiritual">Spiritual</option>
                  <option value="Personal">Personal</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="one_time">One-Time</option>
                  <option value="ongoing">Ongoing</option>
                </select>
              </div>
            </div>

            {/* Measurement Method (PRD §7.6: Strictly one method) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">
                Measurement Method (One Method Only)
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
              >
                <option value="numeric">Numeric Metric (Target Count)</option>
                <option value="milestones">Sequential Milestones</option>
                <option value="tasks">Linked Execution Tasks</option>
              </select>
            </div>

            {/* Conditional fields based on Method */}
            {method === 'numeric' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">Target</label>
                  <input
                    type="number"
                    required
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pages, hours, km"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}

            {method === 'milestones' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">
                  Milestones (One per line)
                </label>
                <textarea
                  rows={3}
                  value={milestonesText}
                  onChange={(e) => setMilestonesText(e.target.value)}
                  className="w-full bg-bg border border-line rounded p-2.5 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Deadline (Optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-muted hover:text-text rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-bg text-xs font-bold rounded transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Save Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
