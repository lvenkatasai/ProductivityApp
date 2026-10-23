import React, { useState, useRef } from 'react';
import {
  Compass, RotateCcw, Check, Plus, Trash2, X, ChevronDown, ChevronRight,
  FileText, Image, Volume2, Video, Upload, Sparkles, AlertCircle
} from 'lucide-react';
import { usePracticeStore, Practice, PracticeMedia, MediaType } from '../store/usePracticeStore';

/* ══════════════════════════════════════════════════════════
   AddPracticeModal
   ══════════════════════════════════════════════════════════ */
interface AddPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCEPT_MAP: Record<Exclude<MediaType, 'text'>, string> = {
  image: 'image/*',
  audio: 'audio/*',
  video: 'video/*',
};

const MEDIA_ICON: Record<MediaType, React.FC<{ className?: string }>> = {
  text: FileText,
  image: Image,
  audio: Volume2,
  video: Video,
};

const AddPracticeModal: React.FC<AddPracticeModalProps> = ({ isOpen, onClose }) => {
  const { addPractice } = usePracticeStore();

  // Step: 'basic' → 'media'
  const [step, setStep] = useState<'basic' | 'media'>('basic');

  // Basic fields
  const [name, setName] = useState('');
  const [reps, setReps] = useState('');
  const [xp, setXp] = useState(30);
  const [nameError, setNameError] = useState('');
  const [repsError, setRepsError] = useState('');

  // Media state
  const [mediaList, setMediaList] = useState<PracticeMedia[]>([]);
  const [textInput, setTextInput] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('text');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const goToMedia = () => {
    let ok = true;
    if (!name.trim()) { setNameError('Practice name is required'); ok = false; }
    else setNameError('');
    const repsNum = parseInt(reps, 10);
    if (!reps || isNaN(repsNum) || repsNum < 1) {
      setRepsError('Number of repetitions is required (min 1)');
      ok = false;
    } else setRepsError('');
    if (ok) setStep('media');
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    setMediaList((prev) => [...prev, { type: 'text', content: textInput.trim() }]);
    setTextInput('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setMediaList((prev) => [
        ...prev,
        { type: mediaType as Exclude<MediaType, 'text'>, content: dataUrl, filename: file.name },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreate = () => {
    addPractice({
      name: name.trim(),
      reps: parseInt(reps, 10),
      media: mediaList,
      xp,
    });
    // reset
    setName(''); setReps(''); setXp(30);
    setMediaList([]); setTextInput(''); setStep('basic');
    onClose();
  };

  const handleClose = () => {
    setName(''); setReps(''); setXp(30); setMediaList([]);
    setTextInput(''); setNameError(''); setRepsError(''); setStep('basic');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-line rounded-md w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="text-sm font-bold text-text">New Practice</h2>
            <p className="text-[11px] text-muted mt-0.5">
              {step === 'basic' ? 'Step 1 of 2 — Details' : 'Step 2 of 2 — Media (optional)'}
            </p>
          </div>
          <button onClick={handleClose} className="text-muted hover:text-text p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Basic details */}
        {step === 'basic' && (
          <div className="px-5 py-5 space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted tracking-wider">
                Practice Name <span className="text-missed">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 108 Concentration Breath"
                className={`mt-1 w-full bg-bg border rounded px-3 py-2 text-xs text-text focus:outline-none placeholder:text-muted/50 ${
                  nameError ? 'border-missed focus:border-missed' : 'border-line focus:border-accent'
                }`}
                autoFocus
              />
              {nameError && (
                <p className="mt-1 text-[10px] text-missed flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {nameError}
                </p>
              )}
            </div>

            {/* Repetitions (required) */}
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted tracking-wider">
                Target Repetitions <span className="text-missed">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="e.g. 108"
                className={`mt-1 w-full bg-bg border rounded px-3 py-2 text-xs text-text focus:outline-none font-stat placeholder:text-muted/50 ${
                  repsError ? 'border-missed focus:border-missed' : 'border-line focus:border-accent'
                }`}
              />
              {repsError && (
                <p className="mt-1 text-[10px] text-missed flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {repsError}
                </p>
              )}
            </div>

            {/* XP */}
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted tracking-wider">XP Reward</label>
              <input
                type="number"
                min={5}
                step={5}
                value={xp}
                onChange={(e) => setXp(Number(e.target.value))}
                className="mt-1 w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent font-stat"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={handleClose} className="px-3 py-1.5 text-xs text-muted hover:text-text border border-line rounded transition-colors">
                Cancel
              </button>
              <button
                onClick={goToMedia}
                className="px-4 py-1.5 text-xs font-bold bg-accent hover:bg-accent/90 text-bg rounded transition-colors"
              >
                Next: Media →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Media upload */}
        {step === 'media' && (
          <div className="px-5 py-5 space-y-4">
            <p className="text-xs text-muted">
              Attach text notes, images, audio or video to this practice. All media is kept until you remove it.
              This step is <span className="text-text font-semibold">optional</span> — skip to create immediately.
            </p>

            {/* Media type selector */}
            <div className="flex gap-2">
              {(['text', 'image', 'audio', 'video'] as MediaType[]).map((t) => {
                const Icon = MEDIA_ICON[t];
                return (
                  <button
                    key={t}
                    onClick={() => setMediaType(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[11px] font-semibold capitalize transition-colors ${
                      mediaType === t
                        ? 'bg-accent text-bg border-accent'
                        : 'border-line text-muted hover:border-text hover:text-text'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Text input */}
            {mediaType === 'text' && (
              <div className="space-y-2">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter your practice text, mantra, or instruction..."
                  rows={4}
                  className="w-full bg-bg border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent resize-none placeholder:text-muted/50"
                />
                <button
                  onClick={handleAddText}
                  disabled={!textInput.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent border border-accent/30 rounded hover:bg-accent/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Text
                </button>
              </div>
            )}

            {/* File upload */}
            {mediaType !== 'text' && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT_MAP[mediaType as Exclude<MediaType, 'text'>]}
                  onChange={handleFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-line rounded hover:border-accent/50 hover:bg-accent/5 transition-colors"
                >
                  <Upload className="w-6 h-6 text-muted" />
                  <span className="text-xs text-muted">
                    Click to upload {mediaType} file
                  </span>
                </button>
              </div>
            )}

            {/* Attached media list */}
            {mediaList.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-semibold text-muted tracking-wider">
                  Attached ({mediaList.length})
                </div>
                {mediaList.map((m, idx) => {
                  const Icon = MEDIA_ICON[m.type];
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-bg rounded border border-line text-xs"
                    >
                      <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-muted truncate flex-1">
                        {m.type === 'text' ? m.content.slice(0, 40) + (m.content.length > 40 ? '…' : '') : m.filename}
                      </span>
                      <button
                        onClick={() => setMediaList((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-muted hover:text-missed transition-colors p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between gap-2 pt-1">
              <button onClick={() => setStep('basic')} className="px-3 py-1.5 text-xs text-muted hover:text-text border border-line rounded transition-colors">
                ← Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-3 py-1.5 text-xs text-muted hover:text-text border border-line rounded transition-colors"
                >
                  Skip & Create
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-1.5 text-xs font-bold bg-accent hover:bg-accent/90 text-bg rounded transition-colors"
                >
                  Create Practice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MediaViewer — renders one piece of attached media
   ══════════════════════════════════════════════════════════ */
const MediaViewer: React.FC<{
  media: PracticeMedia;
  onRemove: () => void;
}> = ({ media, onRemove }) => {
  const Icon = MEDIA_ICON[media.type];

  return (
    <div className="bg-bg border border-line/60 rounded overflow-hidden group relative">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 z-10 p-1 rounded bg-black/50 text-muted hover:text-missed opacity-0 group-hover:opacity-100 transition-all"
        title="Remove media"
      >
        <X className="w-3 h-3" />
      </button>

      {media.type === 'text' && (
        <div className="p-3 flex items-start gap-2">
          <FileText className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text leading-relaxed italic">"{media.content}"</p>
        </div>
      )}

      {media.type === 'image' && (
        <div>
          <img
            src={media.content}
            alt={media.filename || 'practice image'}
            className="w-full max-h-48 object-contain bg-black/20"
          />
          {media.filename && (
            <div className="px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-muted">
              <Image className="w-3 h-3" /> {media.filename}
            </div>
          )}
        </div>
      )}

      {media.type === 'audio' && (
        <div className="p-3 flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-muted mb-1 truncate">{media.filename}</div>
            <audio controls src={media.content} className="w-full h-8" />
          </div>
        </div>
      )}

      {media.type === 'video' && (
        <div>
          <video
            controls
            src={media.content}
            className="w-full max-h-48 bg-black/40"
          />
          {media.filename && (
            <div className="px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-muted">
              <Video className="w-3 h-3" /> {media.filename}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   PracticeCard — single expandable practice
   ══════════════════════════════════════════════════════════ */
interface PracticeCardProps {
  practice: Practice;
  index: number;
}

const PracticeCard: React.FC<PracticeCardProps> = ({ practice, index }) => {
  const { increment, decrement, reset, removePractice, addMedia, removeMedia } = usePracticeStore();
  const [expanded, setExpanded] = useState(index === 0);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [addMediaType, setAddMediaType] = useState<MediaType>('text');
  const [addTextInput, setAddTextInput] = useState('');
  const addFileRef = useRef<HTMLInputElement>(null);

  const pct = Math.round((practice.count / practice.reps) * 100);
  const done = practice.count >= practice.reps;
  const circumference = 2 * Math.PI * 42; // r=42

  const handleAddText = () => {
    if (!addTextInput.trim()) return;
    addMedia(practice.id, { type: 'text', content: addTextInput.trim() });
    setAddTextInput('');
    setShowAddMedia(false);
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addMedia(practice.id, {
        type: addMediaType as Exclude<MediaType, 'text'>,
        content: ev.target?.result as string,
        filename: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAddMedia(false);
  };

  return (
    <div
      className={`bg-surface border rounded transition-all ${
        done ? 'border-done/40 shadow-lg shadow-done/5' : 'border-line'
      }`}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Index badge */}
          <div
            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              done ? 'bg-done text-bg' : 'bg-raised text-muted'
            }`}
          >
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text">{practice.name}</span>
              {done && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-done/15 text-done border border-done/30">
                  Complete
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted font-stat mt-0.5">
              {practice.count} / {practice.reps} reps · {pct}% · +{practice.xp} XP
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => removePractice(practice.id)}
            className="text-muted hover:text-missed p-1 rounded transition-colors"
            title="Remove practice"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted" />
          )}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-line px-5 py-5 space-y-6">
          {/* Media section */}
          {practice.media.length > 0 && (
            <div className="space-y-2">
              {practice.media.map((m, mIdx) => (
                <MediaViewer
                  key={mIdx}
                  media={m}
                  onRemove={() => removeMedia(practice.id, mIdx)}
                />
              ))}
            </div>
          )}

          {/* Inline add media */}
          {showAddMedia && (
            <div className="bg-bg border border-line rounded p-4 space-y-3">
              <div className="flex gap-2">
                {(['text', 'image', 'audio', 'video'] as MediaType[]).map((t) => {
                  const Icon = MEDIA_ICON[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setAddMediaType(t)}
                      className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-semibold capitalize transition-colors ${
                        addMediaType === t
                          ? 'bg-accent text-bg border-accent'
                          : 'border-line text-muted hover:border-text hover:text-text'
                      }`}
                    >
                      <Icon className="w-3 h-3" /> {t}
                    </button>
                  );
                })}
                <button onClick={() => setShowAddMedia(false)} className="ml-auto text-muted hover:text-text p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {addMediaType === 'text' ? (
                <div className="space-y-2">
                  <textarea
                    value={addTextInput}
                    onChange={(e) => setAddTextInput(e.target.value)}
                    placeholder="Enter text, mantra, instruction..."
                    rows={3}
                    className="w-full bg-raised border border-line rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-accent resize-none placeholder:text-muted/50"
                  />
                  <button
                    onClick={handleAddText}
                    disabled={!addTextInput.trim()}
                    className="px-3 py-1.5 text-xs font-bold bg-accent hover:bg-accent/90 text-bg rounded transition-colors disabled:opacity-40"
                  >
                    Add Text
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={addFileRef}
                    type="file"
                    accept={ACCEPT_MAP[addMediaType as Exclude<MediaType, 'text'>]}
                    onChange={handleAddFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => addFileRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-4 border-2 border-dashed border-line rounded hover:border-accent/50 hover:bg-accent/5 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-muted" />
                    <span className="text-xs text-muted">Upload {addMediaType} file</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Add media button */}
          {!showAddMedia && (
            <button
              onClick={() => setShowAddMedia(true)}
              className="flex items-center gap-1.5 text-[11px] text-muted hover:text-accent transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Attach media (text / image / audio / video)
            </button>
          )}

          {/* Counter ring */}
          <div className="flex flex-col items-center space-y-4 py-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#232833" strokeWidth="6" fill="transparent" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke={done ? '#3FB68B' : '#4C9AFF'}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (circumference * practice.count) / practice.reps}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-4xl font-extrabold font-stat text-text">{practice.count}</span>
                <span className="text-xs text-muted uppercase font-semibold tracking-wider mt-0.5">
                  of {practice.reps}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => increment(practice.id, 1)}
                disabled={done}
                className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-bg text-sm font-bold rounded transition-colors active:scale-95 shadow-lg shadow-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +1 Count
              </button>
              <button
                onClick={() => increment(practice.id, 10)}
                disabled={done}
                className="px-4 py-2.5 bg-raised hover:bg-line text-text text-sm font-mono font-semibold rounded border border-line transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +10
              </button>
              <button
                onClick={() => decrement(practice.id)}
                className="p-2.5 bg-raised hover:bg-line text-muted hover:text-text rounded border border-line transition-colors"
                title="Undo 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => reset(practice.id)}
                className="px-3 py-2.5 text-xs text-muted hover:text-missed transition-colors"
              >
                Reset
              </button>
            </div>

            {done && (
              <div className="flex items-center gap-2 text-xs font-semibold text-done bg-done/10 px-3 py-1.5 rounded border border-done/20">
                <Check className="w-4 h-4" />
                Practice Complete · +{practice.xp} XP
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   PracticeScreen (main)
   ══════════════════════════════════════════════════════════ */
export const PracticeScreen: React.FC = () => {
  const { practices } = usePracticeStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const totalDone = practices.filter((p) => p.count >= p.reps).length;
  const totalXp = practices.filter((p) => p.count >= p.reps).reduce((a, p) => a + p.xp, 0);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
            <Compass className="w-4 h-4 text-accent" />
            <span>Spiritual & Mental Discipline</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text mt-1">
            Practices & Repetition
          </h1>
          <p className="text-sm text-muted">
            {practices.length} practice{practices.length !== 1 ? 's' : ''} ·{' '}
            {totalDone} complete today · +{totalXp} XP earned
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-bg font-semibold text-xs py-2 px-3 rounded transition-colors"
        >
          <Plus className="w-4 h-4" /> New Practice
        </button>
      </div>

      {/* Practice cards */}
      {practices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Sparkles className="w-12 h-12 text-muted/30" />
          <div>
            <h3 className="text-sm font-bold text-text">No practices yet</h3>
            <p className="text-xs text-muted mt-1">
              Create your first practice — add a mantra, audio, image, or video to guide you.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-bg font-semibold text-xs py-2 px-3 rounded transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Practice
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl mx-auto">
          {practices.map((p, idx) => (
            <PracticeCard key={p.id} practice={p} index={idx} />
          ))}
        </div>
      )}

      <AddPracticeModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};


