/**
 * Rubik's Cube State Engine
 * ========================
 * Design: Neon Arcade — Cyberpunk Gaming Aesthetic
 * 
 * Manages the internal state of a 3x3 Rubik's Cube using a face-based representation.
 * Each face has 9 stickers indexed 0-8 (row-major, top-left to bottom-right when looking at the face).
 * 
 * Face layout when looking at the face:
 *   0 1 2
 *   3 4 5
 *   6 7 8
 * 
 * Faces: U (white/top), D (yellow/bottom), F (green/front), B (blue/back), L (orange/left), R (red/right)
 */

export type FaceName = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';
export type Color = 'W' | 'Y' | 'G' | 'B' | 'O' | 'R';
export type Move = 'U' | 'U\'' | 'U2' | 'D' | 'D\'' | 'D2' | 'F' | 'F\'' | 'F2' | 'B' | 'B\'' | 'B2' | 'L' | 'L\'' | 'L2' | 'R' | 'R\'' | 'R2';

export interface CubeState {
  U: Color[];
  D: Color[];
  F: Color[];
  B: Color[];
  L: Color[];
  R: Color[];
}

const FACE_COLOR_MAP: Record<FaceName, Color> = {
  U: 'W', D: 'Y', F: 'G', B: 'B', L: 'O', R: 'R'
};

export function createSolvedCube(): CubeState {
  return {
    U: Array(9).fill('W') as Color[],
    D: Array(9).fill('Y') as Color[],
    F: Array(9).fill('G') as Color[],
    B: Array(9).fill('B') as Color[],
    L: Array(9).fill('O') as Color[],
    R: Array(9).fill('R') as Color[],
  };
}

export function cloneCube(state: CubeState): CubeState {
  return {
    U: [...state.U],
    D: [...state.D],
    F: [...state.F],
    B: [...state.B],
    L: [...state.L],
    R: [...state.R],
  };
}

function rotateFaceCW(face: Color[]): Color[] {
  return [face[6], face[3], face[0], face[7], face[4], face[1], face[8], face[5], face[2]];
}

function rotateFaceCCW(face: Color[]): Color[] {
  return [face[2], face[5], face[8], face[1], face[4], face[7], face[0], face[3], face[6]];
}

function rotateFace180(face: Color[]): Color[] {
  return [face[8], face[7], face[6], face[5], face[4], face[3], face[2], face[1], face[0]];
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const s = cloneCube(state);
  
  switch (move) {
    case 'U': {
      s.U = rotateFaceCW(s.U);
      const temp = [s.F[0], s.F[1], s.F[2]];
      [s.F[0], s.F[1], s.F[2]] = [s.R[0], s.R[1], s.R[2]];
      [s.R[0], s.R[1], s.R[2]] = [s.B[0], s.B[1], s.B[2]];
      [s.B[0], s.B[1], s.B[2]] = [s.L[0], s.L[1], s.L[2]];
      [s.L[0], s.L[1], s.L[2]] = temp;
      break;
    }
    case 'U\'': {
      s.U = rotateFaceCCW(s.U);
      const temp = [s.F[0], s.F[1], s.F[2]];
      [s.F[0], s.F[1], s.F[2]] = [s.L[0], s.L[1], s.L[2]];
      [s.L[0], s.L[1], s.L[2]] = [s.B[0], s.B[1], s.B[2]];
      [s.B[0], s.B[1], s.B[2]] = [s.R[0], s.R[1], s.R[2]];
      [s.R[0], s.R[1], s.R[2]] = temp;
      break;
    }
    case 'U2': {
      s.U = rotateFace180(s.U);
      let temp = [s.F[0], s.F[1], s.F[2]];
      [s.F[0], s.F[1], s.F[2]] = [s.B[0], s.B[1], s.B[2]];
      [s.B[0], s.B[1], s.B[2]] = temp;
      temp = [s.L[0], s.L[1], s.L[2]];
      [s.L[0], s.L[1], s.L[2]] = [s.R[0], s.R[1], s.R[2]];
      [s.R[0], s.R[1], s.R[2]] = temp;
      break;
    }
    case 'D': {
      s.D = rotateFaceCW(s.D);
      const temp = [s.F[6], s.F[7], s.F[8]];
      [s.F[6], s.F[7], s.F[8]] = [s.L[6], s.L[7], s.L[8]];
      [s.L[6], s.L[7], s.L[8]] = [s.B[6], s.B[7], s.B[8]];
      [s.B[6], s.B[7], s.B[8]] = [s.R[6], s.R[7], s.R[8]];
      [s.R[6], s.R[7], s.R[8]] = temp;
      break;
    }
    case 'D\'': {
      s.D = rotateFaceCCW(s.D);
      const temp = [s.F[6], s.F[7], s.F[8]];
      [s.F[6], s.F[7], s.F[8]] = [s.R[6], s.R[7], s.R[8]];
      [s.R[6], s.R[7], s.R[8]] = [s.B[6], s.B[7], s.B[8]];
      [s.B[6], s.B[7], s.B[8]] = [s.L[6], s.L[7], s.L[8]];
      [s.L[6], s.L[7], s.L[8]] = temp;
      break;
    }
    case 'D2': {
      s.D = rotateFace180(s.D);
      let temp = [s.F[6], s.F[7], s.F[8]];
      [s.F[6], s.F[7], s.F[8]] = [s.B[6], s.B[7], s.B[8]];
      [s.B[6], s.B[7], s.B[8]] = temp;
      temp = [s.L[6], s.L[7], s.L[8]];
      [s.L[6], s.L[7], s.L[8]] = [s.R[6], s.R[7], s.R[8]];
      [s.R[6], s.R[7], s.R[8]] = temp;
      break;
    }
    case 'F': {
      s.F = rotateFaceCW(s.F);
      const temp = [s.U[6], s.U[7], s.U[8]];
      [s.U[6], s.U[7], s.U[8]] = [s.L[8], s.L[5], s.L[2]];
      [s.L[2], s.L[5], s.L[8]] = [s.D[0], s.D[1], s.D[2]];
      [s.D[0], s.D[1], s.D[2]] = [s.R[6], s.R[3], s.R[0]];
      [s.R[0], s.R[3], s.R[6]] = temp;
      break;
    }
    case 'F\'': {
      s.F = rotateFaceCCW(s.F);
      const temp = [s.U[6], s.U[7], s.U[8]];
      [s.U[6], s.U[7], s.U[8]] = [s.R[0], s.R[3], s.R[6]];
      [s.R[0], s.R[3], s.R[6]] = [s.D[2], s.D[1], s.D[0]];
      [s.D[0], s.D[1], s.D[2]] = [s.L[2], s.L[5], s.L[8]];
      [s.L[2], s.L[5], s.L[8]] = [temp[2], temp[1], temp[0]];
      break;
    }
    case 'F2': {
      return applyMove(applyMove(state, 'F'), 'F');
    }
    case 'B': {
      s.B = rotateFaceCW(s.B);
      const temp = [s.U[0], s.U[1], s.U[2]];
      [s.U[0], s.U[1], s.U[2]] = [s.R[2], s.R[5], s.R[8]];
      [s.R[2], s.R[5], s.R[8]] = [s.D[8], s.D[7], s.D[6]];
      [s.D[6], s.D[7], s.D[8]] = [s.L[0], s.L[3], s.L[6]];
      [s.L[0], s.L[3], s.L[6]] = [temp[2], temp[1], temp[0]];
      break;
    }
    case 'B\'': {
      s.B = rotateFaceCCW(s.B);
      const temp = [s.U[0], s.U[1], s.U[2]];
      [s.U[0], s.U[1], s.U[2]] = [s.L[6], s.L[3], s.L[0]];
      [s.L[0], s.L[3], s.L[6]] = [s.D[6], s.D[7], s.D[8]];
      [s.D[6], s.D[7], s.D[8]] = [s.R[8], s.R[5], s.R[2]];
      [s.R[2], s.R[5], s.R[8]] = temp;
      break;
    }
    case 'B2': {
      return applyMove(applyMove(state, 'B'), 'B');
    }
    case 'R': {
      s.R = rotateFaceCW(s.R);
      const temp = [s.U[2], s.U[5], s.U[8]];
      [s.U[2], s.U[5], s.U[8]] = [s.F[2], s.F[5], s.F[8]];
      [s.F[2], s.F[5], s.F[8]] = [s.D[2], s.D[5], s.D[8]];
      [s.D[2], s.D[5], s.D[8]] = [s.B[6], s.B[3], s.B[0]];
      [s.B[0], s.B[3], s.B[6]] = [temp[2], temp[1], temp[0]];
      break;
    }
    case 'R\'': {
      s.R = rotateFaceCCW(s.R);
      const temp = [s.U[2], s.U[5], s.U[8]];
      [s.U[2], s.U[5], s.U[8]] = [s.B[6], s.B[3], s.B[0]];
      [s.B[0], s.B[3], s.B[6]] = [s.D[8], s.D[5], s.D[2]];
      [s.D[2], s.D[5], s.D[8]] = [s.F[2], s.F[5], s.F[8]];
      [s.F[2], s.F[5], s.F[8]] = temp;
      break;
    }
    case 'R2': {
      return applyMove(applyMove(state, 'R'), 'R');
    }
    case 'L': {
      s.L = rotateFaceCW(s.L);
      const temp = [s.U[0], s.U[3], s.U[6]];
      [s.U[0], s.U[3], s.U[6]] = [s.B[8], s.B[5], s.B[2]];
      [s.B[2], s.B[5], s.B[8]] = [s.D[6], s.D[3], s.D[0]];
      [s.D[0], s.D[3], s.D[6]] = [s.F[0], s.F[3], s.F[6]];
      [s.F[0], s.F[3], s.F[6]] = temp;
      break;
    }
    case 'L\'': {
      s.L = rotateFaceCCW(s.L);
      const temp = [s.U[0], s.U[3], s.U[6]];
      [s.U[0], s.U[3], s.U[6]] = [s.F[0], s.F[3], s.F[6]];
      [s.F[0], s.F[3], s.F[6]] = [s.D[0], s.D[3], s.D[6]];
      [s.D[0], s.D[3], s.D[6]] = [s.B[8], s.B[5], s.B[2]];
      [s.B[2], s.B[5], s.B[8]] = [temp[2], temp[1], temp[0]];
      break;
    }
    case 'L2': {
      return applyMove(applyMove(state, 'L'), 'L');
    }
  }
  
  return s;
}

export function isSolved(state: CubeState): boolean {
  for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as FaceName[]) {
    const center = state[face][4];
    for (let i = 0; i < 9; i++) {
      if (state[face][i] !== center) return false;
    }
  }
  return true;
}

export function getInverseMove(move: Move): Move {
  if (move.endsWith('2')) return move;
  if (move.endsWith('\'')) return move[0] as Move;
  return (move + '\'') as Move;
}

export function parseMove(str: string): Move | null {
  const valid: Move[] = ['U', 'U\'', 'U2', 'D', 'D\'', 'D2', 'F', 'F\'', 'F2', 'B', 'B\'', 'B2', 'L', 'L\'', 'L2', 'R', 'R\'', 'R2'];
  return valid.includes(str as Move) ? str as Move : null;
}

const ALL_SINGLE_MOVES: Move[] = ['U', 'U\'', 'D', 'D\'', 'F', 'F\'', 'B', 'B\'', 'L', 'L\'', 'R', 'R\''];

export function generateScramble(length: number = 20): Move[] {
  const moves: Move[] = [];
  let lastFace = '';
  
  for (let i = 0; i < length; i++) {
    let available = ALL_SINGLE_MOVES.filter(m => m[0] !== lastFace);
    const move = available[Math.floor(Math.random() * available.length)];
    moves.push(move);
    lastFace = move[0];
  }
  
  return moves;
}

export function cubeToString(state: CubeState): string {
  // Convert to a string representation for the solver
  // Order: U R F D L B, each face read top-left to bottom-right
  const colorToFace: Record<string, string> = {};
  for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as FaceName[]) {
    colorToFace[state[face][4]] = face;
  }
  
  let result = '';
  for (const face of ['U', 'R', 'F', 'D', 'L', 'B'] as FaceName[]) {
    for (let i = 0; i < 9; i++) {
      result += colorToFace[state[face][i]] || '?';
    }
  }
  return result;
}
