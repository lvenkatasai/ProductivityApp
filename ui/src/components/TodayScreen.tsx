import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, Circle, Moon, SunMedium } from 'lucide-react';
import { QuestEntry } from '../types';

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
  const doneCount = entries.length - remainingCount;

  return (
    <div className="flex-1 overflow-y-auto px-7 py-7">
      <div className="max-w-[1100px] mx-auto">
        {/* Greeting */}
        <h1 className="text-2xl font-normal tracking-[-0.01em] text-text">
          Good Morning, Architect
        </h1>
        <p className="text-sm text-faint mt-0.5">
          {stats.day_begun ? `Day begun at ${stats.began_at} · Level ${stats.level} ${stats.rank}` : 'Review your carry-overs and begin day'}
        </p>

        {/* Count tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-7">
          <button
            onClick={() => setShowWhyDrawer(true)}
            className="bg-surface rounded p-4 h-[128px] flex flex-col justify-between text-left cursor-pointer hover:bg-raised transition-colors"
          >
            <span className="text-xs text-faint">Daily score</span>
            <span className={`text-2xl font-normal font-stat ${scoreResult.is_empty ? 'text-muted' : 'text-accent'}`}>
              {scoreResult.is_empty ? '—' : `${scoreResult.final_score}%`}
            </span>
            <span className="text-xs text-faint truncate">
              {scoreResult.is_empty
                ? 'No quests today'
                : `${scoreResult.earned_weight.toFixed(1)} / ${scoreResult.due_weight} pts${scoreResult.bonus_points > 0 ? ` + ${scoreResult.bonus_points} bonus` : ''}`}
            </span>
          </button>
          <div className="bg-surface rounded p-4 h-[128px] flex flex-col justify-between">
            <span className="text-xs text-faint">Quests</span>
            <span className="text-2xl font-normal font-stat text-text">
              {remainingCount === 0 ? 'All done' : `${remainingCount} left`}
            </span>
            <span className="text-xs text-faint">{doneCount} of {entries.length} done</span>
          </div>
          <div className="bg-surface rounded p-4 h-[128px] flex flex-col justify-between">
            <span className="text-xs text-faint">Discipline streak</span>
            <span className="text-2xl font-normal font-stat text-text">{stats.current_streak} d</span>
            <span className="text-xs text-faint">Level {stats.level} · {stats.rank}</span>
          </div>
          <div className="bg-surface rounded p-4 h-[128px] flex flex-col justify-between">
            <span className="text-xs text-faint">This week</span>
            <span className="text-2xl font-normal font-stat text-text">88.4%</span>
            <span className="text-xs text-faint">This month 81.0%</span>
          </div>
        </div>

        {/* Main quests (9) + Close the day (3) */}
        <div className="grid grid-cols-12 gap-3.5 mt-3.5 items-start">
          <section className="col-span-12 md:col-span-9 bg-surface rounded p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">Main quests</h3>
              <span className="text-xs text-faint">{mainQuests.filter(q => q.status === 'done').length} of {mainQuests.length} done · weight 3x</span>
            </div>
            <div className="space-y-2">
              {mainQuests.length === 0 ? (
                <p className="text-xs text-faint text-center py-6">
                  No main quests yet. Begin your day to load the plan you set.
                </p>
              ) : mainQuests.map((quest) => (
                <QuestRow
                  key={quest.id}
                  quest={quest}
                  onToggle={() => toggleDone(quest.id)}
                  onProgress={(p) => updateProgress(quest.id, p)}
                />
              ))}
            </div>
          </section>

          <section className="col-span-12 md:col-span-3 bg-surface rounded p-5 flex flex-col">
            <span className="text-xs text-faint">Focus status</span>
            <span className="text-2xl font-normal font-stat text-text mt-2.5">
              {remainingCount === 0 ? 'Clear' : `${remainingCount} quest${remainingCount === 1 ? '' : 's'}`}
            </span>
            <span className="text-xs text-faint mt-1.5">Core &amp; standard quests define your daily discipline.</span>
            <div className="mt-auto pt-4">
              <div className="flex justify-between items-baseline text-xs pb-2 border-t border-line">
                <span className="text-faint">XP total</span>
                <span className="font-stat text-text">{stats.overall_xp.toLocaleString()}</span>
              </div>
              {!stats.day_begun ? (
                <button
                  onClick={beginDay}
                  className="w-full bg-white hover:bg-white/90 text-[#111111] font-semibold text-[13px] py-2 rounded-full transition-colors flex items-center justify-center gap-1.5"
                >
                  <SunMedium className="w-4 h-4" /> Begin Day
                </button>
              ) : (
                <button
                  onClick={closeDay}
                  className="w-full bg-white hover:bg-white/90 text-[#111111] font-semibold text-[13px] py-2 rounded-full transition-colors flex items-center justify-center gap-1.5"
                >
                  <Moon className="w-4 h-4" /> Close Day
                </button>
              )}
              {!stats.day_begun && (
                <p className="text-[11px] text-faint text-center mt-2">begins pending quests</p>
              )}
            </div>
          </section>
        </div>

        {/* Standard & bonus (6) + Horizons (6) */}
        <div className="grid grid-cols-12 gap-3.5 mt-3.5 items-start">
          <section className="col-span-12 md:col-span-6 bg-surface rounded p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">Standard &amp; bonus</h3>
              <span className="text-xs text-faint">standard 2x · bonus +2.5</span>
            </div>
            <div className="space-y-2">
              {dailyQuests.length === 0 ? (
                <p className="text-xs text-faint text-center py-6">
                  No standard or bonus quests yet.
                </p>
              ) : dailyQuests.map((quest) => (
                <QuestRow
                  key={quest.id}
                  quest={quest}
                  onToggle={() => toggleDone(quest.id)}
                  onProgress={(p) => updateProgress(quest.id, p)}
                />
              ))}
            </div>
          </section>

          <section className="col-span-12 md:col-span-6 bg-surface rounded p-5">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-sm font-semibold text-text">Horizons</h3>
              <span className="text-xs text-faint">history kept automatically</span>
            </div>
            <div className="flex justify-between items-baseline text-sm pt-3">
              <span className="text-muted">This week</span>
              <span className="font-stat text-text">88.4%</span>
            </div>
            <div className="flex justify-between items-baseline text-sm pt-2.5">
              <span className="text-muted">This month</span>
              <span className="font-stat text-text">81.0%</span>
            </div>
            <div className="flex justify-between items-baseline text-sm pt-2.5 border-t border-line mt-2.5">
              <span className="text-muted">Bonus earned today</span>
              <span className="font-stat text-accent">+{scoreResult.bonus_points}</span>
            </div>
            <p className="text-xs text-faint mt-4">Scores are append-only — past days stay as they were recorded.</p>
          </section>
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
    <div className="flex items-center justify-between gap-4 min-h-[63px] px-4 py-3 bg-raised rounded-[14px]">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <button
          onClick={onToggle}
          className={`transition-colors flex-shrink-0 ${isDone ? 'text-accent' : 'text-faint hover:text-text'}`}
          aria-label={isDone ? 'Mark as pending' : 'Mark as done'}
        >
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-accent" />
          ) : isPartial ? (
            <div className="w-5 h-5 rounded-full border-2 border-accent flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-accent" />
            </div>
          ) : (
            <Circle className={`w-5 h-5 ${isMissed ? 'text-missed' : 'text-faint'}`} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className={`text-[13px] truncate ${isDone ? 'line-through text-muted' : 'text-text'}`}>
              {quest.name}
            </span>
            <span className="text-[11px] text-faint flex-shrink-0">{quest.tier}</span>
          </div>

          {(quest.target > 1 && !isDone) && (
            <div className="flex items-center gap-2.5 mt-1.5">
              <div className="w-28 h-1.5 bg-nested rounded-full overflow-hidden flex-shrink-0">
                <div
                  className="h-full bg-accent transition-[width] duration-300"
                  style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-stat text-muted">
                {quest.progress} / {quest.target}
              </span>
              <button
                onClick={() => onProgress(quest.progress + 1)}
                className="text-[11px] font-stat px-1.5 py-0.5 bg-nested hover:bg-line text-text rounded-full"
              >
                +1
              </button>
            </div>
          )}
          {quest.target > 1 && isDone && (
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="text-xs font-stat text-muted">{quest.progress} / {quest.target}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-xs flex-shrink-0 font-stat">
        {isSkipped && <span className="text-faint">Skipped ({quest.reason || 'excused'})</span>}
        {isMissed && <span className="text-missed">Missed · 0 pts</span>}
        {isDone && (
          <span className="text-muted">{quest.tier === 'core' ? '3 pts' : quest.tier === 'standard' ? '2 pts' : 'done'}</span>
        )}
      </div>
    </div>
  );
};
