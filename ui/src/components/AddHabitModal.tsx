import React, { useState } from 'react';
import { useHabitsStore, Habit, HabitSchedule } from '../store/useHabitsStore';
import { X, CheckSquare, Plus } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose }) => {
  const { addHabit } = useHabitsStore();

  const [name, setName] = useState('');
  const [area, setArea] = useState<Habit['area']>('Personal');
  const [tier, setTier] = useState<Habit['tier']>('core');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekdays' | 'times_per_week'>('daily');
  const [timesPerWeek, setTimesPerWeek] = useState('4');
  const [target, setTarget] = useState('1');
  const [unit, setUnit] = useState('times');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let schedule: HabitSchedule = { type: 'daily' };
    if (scheduleType === 'weekdays') {
      schedule = { type: 'weekdays' };
    } else if (scheduleType === 'times_per_week') {
      schedule = { type: 'times_per_week', times: parseInt(timesPerWeek, 10) || 4 };
    }

    const newHabit: Habit = {
      id: `h-${Date.now()}`,
      name: name.trim(),
      area,
      tier,
      schedule,
      target: parseFloat(target) || 1,
      unit: unit.trim() || 'reps',
      active: true,
      streak: 0,
      best_streak: 0,
      consistency_pct: 100,
    };

    addHabit(newHabit);
    onClose();
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-surface border border-line rounded p-6 shadow-2xl flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text">Create New Habit Discipline</h2>
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
            {/* Habit Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted uppercase">Habit Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Read 20 pages systems programming"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
              />
            </div>

            {/* Life Area & Tier */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted uppercase">Life Area</label>
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
                <label className="text-[11px] font-semibold text-muted uppercase">Priority Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="core">Core (3x Weight)</option>
                  <option value="standard">Standard (2x Weight)</option>
                  <option value="bonus">Bonus (+2.5 Pts)</option>
                </select>
              </div>
            </div>

            {/* Recurrence Schedule */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted uppercase">Recurrence</label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as any)}
                className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
              >
                <option value="daily">Daily (Every single day)</option>
                <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                <option value="times_per_week">X Times Per Week</option>
              </select>
            </div>

            {scheduleType === 'times_per_week' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted uppercase">Times Per Week</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={timesPerWeek}
                  onChange={(e) => setTimesPerWeek(e.target.value)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {/* Target & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted uppercase">Target</label>
                <input
                  type="number"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted uppercase">Unit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. pages, reps, mins"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>
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
              <Plus className="w-4 h-4" /> Save Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
