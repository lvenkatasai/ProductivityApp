import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  CheckCircle2, 
  Circle, 
  Target, 
  Flame, 
  Calendar, 
  HelpCircle, 
  Sparkles, 
  SunMedium, 
  Moon, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { Tier, EntryStatus, QuestEntry } from '../types';

export const TodayScreen: React.FC = () => {
  const { 
    entries, 
    stats, 
    scoreResult, 
    setShowWhyDrawer, 
    beginDay, 
    closeDay, 
    toggleDone, 
    updateProgress 
  } = useAppStore();

  const mainQuests = entries.filter(e => e.source_type === 'main_quest' || e.tier === 'core');
  const dailyQuests = entries.filter(e => e.source_type !== 'main_quest' && e.tier !== 'core');
  const remainingCount = entries.filter(e => e.status === 'pending' || e.status === 'partial').length;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
      {/* Top Header: Greeting, Rank, Streaks */}
      <div className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <span className="w-2 h-2 rounded-full bg-done" />
            <span>Productivity OS • System Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text mt-1">
            Good Morning, Architect
          </h1>
          <p className="text-sm text-muted">
            {stats.day_begun ? `Day begun at ${stats.began_at} • Focus on today's execution` : 'Review your carry-overs and begin day'}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-muted">Discipline Streak</div>
            <div className="text-sm font-stat font-bold text-warn flex items-center gap-1 justify-end">
              <Flame className="w-4 h-4 text-warn fill-warn/20" />
              <span>{stats.current_streak} Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Focal Banner: Remaining Quests & Score Metric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Card with tap-to-explain */}
        <div 
          onClick={() => setShowWhyDrawer(true)}
          className="bg-surface border border-line hover:border-accent/50 transition rounded p-5 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Today's Score</span>
            <span className="text-xs text-accent flex items-center gap-1 opacity-80 group-hover:opacity-100">
              Why? <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            {scoreResult.is_empty ? (
              <span className="text-xl font-medium text-muted">No quests today</span>
            ) : (
              <>
                <span className="text-4xl font-bold font-stat text-text group-hover:text-accent transition-colors">
                  {scoreResult.final_score}%
                </span>
                <span className="text-xs text-muted">
                  ({scoreResult.earned_weight.toFixed(1)} / {scoreResult.due_weight} pts
                  {scoreResult.bonus_points > 0 && ` +${scoreResult.bonus_points} bonus`})
                </span>
              </>
            )}
          </div>
          <div className="w-full bg-raised rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-accent h-full transition-[width] duration-300"
              style={{ width: `${Math.min(scoreResult.final_score, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Center / Remaining */}
        <div className="bg-surface border border-line rounded p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Focus Status</span>
            <Target className="w-4 h-4 text-muted" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-stat text-text">
              {remainingCount} {remainingCount === 1 ? 'quest' : 'quests'} remaining
            </div>
            <div className="text-xs text-muted mt-1">
              Core & Standard quests define your daily discipline.
            </div>
          </div>
          <div>
            {!stats.day_begun ? (
              <button 
                onClick={beginDay}
                className="w-full bg-accent hover:bg-accent/90 text-bg font-semibold text-xs py-2 px-3 rounded transition-colors flex items-center justify-center gap-2"
              >
                <SunMedium className="w-4 h-4" /> Begin Day
              </button>
            ) : (
              <button 
                onClick={closeDay}
                className="w-full bg-raised hover:bg-line text-text border border-line font-medium text-xs py-2 px-3 rounded transition-colors flex items-center justify-center gap-2"
              >
                <Moon className="w-4 h-4" /> Close Day
              </button>
            )}
          </div>
        </div>

        {/* Aggregate Horizons */}
        <div className="bg-surface border border-line rounded p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Horizons</span>
            <Calendar className="w-4 h-4 text-muted" />
          </div>
          <div className="space-y-2.5 my-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">This Week</span>
              <span className="font-stat font-semibold text-done">88.4%</span>
            </div>
            <div className="w-full bg-raised rounded-full h-1 overflow-hidden">
              <div className="bg-done h-full w-[88.4%]" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">This Month</span>
              <span className="font-stat font-semibold text-done">81.0%</span>
            </div>
            <div className="w-full bg-raised rounded-full h-1 overflow-hidden">
              <div className="bg-done h-full w-[81%]" />
            </div>
          </div>
          <div className="text-[11px] text-muted text-right">History kept automatically</div>
        </div>
      </div>

      {/* Main Quests Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Main Quests (High Impact)
          </h2>
          <span className="text-xs text-muted font-stat">Weight 3x</span>
        </div>

        <div className="space-y-2">
          {mainQuests.map((quest) => (
            <QuestRow 
              key={quest.id} 
              quest={quest} 
              onToggle={() => toggleDone(quest.id)}
              onProgress={(p) => updateProgress(quest.id, p)}
            />
          ))}
        </div>
      </div>

      {/* Daily & Habit Quests Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            Standard & Bonus Quests
          </h2>
          <span className="text-xs text-muted font-stat">Standard 2x • Bonus +2.5</span>
        </div>

        <div className="space-y-2">
          {dailyQuests.map((quest) => (
            <QuestRow 
              key={quest.id} 
              quest={quest} 
              onToggle={() => toggleDone(quest.id)}
              onProgress={(p) => updateProgress(quest.id, p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface QuestRowProps {
  quest: QuestEntry;
  onToggle: () => void;
  onProgress: (val: number) => void;
}

const QuestRow: React.FC<QuestRowProps> = ({ quest, onToggle, onProgress }) => {
  const isDone = quest.status === 'done';
  const isPartial = quest.status === 'partial';
  const isSkipped = quest.status === 'skipped';
  const isMissed = quest.status === 'missed';

  return (
    <div className={`flex items-center justify-between p-3.5 rounded bg-surface border transition ${
      isDone ? 'border-line/40 opacity-75' : isMissed ? 'border-missed/30' : 'border-line hover:border-line/80'
    }`}>
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <button 
          onClick={onToggle}
          className="text-muted hover:text-accent transition-colors flex-shrink-0"
        >
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-done" />
          ) : isPartial ? (
            <div className="w-5 h-5 rounded-full border-2 border-warn flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-warn" />
            </div>
          ) : (
            <Circle className="w-5 h-5 text-line hover:border-accent" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-muted' : 'text-text'}`}>
              {quest.name}
            </span>
            <span className={`text-[11px] capitalize font-semibold px-1.5 py-0.5 rounded ${
              quest.tier === 'core' 
                ? 'bg-accent/10 text-accent border border-accent/20' 
                : quest.tier === 'standard' 
                ? 'bg-raised text-muted border border-line' 
                : 'bg-warn/10 text-warn border border-warn/20'
            }`}>
              {quest.tier}
            </span>
          </div>

          {quest.target > 1 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-32 bg-raised rounded-full h-1 overflow-hidden">
                <div 
                  className={`h-full ${isDone ? 'bg-done' : 'bg-warn'}`}
                  style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-stat text-muted">
                {quest.progress} / {quest.target}
              </span>
              {!isDone && (
                <button
                  onClick={() => onProgress(quest.progress + 1)}
                  className="text-[11px] font-stat px-1.5 py-0.5 bg-raised hover:bg-line text-text rounded border border-line"
                >
                  +1
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted flex-shrink-0">
        {isSkipped && <span className="text-muted italic">Skipped ({quest.reason || 'excused'})</span>}
        {isMissed && <span className="text-missed font-medium">Missed (0 pts)</span>}
        <span className="text-[11px] font-stat text-muted/60">{quest.source_type}</span>
      </div>
    </div>
  );
};
