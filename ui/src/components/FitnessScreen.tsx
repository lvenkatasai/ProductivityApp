import React, { useState, useEffect } from 'react';
import {
  Dumbbell, Plus, Check, Trash2, ChevronDown, ChevronRight,
  Moon, Edit3, X, Coffee, Play, RotateCcw
} from 'lucide-react';
import { useWorkoutStore, DayOfWeek, ExerciseTemplate, SetTemplate } from '../store/useWorkoutStore';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ──────────────────────────── AddExerciseModal ──────────────────────────── */
interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ex: ExerciseTemplate) => void;
}

const QUICK_EXERCISES = [
  'Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Fly',
  'Standing Overhead Press', 'Lateral Raises', 'Tricep Pushdown',
  'Weighted Pull-ups', 'Barbell Row', 'Seated Cable Row', 'Bicep Curl',
  'Back Squat', 'Romanian Deadlift', 'Leg Press', 'Lunges',
  'Deadlift', 'Farmer Carries', 'Hip Thrust', 'Face Pulls',
  'Plank', 'Ab Rollout'
];

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(0);
  const [note, setNote] = useState('');
  const [filtered, setFiltered] = useState<string[]>([]);

  useEffect(() => {
    if (name.length > 0) {
      setFiltered(
        QUICK_EXERCISES.filter((q) => q.toLowerCase().includes(name.toLowerCase())).slice(0, 5)
      );
    } else {
      setFiltered([]);
    }
  }, [name]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!name.trim()) return;
    const exercise: ExerciseTemplate = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      note: note.trim() || undefined,
      sets: Array.from({ length: sets }, (_, i) => ({
        set_number: i + 1,
        reps,
        weight_kg: weight,
      })),
    };
    onAdd(exercise);
    setName(''); setSets(3); setReps(8); setWeight(0); setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-line rounded-md w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-sm font-bold text-text">Add Exercise</h2>
          <button onClick={onClose} className="text-muted hover:text-text p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Name + autocomplete */}
          <div className="relative">
            <label className="text-[10px] uppercase font-semibold text-muted tracking-wider">Exercise Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Barbell Bench Press"
              className="mt-1 w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent placeholder:text-muted/50"
              autoFocus
            />
            {filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-0.5 bg-raised border border-line rounded shadow-xl z-10">
                {filtered.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setName(q); setFiltered([]); }}
                    className="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sets / Reps / Weight */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted tracking-wider">Sets</label>
              <input
                type="number" min={1} max={10}
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
                className="mt-1 w-full bg-bg border border-line rounded px-2 py-2 text-xs text-text focus:outline-none focus:border-accent text-center font-stat"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted tracking-wider">Reps</label>
              <input
                type="number" min={1} max={100}
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
                className="mt-1 w-full bg-bg border border-line rounded px-2 py-2 text-xs text-text focus:outline-none focus:border-accent text-center font-stat"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted tracking-wider">Kg</label>
              <input
                type="number" min={0} step={2.5}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="mt-1 w-full bg-bg border border-line rounded px-2 py-2 text-xs text-text focus:outline-none focus:border-accent text-center font-stat"
              />
            </div>
          </div>

          {/* Note (optional) */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-muted tracking-wider">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. pause at bottom"
              className="mt-1 w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent placeholder:text-muted/50"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted hover:text-text border border-line rounded hover:border-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="px-4 py-1.5 text-xs font-bold bg-accent hover:bg-accent/90 text-bg rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Exercise
          </button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────── DayPlanCard ──────────────────────────── */
interface DayPlanCardProps {
  day: DayOfWeek;
  isToday: boolean;
}

const DayPlanCard: React.FC<DayPlanCardProps> = ({ day, isToday }) => {
  const { weekPlan, setDayRest, setDaySessionName, addExercise, removeExercise, addSet, removeSet } =
    useWorkoutStore();
  const plan = weekPlan.find((d) => d.day === day)!;
  const [expanded, setExpanded] = useState(isToday);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(plan.sessionName);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <div
        className={`bg-surface border rounded transition-all ${
          isToday ? 'border-accent/50 shadow-lg shadow-accent/5' : 'border-line'
        }`}
      >
        {/* Day Header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isToday
                  ? 'bg-accent text-bg'
                  : plan.isRest
                  ? 'bg-raised text-muted'
                  : 'bg-raised text-text'
              }`}
            >
              {DAY_LABELS[day]}
            </div>
            <div>
              {editingName && !plan.isRest ? (
                <input
                  type="text"
                  value={nameInput}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={() => {
                    setDaySessionName(day, nameInput);
                    setEditingName(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setDaySessionName(day, nameInput);
                      setEditingName(false);
                    }
                  }}
                  className="bg-bg border border-accent rounded px-2 py-0.5 text-xs text-text focus:outline-none w-48"
                  autoFocus
                />
              ) : (
                <span className="text-sm font-semibold text-text">{plan.sessionName}</span>
              )}
              {!plan.isRest && (
                <span className="ml-2 text-[11px] text-muted font-stat">
                  {plan.exercises.length} exercises
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isToday && !plan.isRest && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                Today
              </span>
            )}

            {/* Rest toggle */}
            <button
              onClick={() => setDayRest(day, !plan.isRest)}
              className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-colors ${
                plan.isRest
                  ? 'bg-raised text-muted border-line hover:border-text'
                  : 'bg-bg text-muted border-line hover:text-warn hover:border-warn'
              }`}
              title={plan.isRest ? 'Switch to workout day' : 'Set as rest day'}
            >
              {plan.isRest ? <Coffee className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              {plan.isRest ? 'Rest' : 'Set Rest'}
            </button>

            {!plan.isRest && (
              <button
                onClick={() => setEditingName(true)}
                className="p-1 text-muted hover:text-text rounded transition-colors"
                title="Rename session"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && !plan.isRest && (
          <div className="border-t border-line px-4 py-3 space-y-3">
            {plan.exercises.length === 0 && (
              <p className="text-xs text-muted text-center py-3">
                No exercises yet — add one below.
              </p>
            )}

            {plan.exercises.map((ex) => (
              <div key={ex.id} className="bg-bg rounded border border-line/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-text">{ex.name}</span>
                    {ex.note && (
                      <span className="ml-2 text-[10px] text-muted italic">{ex.note}</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeExercise(day, ex.id)}
                    className="text-muted hover:text-missed p-1 rounded transition-colors"
                    title="Remove exercise"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sets table */}
                <div className="grid grid-cols-4 gap-1 text-[10px] font-medium text-muted uppercase tracking-wider pb-1 border-b border-line/30">
                  <span>Set</span><span>Reps</span><span>Kg</span><span className="text-right">Del</span>
                </div>
                {ex.sets.map((s, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-4 gap-1 items-center">
                    <span className="text-[11px] font-stat text-muted">#{s.set_number}</span>
                    <input
                      type="number" min={1}
                      value={s.reps}
                      onChange={(e) => useWorkoutStore.getState().updateExerciseSet(day, ex.id, sIdx, 'reps', Number(e.target.value))}
                      className="bg-raised border border-line/60 rounded px-2 py-0.5 text-[11px] font-stat text-text focus:outline-none focus:border-accent w-full"
                    />
                    <input
                      type="number" min={0} step={2.5}
                      value={s.weight_kg}
                      onChange={(e) => useWorkoutStore.getState().updateExerciseSet(day, ex.id, sIdx, 'weight_kg', Number(e.target.value))}
                      className="bg-raised border border-line/60 rounded px-2 py-0.5 text-[11px] font-stat text-text focus:outline-none focus:border-accent w-full"
                    />
                    <button
                      onClick={() => removeSet(day, ex.id, sIdx)}
                      className="ml-auto text-muted hover:text-missed transition-colors"
                      disabled={ex.sets.length <= 1}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addSet(day, ex.id)}
                  className="text-[10px] text-accent hover:text-accent/80 flex items-center gap-1 transition-colors mt-1"
                >
                  <Plus className="w-3 h-3" /> Add Set
                </button>
              </div>
            ))}

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-accent border border-accent/30 border-dashed rounded hover:bg-accent/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Exercise
            </button>
          </div>
        )}

        {/* Expanded rest day */}
        {expanded && plan.isRest && (
          <div className="border-t border-line px-4 py-6 flex flex-col items-center gap-2">
            <Coffee className="w-8 h-8 text-muted/40" />
            <p className="text-xs text-muted text-center">
              Rest day — recovery is part of the programme.
            </p>
            <button
              onClick={() => setDayRest(day, false)}
              className="mt-1 text-[10px] text-accent hover:underline"
            >
              Switch to workout day →
            </button>
          </div>
        )}
      </div>

      <AddExerciseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(ex) => addExercise(day, ex)}
      />
    </>
  );
};

/* ──────────────────────────── TodayWorkoutPanel ──────────────────────────── */
const TodayWorkoutPanel: React.FC<{ todayDay: DayOfWeek }> = ({ todayDay }) => {
  const { weekPlan, todaySession, initTodaySession, toggleSetDone } = useWorkoutStore();
  const plan = weekPlan.find((d) => d.day === todayDay)!;

  useEffect(() => {
    if (!todaySession) {
      initTodaySession(todayDay);
    }
  }, []);

  if (plan.isRest) {
    return (
      <div className="bg-surface border border-line rounded p-8 flex flex-col items-center gap-3">
        <Coffee className="w-10 h-10 text-muted/30" />
        <h3 className="text-sm font-bold text-text">Rest Day</h3>
        <p className="text-xs text-muted text-center max-w-xs">
          {DAY_FULL[todayDay]} is scheduled as a rest/recovery day. Relax, sleep well.
        </p>
      </div>
    );
  }

  if (!todaySession) {
    return (
      <div className="bg-surface border border-line rounded p-8 flex flex-col items-center gap-3">
        <Dumbbell className="w-10 h-10 text-muted/30" />
        <h3 className="text-sm font-bold text-text">Start Today's Session</h3>
        <button
          onClick={() => initTodaySession(todayDay)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-bg text-xs font-bold rounded transition-colors"
        >
          <Play className="w-4 h-4" /> Begin Workout
        </button>
      </div>
    );
  }

  const totalSets = todaySession.exercises.reduce((a, ex) => a + ex.sets.length, 0);
  const doneSets = todaySession.exercises.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.completed).length,
    0
  );
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="bg-surface border border-accent/30 rounded p-5 space-y-5">
      {/* Session header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-accent">Live Session</div>
          <h3 className="text-base font-bold text-text mt-0.5">{plan.sessionName}</h3>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted">Progress</div>
          <div className="text-sm font-stat font-bold text-accent">
            {doneSets}/{totalSets} sets ({pct}%)
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-raised rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {todaySession.exercises.map((ex, eIdx) => (
          <div key={ex.templateId} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
              <span className="text-xs font-bold text-text">{ex.name}</span>
              <span className="text-[10px] text-muted font-stat ml-auto">
                {ex.sets.filter((s) => s.completed).length}/{ex.sets.length}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 text-[10px] font-medium text-muted uppercase tracking-wider pb-1 border-b border-line/30 px-2">
              <span>Set</span><span>Weight</span><span>Reps</span><span className="text-right">Done</span>
            </div>

            {ex.sets.map((s, sIdx) => (
              <div
                key={sIdx}
                onClick={() => toggleSetDone(eIdx, sIdx)}
                className={`grid grid-cols-4 gap-1 items-center px-2 py-2 rounded cursor-pointer transition-all text-xs ${
                  s.completed
                    ? 'bg-done/10 border border-done/25 text-text'
                    : 'bg-bg border border-line/40 hover:border-line text-muted'
                }`}
              >
                <span className="font-stat font-semibold">Set {s.set_number}</span>
                <span className="font-stat">{s.weight_kg} kg</span>
                <span className="font-stat">{s.reps} reps</span>
                <span className="text-right flex justify-end">
                  {s.completed ? (
                    <Check className="w-4 h-4 text-done" />
                  ) : (
                    <div className="w-4 h-4 rounded border border-line" />
                  )}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={() => initTodaySession(todayDay)}
        className="flex items-center gap-1.5 text-[11px] text-muted hover:text-text transition-colors"
      >
        <RotateCcw className="w-3 h-3" /> Reset session
      </button>
    </div>
  );
};

/* ──────────────────────────── FitnessScreen (main) ──────────────────────────── */
export const FitnessScreen: React.FC = () => {
  const todayDay = new Date().getDay() as DayOfWeek;
  const [view, setView] = useState<'today' | 'planner'>('today');
  const { weekPlan } = useWorkoutStore();

  const totalWorkoutDays = weekPlan.filter((d) => !d.isRest).length;
  const totalExercises = weekPlan.reduce((a, d) => a + d.exercises.length, 0);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
            <Dumbbell className="w-4 h-4 text-accent" />
            <span>Athletic Conditioning</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text mt-1">Workout Planner</h1>
          <p className="text-sm text-muted">
            {totalWorkoutDays} training days · {totalExercises} exercises this week
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-raised p-1 rounded border border-line">
          <button
            onClick={() => setView('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              view === 'today' ? 'bg-surface text-accent' : 'text-muted hover:text-text'
            }`}
          >
            Today's Session
          </button>
          <button
            onClick={() => setView('planner')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              view === 'planner' ? 'bg-surface text-accent' : 'text-muted hover:text-text'
            }`}
          >
            Weekly Planner
          </button>
        </div>
      </div>

      {/* Weekly summary bar */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekPlan.map((d) => (
          <div
            key={d.day}
            className={`py-2 px-1 rounded border text-center transition-all ${
              d.day === todayDay
                ? 'border-accent/60 bg-accent/10'
                : d.isRest
                ? 'border-line bg-bg'
                : 'border-line bg-surface'
            }`}
          >
            <div
              className={`text-[10px] font-bold uppercase tracking-wider ${
                d.day === todayDay ? 'text-accent' : d.isRest ? 'text-muted/50' : 'text-muted'
              }`}
            >
              {DAY_LABELS[d.day]}
            </div>
            <div className="mt-1">
              {d.isRest ? (
                <Moon className="w-3.5 h-3.5 text-muted/30 mx-auto" />
              ) : (
                <Dumbbell className="w-3.5 h-3.5 text-accent/60 mx-auto" />
              )}
            </div>
            <div className="text-[9px] text-muted/60 mt-0.5 truncate px-1">
              {d.isRest ? 'Rest' : `${d.exercises.length}ex`}
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      {view === 'today' && <TodayWorkoutPanel todayDay={todayDay} />}

      {view === 'planner' && (
        <div className="space-y-2">
          <p className="text-xs text-muted pb-2">
            Click a day to expand · edit sets inline · toggle rest days · add or remove exercises
          </p>
          {weekPlan.map((d) => (
            <DayPlanCard key={d.day} day={d.day} isToday={d.day === todayDay} />
          ))}
        </div>
      )}
    </div>
  );
};
