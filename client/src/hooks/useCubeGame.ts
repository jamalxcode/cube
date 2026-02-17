/**
 * Rubik's Cube Game State Hook
 * =============================
 * Design: Neon Arcade — Cyberpunk Gaming Aesthetic
 * 
 * Key design: We animate the move FIRST on the 3D cubies, THEN update the
 * logical cube state. The CubeRenderer syncs colors in-place (no rebuild).
 * After multi-move sequences (shuffle/solve), we force a rebuild to ensure
 * perfect alignment.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  CubeState,
  Move,
  createSolvedCube,
  applyMove,
  isSolved,
  generateScramble,
  getInverseMove,
} from '@/lib/cubeState';
import { CubeSolver } from '@/lib/solver';

export function useCubeGame() {
  const [cubeState, setCubeState] = useState<CubeState>(createSolvedCube);
  const [moveCount, setMoveCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [cubeSolved, setCubeSolved] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [hintMove, setHintMove] = useState<Move | null>(null);
  const [highlightFace, setHighlightFace] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  // Increment this to force a full 3D rebuild
  const [rebuildKey, setRebuildKey] = useState(0);

  const solverRef = useRef(new CubeSolver());
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef(cubeState);
  const animateFnRef = useRef<((move: Move) => Promise<void>) | null>(null);
  const busyRef = useRef(false);

  useEffect(() => { stateRef.current = cubeState; }, [cubeState]);

  // Timer
  useEffect(() => {
    if (isTimerRunning) {
      const base = Date.now() - timer * 10;
      timerRef.current = window.setInterval(() => {
        setTimer(Math.floor((Date.now() - base) / 10));
      }, 10);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning]);

  const setAnimateMove = useCallback((fn: (move: Move) => Promise<void>) => {
    animateFnRef.current = fn;
  }, []);

  /** Force a full 3D rebuild by changing the key */
  const forceRebuild = useCallback((state: CubeState) => {
    setCubeState({ ...state }); // new reference
    setRebuildKey(k => k + 1);
  }, []);

  const executeMove = useCallback(async (move: Move, counted: boolean = true) => {
    if (busyRef.current) return;
    busyRef.current = true;

    if (animateFnRef.current) {
      await animateFnRef.current(move);
    }

    const newState = applyMove(stateRef.current, move);
    setCubeState(newState);
    stateRef.current = newState;
    setLastMove(move);

    if (counted) {
      setMoveCount(prev => prev + 1);
      setMoveHistory(prev => [...prev, move]);
      solverRef.current.recordMove(move);

      if (!isTimerRunning && !isSolved(newState)) {
        setIsTimerRunning(true);
      }
    }

    setHintMove(null);
    setHighlightFace(null);

    if (isSolved(newState)) {
      setCubeSolved(true);
      setIsTimerRunning(false);
    } else {
      setCubeSolved(false);
    }

    busyRef.current = false;
    return newState;
  }, [isTimerRunning]);

  const handleFaceRotation = useCallback((move: Move) => {
    if (isShuffling || isSolving || busyRef.current) return;
    executeMove(move);
  }, [executeMove, isShuffling, isSolving]);

  const shuffle = useCallback(async () => {
    if (isShuffling || isSolving || busyRef.current) return;
    setIsShuffling(true);
    busyRef.current = true;

    setIsTimerRunning(false);
    setTimer(0);
    setMoveCount(0);
    setMoveHistory([]);
    setHintMove(null);
    setHighlightFace(null);
    setCubeSolved(false);
    solverRef.current.clearHistory();

    const scramble = generateScramble(20);

    // Reset to solved first (force rebuild)
    const solved = createSolvedCube();
    forceRebuild(solved);
    stateRef.current = solved;

    // Wait for rebuild
    await new Promise(r => setTimeout(r, 100));

    // Animate each scramble move
    let current = solved;
    for (const move of scramble) {
      if (animateFnRef.current) {
        await animateFnRef.current(move);
      }
      current = applyMove(current, move);
      setCubeState(current);
      stateRef.current = current;
      solverRef.current.recordMove(move);
    }

    // Force rebuild to ensure perfect alignment after many rapid moves
    forceRebuild(current);
    stateRef.current = current;

    busyRef.current = false;
    setIsShuffling(false);
  }, [isShuffling, isSolving, forceRebuild]);

  const solve = useCallback(async () => {
    if (isSolving || isShuffling || cubeSolved || busyRef.current) return;
    setIsSolving(true);
    busyRef.current = true;
    setIsTimerRunning(false);

    const solution = solverRef.current.getSolution();
    if (solution.length === 0) {
      busyRef.current = false;
      setIsSolving(false);
      return;
    }

    let current = stateRef.current;
    for (const move of solution) {
      if (animateFnRef.current) {
        await animateFnRef.current(move);
      }
      current = applyMove(current, move);
      setCubeState(current);
      stateRef.current = current;
      await new Promise(r => setTimeout(r, 40));
    }

    // Force rebuild to solved state to ensure perfect alignment
    const solvedState = createSolvedCube();
    stateRef.current = solvedState;
    forceRebuild(solvedState);
    setCubeSolved(true);
    solverRef.current.clearHistory();
    setMoveHistory([]);

    busyRef.current = false;
    setIsSolving(false);
  }, [isSolving, isShuffling, cubeSolved, forceRebuild]);

  const showHint = useCallback(() => {
    if (cubeSolved || isShuffling || isSolving) return;
    const hint = solverRef.current.getNextHint();
    if (hint) {
      setHintMove(hint);
      setHighlightFace(hint[0]);
      setTimeout(() => { setHintMove(null); setHighlightFace(null); }, 3000);
    }
  }, [cubeSolved, isShuffling, isSolving]);

  const reset = useCallback(() => {
    if (busyRef.current) return;
    const solved = createSolvedCube();
    stateRef.current = solved;
    forceRebuild(solved);
    setMoveCount(0);
    setTimer(0);
    setIsTimerRunning(false);
    setCubeSolved(true);
    setIsShuffling(false);
    setIsSolving(false);
    setMoveHistory([]);
    setHintMove(null);
    setHighlightFace(null);
    setLastMove(null);
    solverRef.current.clearHistory();
  }, [forceRebuild]);

  const undoMove = useCallback(async () => {
    if (moveHistory.length === 0 || isShuffling || isSolving || busyRef.current) return;
    busyRef.current = true;

    const last = moveHistory[moveHistory.length - 1];
    const inv = getInverseMove(last);

    if (animateFnRef.current) {
      await animateFnRef.current(inv);
    }

    const newState = applyMove(stateRef.current, inv);
    setCubeState(newState);
    stateRef.current = newState;
    setMoveCount(prev => Math.max(0, prev - 1));
    setMoveHistory(prev => prev.slice(0, -1));

    const h = solverRef.current.getHistory();
    h.pop();
    solverRef.current.setHistory(h);

    if (isSolved(newState)) {
      setCubeSolved(true);
      setIsTimerRunning(false);
    }

    busyRef.current = false;
  }, [moveHistory, isShuffling, isSolving]);

  const formatTimer = useCallback((t: number) => {
    const total = Math.floor(t / 100);
    const m = Math.floor(total / 60);
    const s = total % 60;
    const cs = t % 100;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }, []);

  return {
    cubeState, moveCount, timer, isTimerRunning,
    isSolved: cubeSolved, isShuffling, isSolving,
    moveHistory, hintMove, highlightFace, lastMove, rebuildKey,
    handleFaceRotation, shuffle, solve, showHint,
    reset, undoMove, formatTimer, setAnimateMove, executeMove,
  };
}
