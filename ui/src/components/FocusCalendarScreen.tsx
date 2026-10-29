import React, { useState, useEffect } from 'react';
import {
  Timer, Play, Pause, RotateCcw, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, CheckCircle2, Circle, X
} from 'lucide-react';

/* ─── Types ─── */
interface FocusSession {
  id: string;
  linkedTitle: string;
  category: 'Task' | 'Project' | 'Goal' | 'Area';
  plannedMinutes: number;
  actualMinutes: number;
  date: string; // YYYY-MM-DD
}

interface DayScore {
  date: string;
  score: number;
  done: number;
  total: number;
}

/* ─── Seed focus sessions ─── */
const SEED_SESSIONS: FocusSession[] = [
  {
    id: 'fs-1',
    linkedTitle: 'Build and ship Productivity OS v1.0',
    category: 'Goal',
    plannedMinutes: 50,
    actualMinutes: 50,
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'fs-2',
    linkedTitle: 'Core domain score & XP engine',
    category: 'Task',
    plannedMinutes: 25,
    actualMinutes: 25,
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'fs-3',
    linkedTitle: 'SQLite storage adapter',
    category: 'Project',
    plannedMinutes: 30,
    actualMinutes: 30,
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })(),
  },
];

/* ─── Seed daily scores (past ~3 months) ─── */
function generateScores(): DayScore[] {
  const scores: DayScore[] = [];
  const today = new Date();
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const seed = d.getDate() * (d.getMonth() + 1);
    const rand = ((seed * 1103515245 + 12345) & 0x7fffffff) % 100;
    const score = i === 0 ? 88 : 50 + (rand % 50);
    const total = 5 + (rand % 3);
    const done = Math.round((score / 100) * total);
    scores.push({ date: dateStr, score, done, total });
  }
  return scores;
}

const ALL_SCORES = generateScores();

function getScoreForDate(date: string): DayScore | undefined {
  return ALL_SCORES.find((s) => s.date === date);
}

/* ─── Calendar helpers ─── */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

/* ─── DayDetailPanel ─── */
const DayDetailPanel: React.FC<{
  date: string;
  sessions: FocusSession[];
  onClose: () => void;
}> = ({ date, sessions, onClose }) => {
  const score = getScoreForDate(date);
  const daySessions = sessions.filter((s) => s.date === date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-surface border border-line rounded-md w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="text-sm font-bold text-text">{date}</h2>
            {score && (
              <p className="text-[11px] text-muted mt-0.5">
                Score: <span className="font-stat font-bold text-accent">{score.score}%</span>
                {' · '}{score.done}/{score.total} tasks
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-text p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {!score && (
            <p className="text-xs text-muted text-center py-4">No data recorded for this day.</p>
          )}

          {score && daySessions.length === 0 && (
            <p className="text-xs text-muted text-center py-4">No focus sessions logged this day.</p>
          )}

          {daySessions.map((s) => (
            <div key={s.id} className="p-3 bg-bg rounded border border-line flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-text">{s.linkedTitle}</div>
                <div className="text-[10px] text-muted mt-0.5">{s.category}</div>
              </div>
              <div className="text-xs font-stat font-bold text-done">{s.actualMinutes}m</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Full Calendar ─── */
const FullCalendar: React.FC<{ sessions: FocusSession[] }> = ({ sessions }) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = toISO(now);
  const days = getDaysInMonth(viewYear, viewMonth);
  const firstDow = days[0].getDay(); // 0=Sun

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };
  const goToday = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); };

  // Score color
  const scoreColor = (score?: DayScore) => {
    if (!score) return 'bg-bg border-line/40 text-muted/40';
    if (score.score >= 80) return 'bg-done/15 border-done/30 text-done';
    if (score.score >= 60) return 'bg-accent/10 border-accent/20 text-accent';
    if (score.score >= 40) return 'bg-warn/10 border-warn/20 text-warn';
    return 'bg-missed/10 border-missed/20 text-missed';
  };

  return (
    <div className="bg-surface border border-line rounded-md p-5 space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded border border-line hover:border-text text-muted hover:text-text transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-bold text-text w-40 text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded border border-line hover:border-text text-muted hover:text-text transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="text-[11px] font-semibold px-2 py-1 rounded border border-line hover:border-accent text-muted hover:text-accent transition-colors"
          >
            Today
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-stat text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-done/30" /> 80%+
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent/20" /> 60%+
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-warn/20" /> 40%+
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-missed/20" /> &lt;40%
          </span>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_ABBR.map((d) => (
          <div key={d} className="text-[11px] font-semibold text-muted text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading blank cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = toISO(day);
          const score = getScoreForDate(dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const hasSessions = sessions.some((s) => s.date === dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && setSelectedDate(dateStr)}
              disabled={isFuture}
              className={`relative min-h-[56px] p-1.5 rounded border flex flex-col items-center gap-0.5 transition
                ${isFuture ? 'border-line/20 text-muted/25 cursor-default' : 'cursor-pointer hover:border-text/60'}
                ${isToday ? '!border-accent ring-1 ring-accent/30' : ''}
                ${!isFuture ? scoreColor(score) : 'bg-bg'}
              `}
            >
              <span
                className={`text-[11px] font-bold font-stat w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-accent text-bg' : ''
                }`}
              >
                {day.getDate()}
              </span>

              {score && !isFuture && (
                <span className="text-[11px] font-stat font-semibold leading-none">{score.score}%</span>
              )}

              {hasSessions && !isFuture && (
                <span className="w-1 h-1 rounded-full bg-current opacity-70 mt-auto" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          sessions={sessions}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};

/* ─── Main FocusCalendarScreen ─── */
export const FocusCalendarScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'calendar'>('timer');

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [linkedEntity, setLinkedEntity] = useState('Build and ship Productivity OS v1.0 (Goal)');
  const [sessions, setSessions] = useState<FocusSession[]>(SEED_SESSIONS);
  const [timerMode, setTimerMode] = useState<25 | 50>(25);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      // Log a session on completion
      const newSession: FocusSession = {
        id: `fs-${Date.now()}`,
        linkedTitle: linkedEntity.replace(/\s*\(.*\)$/, ''),
        category: 'Task',
        plannedMinutes: timerMode,
        actualMinutes: timerMode,
        date: new Date().toISOString().split('T')[0],
      };
      setSessions((prev) => [newSession, ...prev]);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, secondsLeft]);

  const toggleTimer = () => setIsRunning((r) => !r);
  const resetTimer = () => { setIsRunning(false); setSecondsLeft(timerMode * 60); };
  const switchMode = (mins: 25 | 50) => {
    setTimerMode(mins);
    setIsRunning(false);
    setSecondsLeft(mins * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalPct = Math.round(((timerMode * 60 - secondsLeft) / (timerMode * 60)) * 100);

  const totalFocusMin = sessions.reduce((a, s) => a + s.actualMinutes, 0);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Timer className="w-4 h-4 text-accent" />
            <span>Investment & History</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text mt-1">
            Focus Timer & Calendar
          </h1>
          <p className="text-sm text-muted">
            {totalFocusMin} mins logged this session · click any past day to inspect
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center bg-raised p-1 rounded border border-line">
          <button
            onClick={() => setActiveTab('timer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'timer' ? 'bg-surface text-accent' : 'text-muted hover:text-text'
            }`}
          >
            Focus Timer
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'calendar' ? 'bg-surface text-accent' : 'text-muted hover:text-text'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* ─── Timer view ─── */}
      {activeTab === 'timer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timer card */}
          <div className="bg-surface border border-line rounded p-8 flex flex-col items-center space-y-6">
            <div className="text-xs font-semibold text-muted">Deep Work Interval</div>

            {/* Mode selector */}
            <div className="flex gap-2">
              {([25, 50] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${
                    timerMode === m
                      ? 'bg-accent text-bg border-accent'
                      : 'border-line text-muted hover:border-text hover:text-text'
                  }`}
                >
                  {m}min
                </button>
              ))}
            </div>

            {/* Ring + time */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#232833" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="#4C9AFF"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - totalPct / 100)}`}
                  strokeLinecap="round"
                  className="transition-[stroke-dashoffset] duration-1000"
                />
              </svg>
              <span className="text-4xl font-extrabold font-stat text-text tracking-tighter">
                {timeFormatted}
              </span>
            </div>

            {/* Linked input */}
            <div className="w-full max-w-xs space-y-1">
              <label className="text-xs font-medium text-muted">
                Linked Goal or Task
              </label>
              <input
                type="text"
                value={linkedEntity}
                onChange={(e) => setLinkedEntity(e.target.value)}
                className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTimer}
                className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-bg text-xs font-bold rounded transition-colors flex items-center gap-1.5"
              >
                {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
              </button>
              <button
                onClick={resetTimer}
                className="p-2.5 bg-raised hover:bg-line text-muted hover:text-text rounded border border-line transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sessions log */}
          <div className="bg-surface border border-line rounded p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-xs font-semibold text-muted">
                Completed Sessions
              </h3>
              <span className="text-xs font-stat text-accent font-semibold">
                {totalFocusMin} mins total
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-bg rounded border border-line flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-text">{s.linkedTitle}</div>
                    <div className="text-[11px] text-muted mt-0.5">
                      {s.category} · {s.date}
                    </div>
                  </div>
                  <div className="text-right font-stat font-bold text-done">
                    {s.actualMinutes}m
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Calendar view ─── */}
      {activeTab === 'calendar' && <FullCalendar sessions={sessions} />}
    </div>
  );
};
