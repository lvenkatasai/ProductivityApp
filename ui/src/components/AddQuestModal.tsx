import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Tier } from '../types';
import { X, Plus, ListTodo } from 'lucide-react';

interface AddQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddQuestModal: React.FC<AddQuestModalProps> = ({ isOpen, onClose }) => {
  const addEntry = useAppStore((s) => s.addEntry);
  const [name, setName] = useState('');
  const [tier, setTier] = useState<Tier>('core');
  const [target, setTarget] = useState('1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addEntry(name, tier, parseInt(target, 10) || 1);
    setName('');
    setTier('core');
    setTarget('1');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-surface border border-line rounded p-6 animate-fadeRise">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text">Add Quest</h2>
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Quest Name</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Ship the reporting view"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Priority Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as Tier)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-muted"
                >
                  <option value="core">Core (3x weight)</option>
                  <option value="standard">Standard (2x weight)</option>
                  <option value="bonus">Bonus (+2.5 pts)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Target (reps)</label>
                <input
                  type="number"
                  min="1"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-muted"
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
              className="px-4 py-2 bg-white hover:bg-white/90 text-[#111111] text-xs font-bold rounded transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Quest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
