import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Protocol, Step } from '../data/types';
import { StepAnimation } from '../animations/StepAnimation';
import { BreathRing } from '../components/BreathRing';
import { CloseIcon, GearIcon, KajuKatliIcon, Lotus, NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, SpeakerIcon } from '../components/Icons';
import { MarmaChip } from '../components/MarmaChip';
import { RepCounter } from '../components/RepCounter';
import { SettingsSheet } from '../components/SettingsSheet';
import { Sheet } from '../components/Sheet';
import { completeChime, preloadMusic, primeMusic, repChime, startAmbient, stepChime, stopAmbient, unlockAudio } from '../lib/audio';
import { keepAwake, vibrate } from '../lib/device';
import { useRepClock } from '../lib/repClock';
import { tempoFactor, useSettings } from '../lib/settings';
import { estimateSpeechSec, numberWord, speak, stopSpeech, unlockSpeech } from '../lib/speech';
import { addHistory, clearProgress, getProgress, getStats, saveProgress } from '../lib/storage';
import { buildSequence, formatClock, formatMin, GET_READY_SEC, itemDurationSec, patternPosition, protocolDurationSec, type SeqItem } from '../lib/timeline';

type Stage = 'start' | 'welcome' | 'getReady' | 'intro' | 'reps' | 'transition' | 'complete';
type Mode = 'guided' | 'learn';

interface Props {
  protocol: Protocol;
  mode: Mode;
  /** Learn mode: the step number from the URL. */
  stepNumber?: number;
}

export function Player({ protocol, mode, stepNumber }: Props) {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const seq = useMemo(() => buildSequence(protocol), [protocol]);
  const totalSteps = protocol.steps.length;
  const factor = tempoFactor(settings.tempo);

  const learnIndex = Math.max(0, seq.findIndex((i) => i.kind === 'step' && i.step.number === stepNumber));
  const [guidedIndex, setGuidedIndex] = useState(0);
  const index = mode === 'learn' ? learnIndex : guidedIndex;
  const item: SeqItem = seq[index];

  const [stage, setStage] = useState<Stage>(mode === 'learn' ? 'reps' : 'start');
  const [paused, setPaused] = useState(false);
  const [runId, setRunId] = useState(0);
  const [countdown, setCountdown] = useState(GET_READY_SEC);
  const [showSettings, setShowSettings] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  useEffect(() => preloadMusic(), []);
  const [showDetails, setShowDetails] = useState(false);
  const [resume] = useState(() => (mode === 'guided' ? getProgress(protocol.id) : null));
  const startedAt = useRef(Date.now());
  const savedHistory = useRef(false);

  // Keep latest settings in a ref for clock callbacks.
  const sRef = useRef(settings);
  sRef.current = settings;

  const step: Step | undefined = item?.kind === 'step' ? item.step : undefined;
  const reps = step ? step.reps : 1;
  const tempoSec = step ? step.tempoSec * factor : item?.kind === 'transition' ? item.transition.durationSec : 1;

  // ---------- Voice + subtitles ----------
  const [subtitle, setSubtitle] = useState('');
  const subTimer = useRef<number>();
  const say = useCallback((text: string, onEnd?: () => void, interrupt = true, split = true) => {
    const s = sRef.current;
    window.clearTimeout(subTimer.current);
    const clearLater = (ms: number) => {
      window.clearTimeout(subTimer.current);
      subTimer.current = window.setTimeout(() => setSubtitle(''), ms);
    };
    if (!s.voice) {
      // Voice off: subtitles still guide the user.
      setSubtitle(text);
      clearLater(Math.max(2200, estimateSpeechSec(text, 1) * 1000));
      onEnd?.();
      return;
    }
    speak(text, {
      rate: s.voiceRate,
      interrupt,
      split,
      onSentence: (line) => {
        window.clearTimeout(subTimer.current);
        setSubtitle(line);
      },
      onEnd: () => {
        clearLater(1400);
        onEnd?.();
      },
    });
  }, []);

  // ---------- The rep clock: one source of truth for animation, counter, voice, chime and haptics ----------
  const running = !paused && (stage === 'reps' || (mode === 'guided' && stage === 'transition'));
  const clock = useRepClock({
    reps,
    tempoSec,
    running,
    resetKey: `${index}-${runId}`,
    onRep: (rep) => {
      if (!step) return;
      const s = sRef.current;
      const pos = patternPosition(step.pattern, rep);
      const newGroup = !!pos && pos.inGroup === 1;
      if (s.chimes) repChime();
      if (s.haptics) vibrate(newGroup && rep > 1 ? [30, 60, 30] : 25);
      const parts: string[] = [];
      if (newGroup && pos && step.pattern) {
        const g = pos.group;
        if (g.announce !== undefined) {
          if (g.announce) parts.push(g.announce);
        } else {
          const name = g.name.replace(/\s*↔\s*/g, ' and ');
          const sameAsUnit = name.toLowerCase().startsWith(step.pattern.unit.toLowerCase());
          parts.push(`${step.pattern.unit} ${numberWord(pos.groupIndex + 1)}.${sameAsUnit ? '' : ` ${name}.`}`);
        }
      }
      const count = pos ? pos.inGroup : rep;
      const cues = pos?.group.cues ?? step.cues;
      if (step.breath === 'synced') {
        // Breath steps: only "Inhale" / "Exhale" — no counts, no rounds, so nothing overlaps.
        parts.push('Inhale.');
      } else {
        if (s.countAloud) parts.push(numberWord(count) + '.');
        if (cues) parts.push(cues[0] + '.');
      }
      if (parts.length) say(parts.join(' '), undefined, true, false);
    },
    onHalf: (rep) => {
      if (!step) return;
      const pos = patternPosition(step.pattern, rep);
      const cues = pos?.group.cues ?? step.cues;
      if (step.breath === 'synced') say('Exhale.', undefined, true, false);
      else if (cues) say(cues[1] + '.', undefined, true, false);
    },
    onDone: () => {
      if (mode === 'guided') window.setTimeout(() => advance(true), 900);
    },
  });

  // ---------- Navigation ----------
  const enterItem = useCallback(
    (i: number, auto: boolean) => {
      const next = seq[i];
      setPaused(false);
      setRunId((r) => r + 1);
      if (!next) {
        setStage('complete');
        return;
      }
      setGuidedIndex(i);
      if (next.kind === 'transition') setStage('transition');
      else setStage(auto ? 'getReady' : 'intro');
      if (!auto && sRef.current.chimes) stepChime();
    },
    [seq],
  );

  const advanceRef = useRef<(auto: boolean) => void>(() => {});
  advanceRef.current = (auto: boolean) => {
    if (mode === 'learn') return;
    enterItem(guidedIndex + 1, auto);
  };
  const advance = (auto: boolean) => advanceRef.current(auto);

  const goPrev = () => {
    stopSpeech();
    if (mode === 'learn') {
      if (step && step.number > 1) navigate(`/protocols/${protocol.slug}/step/${step.number - 1}`);
      return;
    }
    if (stage === 'complete') return enterItem(seq.length - 1, false);
    enterItem(Math.max(0, guidedIndex - 1), false);
  };
  const goNext = () => {
    stopSpeech();
    if (mode === 'learn') {
      if (step && step.number < totalSteps) navigate(`/protocols/${protocol.slug}/step/${step.number + 1}`);
      return;
    }
    if (stage === 'complete') return;
    enterItem(guidedIndex + 1, false);
  };
  const repeat = () => {
    stopSpeech();
    unlockAudio();
    setPaused(false);
    setRunId((r) => r + 1);
    if (mode === 'learn') setStage('reps');
    else if (item.kind === 'transition') setStage('transition');
    else setStage('intro');
  };
  const togglePause = () => {
    if (stage === 'start' || stage === 'complete') return;
    if (!paused) {
      stopSpeech();
      setPaused(true);
    } else {
      unlockAudio();
      setPaused(false);
    }
  };

  // Learn mode: restart when the URL step changes.
  useEffect(() => {
    if (mode !== 'learn') return;
    setStage('reps');
    setPaused(false);
    setRunId((r) => r + 1);
  }, [mode, stepNumber]);

  // ---------- Guided stage runner ----------
  useEffect(() => {
    if (mode !== 'guided' || paused) return;
    let cancelled = false;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => !cancelled && fn(), ms));

    if (stage === 'welcome') {
      let moved = false;
      const go = () => {
        if (moved || cancelled) return;
        moved = true;
        setStage('getReady');
      };
      say(protocol.intro.voiceScript, () => later(500, go));
      later((estimateSpeechSec(protocol.intro.voiceScript, settings.voiceRate) * 1.8 + 3) * 1000, go);
      if (!settings.voice) later(2500, go);
    }

    if (stage === 'getReady' && step) {
      if (settings.chimes) stepChime();
      setCountdown(GET_READY_SEC);
      let spoken = !settings.voice;
      let counted = false;
      const check = () => spoken && counted && !cancelled && setStage('intro');
      later(300, () =>
        say(`Next. Step ${numberWord(step.number)}. ${step.title}. Get ready.`, () => {
          spoken = true;
          check();
        }),
      );
      for (let k = 1; k <= GET_READY_SEC; k++)
        later(k * 1000, () => {
          setCountdown(GET_READY_SEC - k);
          if (k === GET_READY_SEC) {
            counted = true;
            check();
          }
        });
      later((GET_READY_SEC + 5) * 1000, () => {
        spoken = true;
        check();
      });
    }

    if (stage === 'intro' && step) {
      let moved = false;
      const go = () => {
        if (moved || cancelled) return;
        moved = true;
        setStage('reps');
      };
      if (settings.voice) {
        say(step.voiceScript, () => later(500, go));
        later((estimateSpeechSec(step.voiceScript, settings.voiceRate) * 1.8 + 4) * 1000, go);
      } else {
        later(3000, go);
      }
    }

    if (stage === 'transition' && item.kind === 'transition') {
      if (settings.chimes) stepChime();
      say(item.transition.voiceScript);
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stage, index, paused, runId]);

  // Completion
  useEffect(() => {
    if (stage !== 'complete' || mode !== 'guided') return;
    if (settings.chimes) completeChime();
    window.setTimeout(() => say(protocol.completion.voiceScript), 1200);
    if (!savedHistory.current) {
      savedHistory.current = true;
      addHistory({ protocolId: protocol.id, completedAt: Date.now(), durationSec: Math.round((Date.now() - startedAt.current) / 1000) });
      clearProgress(protocol.id);
    }
    keepAwake(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Save progress so a refresh resumes from the same step.
  useEffect(() => {
    if (mode === 'guided' && stage !== 'start' && stage !== 'complete') saveProgress({ protocolId: protocol.id, itemIndex: guidedIndex });
  }, [mode, stage, guidedIndex, protocol.id]);

  // Calm background tone while a guided session is playing.
  const ambientOn = mode === 'guided' && settings.ambient && !paused && stage !== 'start' && stage !== 'complete';
  useEffect(() => {
    if (ambientOn) startAmbient();
    else stopAmbient();
  }, [ambientOn]);

  // Cleanup on leave
  useEffect(
    () => () => {
      stopSpeech();
      stopAmbient();
      keepAwake(false);
      window.clearTimeout(subTimer.current);
    },
    [],
  );

  const begin = (fromIndex: number) => {
    unlockAudio();
    primeMusic();
    unlockSpeech(settings.voiceRate);
    keepAwake(true);
    startedAt.current = Date.now();
    savedHistory.current = false;
    setGuidedIndex(fromIndex);
    setRunId((r) => r + 1);
    setPaused(false);
    const it = seq[fromIndex];
    if (fromIndex === 0) setStage('welcome');
    else setStage(it.kind === 'transition' ? 'transition' : 'getReady');
  };

  // ---------- Gestures: tap anywhere to pause, swipe to change steps ----------
  const g = useRef<{ x: number; y: number; ok: boolean } | null>(null);
  const onPointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    g.current = { x: e.clientX, y: e.clientY, ok: !target.closest('button, a, input, [data-nogesture]') };
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = g.current;
    g.current = null;
    if (!s?.ok || stage === 'start') return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) goNext();
      else goPrev();
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) togglePause();
  };

  // ---------- Derived display ----------
  const nextEyesClosed = seq.slice(index).find((i): i is Extract<SeqItem, { kind: 'step' }> => i.kind === 'step')?.step.eyes === 'closed';
  const dim = mode === 'guided' && stage !== 'start' && stage !== 'complete' && (step ? step.eyes === 'closed' : nextEyesClosed);
  const stepNo = step ? step.number : seq.slice(0, index).filter((i) => i.kind === 'step').length;
  const repShown = stage === 'reps' || (mode === 'learn' && clock.rep > 0) ? clock.rep : 0;
  const pos = step ? patternPosition(step.pattern, Math.max(1, repShown)) : null;

  const remainingSec = useMemo(() => {
    if (mode !== 'guided') return 0;
    if (stage === 'complete') return 0;
    const rest = seq.slice(index + 1).reduce((s, i) => s + itemDurationSec(i, factor, settings.voiceRate), 0);
    if (stage === 'start') return protocolDurationSec(protocol, factor, settings.voiceRate);
    if (!step) return rest + (item.kind === 'transition' ? item.transition.durationSec : 0);
    const repsLeft = step.reps - Math.max(0, repShown - 1);
    const pre = stage === 'reps' ? 0 : estimateSpeechSec(step.voiceScript, settings.voiceRate) + (stage === 'getReady' ? GET_READY_SEC : 0);
    return rest + pre + repsLeft * step.tempoSec * factor;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stage, index, repShown, factor, settings.voiceRate]);

  const nextStepItem = seq.slice(index + 1).find((i) => i.kind === 'step') as Extract<SeqItem, { kind: 'step' }> | undefined;

  // ---------- Start screen ----------
  if (mode === 'guided' && stage === 'start') {
    return (
      <StartScreen
        protocol={protocol}
        durationSec={protocolDurationSec(protocol, factor, settings.voiceRate)}
        resume={resume && resume.itemIndex > 0 && resume.itemIndex < seq.length ? resume.itemIndex : null}
        resumeLabel={resume ? labelFor(seq, resume.itemIndex) : ''}
        onStart={begin}
        onSettings={() => setShowSettings(true)}
        settingsOpen={showSettings}
        closeSettings={() => setShowSettings(false)}
      />
    );
  }

  if (mode === 'guided' && stage === 'complete') {
    const stats = getStats(protocol.id);
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-night-950 to-teal-950 px-6 text-center text-sand-100">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4 }}>
          <Lotus size={96} className="text-saffron-300" />
        </motion.div>
        <h1 className="mt-6 text-4xl font-semibold">Session complete</h1>
        <p className="mt-4 max-w-sm font-serif text-2xl italic leading-snug opacity-90">{protocol.completion.text}</p>
        <p className="mt-6 text-sm opacity-70">
          {stats.streak > 0 && <>🔥 {stats.streak}-day streak · </>}
          {stats.total} session{stats.total === 1 ? '' : 's'} completed
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={`/protocols/${protocol.slug}`} className="btn bg-saffron-400 text-night-950">
            Done
          </Link>
          <button className="btn border border-white/20" onClick={() => begin(0)}>
            Practise again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 flex select-none flex-col overflow-hidden transition-colors duration-[3000ms] ${dim ? 'dimmed dark bg-[#05080b] text-teal-200/80' : 'bg-[var(--stage)]'}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Top bar */}
      <header className="flex items-center gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]" data-nogesture>
        <Link to={`/protocols/${protocol.slug}`} className="icon-btn" aria-label="Exit session">
          <CloseIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between text-xs font-semibold opacity-80">
            <span>
              {mode === 'learn' ? 'Practice · ' : ''}Step {Math.max(1, stepNo)} of {totalSteps}
            </span>
            {mode === 'guided' && <span>{formatClock(remainingSec)} left</span>}
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-teal-900/10 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-saffron-500"
              animate={{ width: `${((mode === 'learn' ? stepNo : index + (stage === 'reps' ? repShown / reps : 0)) / (mode === 'learn' ? totalSteps : seq.length)) * 100}%` }}
            />
          </div>
        </div>
        <button className="icon-btn" aria-label={settings.ambient ? 'Turn background music off' : 'Turn background music on'} aria-pressed={settings.ambient} onClick={() => {
            if (!settings.ambient) primeMusic();
            update({ ambient: !settings.ambient });
          }}>
          <MusicIcon off={!settings.ambient} />
        </button>
        <button className="icon-btn" aria-label="Settings" onClick={() => setShowSettings(true)}>
          <GearIcon width={22} height={22} />
        </button>
      </header>

      {/* Animation stage */}
      <div className="relative min-h-0 flex-1 px-4 py-2">
        <motion.div
          key={item.kind === 'step' ? item.step.id : item.transition.id}
          className="mx-auto h-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: dim ? 0.55 : 1 }}
          transition={{ duration: 0.6 }}
        >
          <StepAnimation
            animationKey={step ? step.animationKey : item.kind === 'transition' ? item.transition.animationKey : 'closeEyes'}
            phase={clock.phase}
            reps={reps}
            step={step}
          />
        </motion.div>

        <AnimatePresence>
          {stage === 'getReady' && step && !paused && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--stage)]/80 text-center backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-70">Get ready</p>
              <motion.p key={countdown} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-serif text-8xl font-semibold">
                {Math.max(1, countdown)}
              </motion.p>
              <p className="mt-2 px-6 font-serif text-2xl">
                Step {step.number}: {step.title}
              </p>
            </motion.div>
          )}
          {item.kind === 'transition' && (
            <motion.p
              className="pointer-events-none absolute inset-x-0 bottom-6 px-6 text-center font-serif text-3xl italic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              {item.transition.text}
            </motion.p>
          )}
          {settings.subtitles && subtitle && !paused && stage !== 'getReady' && item.kind === 'step' && (
            <motion.div
              key="subtitle"
              className="pointer-events-none absolute inset-x-3 bottom-2 flex justify-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              aria-live="polite"
            >
              <p className={`max-w-md rounded-2xl px-4 py-2 text-center text-[1.05rem] font-medium leading-snug ${dim ? 'bg-black/70 text-teal-100/90' : 'bg-night-950/75 text-sand-50'}`}>
                {subtitle}
              </p>
            </motion.div>
          )}
          {paused && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--stage)]/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PlayIcon width={56} height={56} />
              <p className="mt-3 font-semibold">Paused · tap to resume</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      {step ? (
        <section className="px-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="flex items-center gap-2 text-[1.65rem] font-semibold leading-tight">
              {step.title}
              {step.titleIcon === 'kajuKatli' && <KajuKatliIcon />}
            </h1>
            <MarmaChip step={step} />
          </div>
          <p className="mt-1 text-[0.95rem] leading-snug opacity-85">
            {stage === 'intro' && mode === 'guided' ? 'Listen…' : step.shortInstruction}
            {mode === 'learn' && (
              <button className="ml-2 font-semibold text-teal-600 underline dark:text-saffron-300" onClick={() => setShowDetails(true)}>
                Full instruction
              </button>
            )}
            {mode === 'learn' && step.demoVideo && (
              <button className="ml-2 font-semibold text-teal-600 underline dark:text-saffron-300" onClick={() => setShowDemo(true)}>
                Watch real demo
              </button>
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs font-semibold uppercase tracking-wider opacity-60">
            <span>{step.posture === 'lying' ? 'Lying down' : 'Sitting'}</span>
            <span>Eyes {step.eyes}</span>
            {step.bothSides && <span>Both sides together</span>}
          </div>
        </section>
      ) : (
        <section className="px-5 text-center text-sm opacity-70">{nextStepItem ? `Next: Step ${nextStepItem.step.number} · ${nextStepItem.step.title}` : ''}</section>
      )}

      {/* Counter row */}
      {step && (
        <div className="flex items-center justify-center gap-5 px-5 py-2">
          <RepCounter rep={pos && repShown ? pos.inGroup : repShown} reps={pos ? pos.group.count : step.reps} size={dim ? 150 : 104} sub={pos ? `of ${pos.group.count}` : undefined} />
          <div className="min-w-0 flex-1 space-y-2">
            {pos && (
              <p className="text-sm font-semibold leading-snug" aria-live="polite">
                {step.pattern!.unit} {pos.groupIndex + 1} of {pos.groupCount} · {repShown ? pos.inGroup : 0}/{pos.group.count}
                <br />
                <span className="opacity-70">
                  {step.pointCycle && repShown ? step.pointCycle[(repShown - 1) % step.pointCycle.length].split(',')[0] : pos.group.name} · Total {repShown}/{step.reps}
                </span>
              </p>
            )}
            {step.breath === 'synced' && <BreathRing phase={clock.phase} reps={reps} size={dim ? 70 : 64} />}
            {dim && !pos && step.breath !== 'synced' && <p className="text-sm opacity-60">Eyes closed · follow the voice and chimes</p>}
            {mode === 'learn' && clock.done && (
              <button className="btn-ghost min-h-10 px-4 text-sm" onClick={repeat}>
                <RepeatIcon width={18} height={18} /> Replay
              </button>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <nav className="flex items-center justify-around px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1" data-nogesture aria-label="Session controls">
        <button className="icon-btn h-14 w-14" onClick={goPrev} aria-label="Previous step" disabled={mode === 'learn' && stepNo <= 1}>
          <PrevIcon />
        </button>
        <button className="icon-btn h-14 w-14" onClick={repeat} aria-label="Repeat step">
          <RepeatIcon />
        </button>
        <button
          className="inline-flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-teal-900 text-sand-50 shadow-xl active:scale-95 dark:bg-saffron-400 dark:text-night-950"
          onClick={togglePause}
          aria-label={paused ? 'Play' : 'Pause'}
        >
          {paused ? <PlayIcon width={30} height={30} /> : <PauseIcon width={30} height={30} />}
        </button>
        {mode === 'learn' ? (
          <button className="icon-btn h-14 w-14" onClick={() => step && say(step.voiceScript)} aria-label="Read aloud">
            <SpeakerIcon />
          </button>
        ) : (
          <span className="h-14 w-14" />
        )}
        <button className="icon-btn h-14 w-14" onClick={goNext} aria-label="Next step" disabled={mode === 'learn' && stepNo >= totalSteps}>
          <NextIcon />
        </button>
      </nav>

      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)} />
      {step?.demoVideo && (
        <Sheet open={showDemo} onClose={() => setShowDemo(false)} title={`Step ${step.number}: ${step.title} · real demo`}>
          {showDemo && (
<DemoVideo src={step.demoVideo} />
          )}
          <p className="mt-3 text-sm opacity-70">Clasp, open the palm, then the thumb finds the point and presses gently.</p>
        </Sheet>
      )}
      {step && (
        <Sheet open={showDetails} onClose={() => setShowDetails(false)} title={`Step ${step.number}: ${step.title}`}>
          <p className="text-lg leading-relaxed">{step.instruction}</p>
          {step.marma && (
            <p className="mt-4 rounded-2xl bg-saffron-400/10 p-4">
              <b>{step.marma.name}</b>: {step.marma.location} {step.marma.note}
            </p>
          )}
          <p className="mt-4 text-sm opacity-70">
            {step.reps} reps · {step.breath === 'synced' ? 'with the breath' : 'normal breath'} · {step.posture === 'lying' ? 'lying down' : 'sitting'} · eyes {step.eyes}
          </p>
        </Sheet>
      )}
    </div>
  );
}

function labelFor(seq: SeqItem[], i: number) {
  const it = seq[i];
  if (!it) return '';
  return it.kind === 'step' ? `Step ${it.step.number}: ${it.step.title}` : it.transition.text;
}

function StartScreen({
  protocol,
  durationSec,
  resume,
  resumeLabel,
  onStart,
  onSettings,
  settingsOpen,
  closeSettings,
}: {
  protocol: Protocol;
  durationSec: number;
  resume: number | null;
  resumeLabel: string;
  onStart: (i: number) => void;
  onSettings: () => void;
  settingsOpen: boolean;
  closeSettings: () => void;
}) {
  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sand-100 to-sand-200 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] dark:from-night-950 dark:to-teal-950">
      <div className="flex justify-between">
        <Link to={`/protocols/${protocol.slug}`} className="icon-btn -ml-2" aria-label="Back">
          <CloseIcon />
        </Link>
        <div className="-mr-2 flex">
          <MusicToggle />
          <button className="icon-btn" onClick={onSettings} aria-label="Settings">
            <GearIcon />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Lotus size={72} className="text-teal-800 dark:text-saffron-300" />
        <h1 className="mt-4 text-4xl font-semibold">{protocol.title}</h1>
        <p className="mt-2 opacity-75">
          Guided session · {protocol.steps.length} steps · about {formatMin(durationSec)}
        </p>
        <ul className="mt-6 max-w-sm space-y-2 text-left text-sm opacity-85">
          <li>🔊 Turn your volume up. From step 6 your eyes are closed and the voice leads.</li>
          <li>👓 Remove glasses and contact lenses.</li>
          <li>🛏️ Have a mat or bed ready to lie down from step 4.</li>
        </ul>
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        {resume !== null && (
          <button className="btn-primary w-full" onClick={() => onStart(resume)}>
            <PlayIcon width={20} height={20} /> Resume · {resumeLabel}
          </button>
        )}
        <button className={`${resume !== null ? 'btn-ghost' : 'btn-primary'} w-full text-lg`} onClick={() => onStart(0)}>
          {resume === null && <PlayIcon width={20} height={20} />} {resume !== null ? 'Start over' : 'Start'}
        </button>
      </div>
      <SettingsSheet open={settingsOpen} onClose={closeSettings} />
    </div>
  );
}

function MusicIcon({ off }: { off?: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l11-2v13" />
      <circle cx={6} cy={18} r={3} />
      <circle cx={17} cy={16} r={3} />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

function MusicToggle() {
  const { settings, update } = useSettings();
  return (
    <button className="icon-btn" aria-label={settings.ambient ? 'Turn background music off' : 'Turn background music on'} aria-pressed={settings.ambient} onClick={() => {
            if (!settings.ambient) primeMusic();
            update({ ambient: !settings.ambient });
          }}>
      <MusicIcon off={!settings.ambient} />
    </button>
  );
}

/** Plays a short clip from memory (works offline on Safari, which needs byte ranges for streamed media). */
function DemoVideo({ src }: { src: string }) {
  const url = import.meta.env.BASE_URL + src;
  const [blob, setBlob] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => setBlob((u = URL.createObjectURL(b))))
      .catch(() => setBlob(url));
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [url]);
  return (
    <video
      src={blob ?? undefined}
      poster={url.replace(/\.mp4$/, '.jpg')}
      className="mx-auto max-h-[60vh] rounded-2xl"
      autoPlay
      muted
      loop
      playsInline
      controls
    />
  );
}
