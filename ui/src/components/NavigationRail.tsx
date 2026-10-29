import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  SunMedium,
  Target,
  CheckSquare,
  Dumbbell,
  Compass,
  Timer,
  BarChart3,
  Settings,
  Command
} from 'lucide-react';

const GROUPS: Array<{ label: string; items: Array<{ id: string; label: string; icon: React.ElementType }> }> = [
  {
    label: 'Daily',
    items: [
      { id: 'today', label: 'Today', icon: SunMedium },
      { id: 'focus', label: 'Focus', icon: Timer },
    ],
  },
  {
    label: 'Direction',
    items: [
      { id: 'goals', label: 'Goals', icon: Target },
      { id: 'habits', label: 'Habits', icon: CheckSquare },
      { id: 'practice', label: 'Practice', icon: Compass },
      { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    ],
  },
  {
    label: 'Review',
    items: [
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const NavigationRail: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <aside className="w-[210px] bg-bg border-r border-line flex flex-col flex-shrink-0 select-none">
      <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
        <svg className="w-[22px] h-[22px] flex-shrink-0" viewBox="0 0 22 22" aria-label="Productivity OS">
          <rect width="22" height="22" rx="6" fill="#C6F24E" />
          <path d="M5.5 15 L9 9.5 L11.5 13 L16.5 6.5" fill="none" stroke="#0C0D0F" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-semibold text-text tracking-tight">Productivity OS</span>
      </div>

      <nav className="flex-1 px-3.5 overflow-y-auto" aria-label="Main navigation">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-faint text-xs pt-5 pb-1.5 px-2">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-2 py-1.5 rounded text-[13.5px] leading-[26px] font-normal transition-colors ${
                    isActive ? 'text-white font-medium' : 'text-muted hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-text' : 'text-faint'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3.5 border-t border-line">
        <div className="flex items-center justify-between text-xs text-muted px-2 py-2 bg-surface rounded-[10px] cursor-pointer hover:bg-raised transition-colors">
          <span className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-faint" /> Command
          </span>
          <kbd className="text-[11px] text-faint">Ctrl+K</kbd>
        </div>
      </div>
    </aside>
  );
};
