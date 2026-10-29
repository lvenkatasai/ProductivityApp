import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  SunMedium, 
  Target, 
  CheckSquare, 
  Flame, 
  Dumbbell, 
  Compass, 
  Timer, 
  BarChart3, 
  Settings, 
  Command 
} from 'lucide-react';

export const NavigationRail: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const NAV_ITEMS = [
    { id: 'today', label: 'Today', icon: SunMedium },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'practice', label: 'Practice', icon: Compass },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    { id: 'focus', label: 'Focus', icon: Timer },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-surface border-r border-line flex flex-col justify-between p-3 flex-shrink-0 select-none">
      <div className="space-y-6">
        {/* App Title & Status */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-accent" />
            <span className="font-bold text-sm tracking-tight text-text">Productivity OS</span>
          </div>
          <span className="text-[11px] text-muted font-stat bg-raised px-1.5 py-0.5 rounded border border-line">
            v1.0
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive 
                    ? 'bg-raised text-accent font-semibold border-l-2 border-accent rounded-l-none' 
                    : 'text-muted hover:text-text hover:bg-raised/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-muted'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Command Palette Trigger */}
      <div className="p-2 border-t border-line text-muted">
        <div className="flex items-center justify-between text-[11px] px-2 py-1.5 bg-bg rounded border border-line cursor-pointer hover:border-line/80">
          <span className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5" /> Command
          </span>
          <kbd className="font-mono text-[11px] text-muted">Ctrl+K</kbd>
        </div>
      </div>
    </aside>
  );
};
