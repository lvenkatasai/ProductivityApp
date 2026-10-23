import React, { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { NavigationRail } from './components/NavigationRail';
import { TodayScreen } from './components/TodayScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { HabitsScreen } from './components/HabitsScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { FitnessScreen } from './components/FitnessScreen';
import { FocusCalendarScreen } from './components/FocusCalendarScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { WhyScoreDrawer } from './components/WhyScoreDrawer';
import { BeginDayModal } from './components/BeginDayModal';

export const App: React.FC = () => {
  const { activeTab, stats } = useAppStore();
  const [showBeginDayModal, setShowBeginDayModal] = useState<boolean>(!stats.day_begun);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text antialiased">
      {/* Left Navigation Rail */}
      <NavigationRail />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-bg">
        {activeTab === 'today' && <TodayScreen />}
        {activeTab === 'goals' && <GoalsScreen />}
        {activeTab === 'habits' && <HabitsScreen />}
        {activeTab === 'practice' && <PracticeScreen />}
        {activeTab === 'fitness' && <FitnessScreen />}
        {activeTab === 'focus' && <FocusCalendarScreen />}
        {activeTab === 'reports' && <ReportsScreen />}

        {activeTab === 'settings' && (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="space-y-2 max-w-sm bg-surface p-6 rounded border border-line">
              <h2 className="text-base font-semibold text-text">System Settings</h2>
              <p className="text-xs text-muted leading-relaxed">
                Configure rollover hour (default 04:00 AM), target wake time, tier weights, and automated SQLite backup destination paths.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Why Score Drawer */}
      <WhyScoreDrawer />

      {/* Begin Day Guided Modal */}
      <BeginDayModal 
        isOpen={showBeginDayModal} 
        onClose={() => setShowBeginDayModal(false)} 
      />
    </div>
  );
};

export default App;
