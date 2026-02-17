/**
 * Rubik's Cube 3D — Main Page
 * ============================
 * Design: Neon Arcade — Cyberpunk Gaming Aesthetic
 *
 * Full-screen immersive experience with:
 * - Neon grid background with radial vignette
 * - HUD-style timer and move counter
 * - Glass panel controls
 * - Visual mini-cube icons for face rotation buttons
 * - Action buttons: Shuffle, Solve, Hint, Undo, Reset
 * - Move history sidebar
 * - Solved celebration overlay
 */

import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shuffle, RotateCcw, Lightbulb, Play, Undo2,
  Timer, Hash, Keyboard, Trophy,
} from 'lucide-react';
import CubeRenderer, { CubeRendererHandle } from '@/components/CubeRenderer';
import { MiniCubeIcon } from '@/components/MiniCubeIcon';
import { useCubeGame } from '@/hooks/useCubeGame';
import { Move } from '@/lib/cubeState';

type FaceId = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

interface FaceMoveConfig {
  face: FaceId;
  prime: boolean;
  move: Move;
  key: string;
  tooltip: string;
}

const FACE_MOVES: FaceMoveConfig[] = [
  { face: 'U', prime: false, move: 'U',  key: 'u', tooltip: 'Top CW' },
  { face: 'U', prime: true,  move: "U'", key: 'U', tooltip: 'Top CCW' },
  { face: 'D', prime: false, move: 'D',  key: 'd', tooltip: 'Bottom CW' },
  { face: 'D', prime: true,  move: "D'", key: 'D', tooltip: 'Bottom CCW' },
  { face: 'F', prime: false, move: 'F',  key: 'f', tooltip: 'Front CW' },
  { face: 'F', prime: true,  move: "F'", key: 'F', tooltip: 'Front CCW' },
  { face: 'B', prime: false, move: 'B',  key: 'b', tooltip: 'Back CW' },
  { face: 'B', prime: true,  move: "B'", key: 'B', tooltip: 'Back CCW' },
  { face: 'L', prime: false, move: 'L',  key: 'l', tooltip: 'Left CW' },
  { face: 'L', prime: true,  move: "L'", key: 'L', tooltip: 'Left CCW' },
  { face: 'R', prime: false, move: 'R',  key: 'r', tooltip: 'Right CW' },
  { face: 'R', prime: true,  move: "R'", key: 'R', tooltip: 'Right CCW' },
];

export default function Home() {
  const cubeRef = useRef<CubeRendererHandle>(null);
  const {
    cubeState, moveCount, timer, isSolved, isShuffling, isSolving,
    hintMove, highlightFace, moveHistory, rebuildKey,
    handleFaceRotation, shuffle, solve, showHint, reset, undoMove,
    formatTimer, setAnimateMove,
  } = useCubeGame();

  // Connect animation function
  useEffect(() => {
    if (cubeRef.current) {
      setAnimateMove(cubeRef.current.animateMove);
    }
  }, [setAnimateMove, rebuildKey]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isShuffling || isSolving) return;

      const moveMap: Record<string, Move> = {
        u: 'U', U: "U'", d: 'D', D: "D'",
        f: 'F', F: "F'", b: 'B', B: "B'",
        l: 'L', L: "L'", r: 'R', R: "R'",
      };

      if (moveMap[e.key]) {
        e.preventDefault();
        handleFaceRotation(moveMap[e.key]);
        return;
      }

      switch (e.key) {
        case ' ': e.preventDefault(); shuffle(); break;
        case 'z':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); undoMove(); }
          break;
        case 'h': e.preventDefault(); showHint(); break;
        case 's': if (!e.ctrlKey) { e.preventDefault(); solve(); } break;
        case 'Escape': e.preventDefault(); reset(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleFaceRotation, shuffle, solve, showHint, reset, undoMove, isShuffling, isSolving]);

  const onFace = useCallback((move: Move) => {
    if (isShuffling || isSolving) return;
    handleFaceRotation(move);
  }, [handleFaceRotation, isShuffling, isSolving]);

  const busy = isShuffling || isSolving;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#030308] select-none">
      {/* No CSS background layers — the WebGL canvas is opaque with its own background.
         This prevents any CSS bleed-through that was darkening cube faces. */}

      {/* ─── TOP HUD ─── */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-orbitron text-base sm:text-lg font-bold tracking-wider text-white leading-none">
            RUBIK'S <span className="text-cyan-400">CUBE</span>
          </h1>
          <p className="text-[9px] sm:text-[10px] font-mono text-cyan-400/30 tracking-[0.3em] uppercase mt-0.5">
            3D Interactive
          </p>
        </motion.div>

        {/* Stats HUD */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-2 sm:gap-3">
          <div className="glass-panel px-3 sm:px-4 py-2 sm:py-2.5 min-w-[90px] sm:min-w-[120px]">
            <div className="flex items-center gap-1.5">
              <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              <span className="font-mono text-sm sm:text-lg font-bold text-white tracking-wider">{formatTimer(timer)}</span>
            </div>
            <p className="text-[8px] sm:text-[9px] font-mono text-cyan-400/30 tracking-widest uppercase mt-0.5">Time</p>
          </div>
          <div className="glass-panel px-3 sm:px-4 py-2 sm:py-2.5 min-w-[70px] sm:min-w-[90px]">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-fuchsia-400" />
              <span className="font-mono text-sm sm:text-lg font-bold text-white tracking-wider">{moveCount.toString().padStart(3, '0')}</span>
            </div>
            <p className="text-[8px] sm:text-[9px] font-mono text-fuchsia-400/30 tracking-widest uppercase mt-0.5">Moves</p>
          </div>
        </motion.div>
      </header>

      {/* ─── 3D CANVAS ─── */}
      <div className="absolute inset-0 z-10">
        <CubeRenderer key={rebuildKey} ref={cubeRef} cubeState={cubeState} highlightFace={highlightFace} />
      </div>

      {/* ─── OVERLAYS ─── */}
      <AnimatePresence>
        {isSolved && moveCount > 0 && (
          <motion.div
            key="solved"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-amber-400 mx-auto mb-3 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
              </motion.div>
              <h2 className="font-orbitron text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,200,255,0.3)]">
                SOLVED!
              </h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="font-mono text-xs sm:text-sm text-white/40 mt-2"
              >
                {moveCount} moves &middot; {formatTimer(timer)}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hintMove && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="glass-panel px-6 py-3 border-cyan-400/20 text-center">
              <p className="text-[9px] font-mono text-cyan-400/40 uppercase tracking-wider">Next Move</p>
              <p className="font-orbitron text-2xl sm:text-3xl font-bold text-cyan-400 mt-1 drop-shadow-[0_0_15px_rgba(0,200,255,0.4)]">{hintMove}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {busy && (
          <motion.div
            key="status"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="glass-panel px-5 py-2.5 border-fuchsia-400/15">
              <p className="font-orbitron text-xs sm:text-sm font-bold text-fuchsia-400 animate-pulse tracking-wider">
                {isShuffling ? 'SHUFFLING...' : 'SOLVING...'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── BOTTOM CONTROLS ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-3 sm:pb-5 px-3 sm:px-6 lg:px-8">
        {/* Face rotation buttons — visual mini-cube icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex justify-center mb-2.5"
        >
          <div className="glass-panel px-2 sm:px-3 py-2 sm:py-2.5">
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
              {FACE_MOVES.map(({ face, prime, move, key, tooltip }) => (
                <button
                  key={`${face}-${prime}`}
                  onClick={() => onFace(move)}
                  disabled={busy}
                  className="face-icon-btn group relative"
                  title={`${tooltip} (${key})`}
                >
                  <MiniCubeIcon face={face} prime={prime} size={32} />
                  {/* Tooltip label on hover */}
                  <span className="face-icon-tooltip">
                    {tooltip}
                  </span>
                  {/* Keyboard shortcut badge */}
                  <span className="absolute -bottom-0.5 -right-0.5 text-[6px] sm:text-[7px] font-mono text-cyan-400/20 group-hover:text-cyan-400/50 transition-colors">
                    {key}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="flex justify-center gap-1.5 sm:gap-2 flex-wrap"
        >
          <ActionBtn onClick={shuffle} disabled={busy} icon={<Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Shuffle" shortcut="Space" accent="cyan" />
          <ActionBtn onClick={solve} disabled={busy || isSolved} icon={<Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Solve" shortcut="S" accent="fuchsia" />
          <ActionBtn onClick={showHint} disabled={busy || isSolved} icon={<Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Hint" shortcut="H" accent="amber" />
          <ActionBtn onClick={undoMove} disabled={moveHistory.length === 0 || busy} icon={<Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Undo" shortcut="⌘Z" accent="cyan" />
          <ActionBtn onClick={reset} disabled={busy} icon={<RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} label="Reset" shortcut="Esc" accent="red" />
        </motion.div>

        {/* Keyboard hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="hidden sm:flex justify-center mt-2.5"
        >
          <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-white/12">
            <Keyboard className="w-3 h-3" />
            Drag to orbit &middot; Hover icons for face labels
          </span>
        </motion.div>
      </div>

      {/* ─── MOVE HISTORY (desktop) ─── */}
      <AnimatePresence>
        {moveHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 hidden lg:block"
          >
            <div className="glass-panel px-3 py-3 max-h-[260px] overflow-y-auto scrollbar-thin w-[80px]">
              <p className="text-[8px] font-mono text-cyan-400/25 tracking-widest uppercase mb-2">History</p>
              <div className="flex flex-col gap-0.5">
                {moveHistory.slice(-20).map((m, i) => {
                  const num = Math.max(1, moveHistory.length - 19 + i);
                  return (
                    <span key={i} className="font-mono text-[9px] text-white/35 leading-tight">
                      <span className="text-white/15 inline-block w-4 text-right mr-1">{num}.</span>{m}
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DOMAIN WATERMARK ─── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 pointer-events-none"
      >
        <div className="font-mono text-[11px] sm:text-sm text-cyan-400/40 tracking-wider">
          <span className="drop-shadow-[0_0_12px_rgba(0,200,255,0.3)]">
            cube.sala.company
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Sub-components ─── */

function ActionBtn({ onClick, disabled, icon, label, shortcut, accent }: {
  onClick: () => void; disabled: boolean; icon: React.ReactNode; label: string; shortcut: string; accent: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: 'hover:border-cyan-400/30 hover:shadow-[0_0_15px_rgba(0,200,255,0.08)] text-cyan-400',
    fuchsia: 'hover:border-fuchsia-400/30 hover:shadow-[0_0_15px_rgba(255,0,170,0.08)] text-fuchsia-400',
    amber: 'hover:border-amber-400/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.08)] text-amber-400',
    red: 'hover:border-red-400/30 hover:shadow-[0_0_15px_rgba(248,113,113,0.08)] text-red-400',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`action-btn group ${accentMap[accent] || accentMap.cyan} disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:border-white/5 disabled:hover:shadow-none`}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        <span className="font-mono text-[10px] sm:text-xs font-medium">{label}</span>
      </span>
      <span className="hidden sm:block text-[8px] font-mono opacity-20 group-hover:opacity-40 transition-opacity ml-2">
        {shortcut}
      </span>
    </button>
  );
}
