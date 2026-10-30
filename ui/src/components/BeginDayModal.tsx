import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { usePracticeStore } from '../store/usePracticeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { SunMedium, ArrowRight, Check, Dumbbell, Compass } from 'lucide-react';

interface BeginDayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BeginDayModal: React.FC<BeginDayModalProps> = ({ isOpen, onClose }) => {
  const beginDay = useAppStore((s) => s.beginDay);
  const entries = useAppStore((s) => s.entries);
  const intention = useAppStore((s) => s.intention);
  const setIntention = useAppStore((s) => s.setIntention);
  const removeEntry = useAppStore((s) => s.removeEntry);
  const practices = usePracticeStore((s) => s.practices);
  const weekPlan = useWorkoutStore((s) => s.weekPlan);

  const [step, setStep] = useState<number>(0);
  const [selectedMainQuests, setSelectedMainQuests] = useState<string[]>([]);

  if (!isOpen) return null;

  const STEPS = [
    { id: 'checkin', title: 'Morning Check-in' },
    { id: 'carryover', title: 'Carry-Over Review' },
    { id: 'practice', title: 'Spiritual / Focus Practice' },
    { id: 'intention', title: 'Daily Intention' },
    { id: 'workout', title: 'Fitness & Movement' },
    { id: 'mainquests', title: 'Pick 3 Main Quests' },
  ];

  const handleFinish = () => {
    beginDay();
    onClose();
  };

  const unfinished = entries.filter((e) => e.status !== 'done');
  const todayPlan = weekPlan.find((d) => d.day === new Date().getDay());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-surface border border-line rounded p-6 flex flex-col justify-between min-h-[460px] animate-fadeRise">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <SunMedium className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text">Begin Day · System Wakeup</h2>
            </div>
            <button
              onClick={handleFinish}
              className="text-xs text-muted hover:text-text transition-colors"
            >
              Skip to dashboard
            </button>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center justify-between gap-1 mt-4 mb-6">
            {STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full transition ${
                  idx <= step ? 'bg-accent' : 'bg-raised'
                }`}
              />
            ))}
          </div>

          {/* Step 0: Check-in */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text">
                Step 1: Wake Time & Readiness
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Your waking time will be stamped now. Yesterday's history stays exactly as it
                was recorded — no penalties.
              </p>
              <div className="p-4 bg-bg rounded border border-line flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted">Day starts</div>
                  <div className="text-sm font-stat font-bold text-text">Now</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Current Time</div>
                  <div className="text-sm font-stat font-bold text-accent">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Carry-over */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text">
                Step 2: Carry-Over Review
              </h3>
              <p className="text-xs text-muted">
                Unfinished items on today's list. Keep them, or drop them neutrally without
                penalty:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {unfinished.length === 0 ? (
                  <p className="text-xs text-muted text-center py-4">
                    Nothing to carry over — clean slate.
                  </p>
                ) : (
                  unfinished.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-bg rounded border border-line flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-text truncate pr-3">{entry.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setSelectedMainQuests((s) => s)}
                          className="px-2 py-1 bg-raised hover:bg-line text-text rounded"
                        >
                          Carry
                        </button>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="px-2 py-1 bg-raised hover:bg-line text-muted rounded"
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Practice */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text">
                Step 3: Spiritual / Focus Practice
              </h3>
              <p className="text-xs text-muted">
                Prepare your mindset through concentration before opening distractions:
              </p>
              {practices.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">
                  No practice configured yet. Add one in the Practice screen.
                </p>
              ) : (
                <div className="p-4 bg-bg rounded border border-line flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5 text-accent" />
                    <div>
                      <div className="text-xs font-semibold text-text">{practices[0].name}</div>
                      <div className="text-[11px] text-muted">Daily practice</div>
                    </div>
                  </div>
                  <span className="text-xs font-stat text-warn font-semibold">
                    {practices[0].reps} target
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Intention */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text">
                Step 4: Daily Intention
              </h3>
              <p className="text-xs text-muted">
                State your non-negotiable mental posture for today:
              </p>
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="e.g. Finish the one task that moves the goal forward."
                className="w-full bg-bg border border-line rounded p-3 text-xs text-text focus:outline-none focus:border-muted min-h-[90px]"
              />
            </div>
          )}

          {/* Step 4: Workout */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text">
                Step 5: Fitness & Movement
              </h3>
              <p className="text-xs text-muted">
                Scheduled session for today based on your training cycle:
              </p>
              <div className="p-4 bg-bg rounded border border-line flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-accent" />
                <div>
                  <div className="text-xs font-semibold text-text">
                    {!todayPlan || todayPlan.isRest ? 'Rest Day — recovery planned' : todayPlan.sessionName}
                  </div>
                  <div className="text-[11px] text-muted font-stat">
                    {!todayPlan || todayPlan.isRest
                      ? 'No training required today'
                      : `${todayPlan.exercises.length} exercise${todayPlan.exercises.length === 1 ? '' : 's'} planned`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Pick 3 Main Quests */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text">
                Step 6: Pick 3 Main Quests
              </h3>
              <p className="text-xs text-muted">
                These 3 tasks dictate your highest-impact execution for today:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {entries.length === 0 ? (
                  <p className="text-xs text-muted text-center py-4">
                    No quests yet. Add them from the Today screen after this check-in.
                  </p>
                ) : (
                  entries.slice(0, 8).map((entry) => {
                    const isSelected = selectedMainQuests.includes(entry.id);
                    return (
                      <div
                        key={entry.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMainQuests(selectedMainQuests.filter((id) => id !== entry.id));
                          } else if (selectedMainQuests.length < 3) {
                            setSelectedMainQuests([...selectedMainQuests, entry.id]);
                          }
                        }}
                        className={`p-3 rounded border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-accent/10 border-accent/40 text-text'
                            : 'bg-bg border-line text-muted hover:border-line/80'
                        }`}
                      >
                        <span className="truncate pr-3">{entry.name}</span>
                        <span className="font-stat flex-shrink-0">{isSelected ? 'Picked' : '+ Pick'}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Nav Buttons */}
        <div className="flex items-center justify-between border-t border-line pt-4 mt-6">
          <button
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            className="px-3 py-1.5 text-xs text-muted hover:text-text disabled:opacity-30 disabled:hover:text-muted transition-colors"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 bg-white hover:bg-white/90 text-[#111111] text-xs font-bold rounded transition-colors flex items-center gap-1.5"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-4 py-2 bg-white hover:bg-white/90 text-[#111111] text-xs font-bold rounded transition-colors flex items-center gap-1.5"
            >
              Complete & Begin Today <Check className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
