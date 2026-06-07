// Rubik's Cube state utility
// Handles state representation, face turns, scrambles, and conversions.

// Default solved state
export const DEFAULT_SOLVED_STRING = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

export const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];

export const DISPLAY_COLORS = {
  U: '#ffffff', // White
  R: '#ef4444', // Red
  F: '#22c55e', // Green
  D: '#eab308', // Yellow
  L: '#f97316', // Orange
  B: '#3b82f6', // Blue
};

export const COLOR_NAMES = {
  U: 'White',
  R: 'Red',
  F: 'Green',
  D: 'Yellow',
  L: 'Orange',
  B: 'Blue'
};

// Initialize a solved state object
export function getSolvedState() {
  return {
    U: Array(9).fill('U'),
    R: Array(9).fill('R'),
    F: Array(9).fill('F'),
    D: Array(9).fill('D'),
    L: Array(9).fill('L'),
    B: Array(9).fill('B')
  };
}

// Convert a 54-character string to a state object
export function stringToState(str) {
  if (!str || str.length !== 54) return getSolvedState();
  return {
    U: str.slice(0, 9).split(''),
    R: str.slice(9, 18).split(''),
    F: str.slice(18, 27).split(''),
    D: str.slice(27, 36).split(''),
    L: str.slice(36, 45).split(''),
    B: str.slice(45, 54).split('')
  };
}

// Convert a state object to a 54-character string
export function stateToString(state) {
  return (
    state.U.join('') +
    state.R.join('') +
    state.F.join('') +
    state.D.join('') +
    state.L.join('') +
    state.B.join('')
  );
}

// Rotate a 3x3 face clockwise
function rotateFaceCW(face) {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2]
  ];
}

// Rotate a 3x3 face counter-clockwise
function rotateFaceCCW(face) {
  return [
    face[2], face[5], face[8],
    face[1], face[4], face[7],
    face[0], face[3], face[6]
  ];
}

// Apply a single basic face turn (U, D, R, L, F, B) to the cube state
export function applyMove(state, move) {
  // Deep clone the state to ensure immutability
  const next = {
    U: [...state.U],
    R: [...state.R],
    F: [...state.F],
    D: [...state.D],
    L: [...state.L],
    B: [...state.B]
  };

  const baseMove = move[0]; // U, D, R, L, F, or B
  const modifier = move.substring(1); // '', "'", or '2'

  const isDouble = modifier === '2';
  const isCCW = modifier === "'";

  // Run the move once or twice
  const repeatCount = isDouble ? 2 : 1;

  for (let step = 0; step < repeatCount; step++) {
    const current = {
      U: [...next.U],
      R: [...next.R],
      F: [...next.F],
      D: [...next.D],
      L: [...next.L],
      B: [...next.B]
    };

    if (baseMove === 'U') {
      if (!isCCW) {
        next.U = rotateFaceCW(current.U);
        next.L[0] = current.F[0]; next.L[1] = current.F[1]; next.L[2] = current.F[2];
        next.B[0] = current.L[0]; next.B[1] = current.L[1]; next.B[2] = current.L[2];
        next.R[0] = current.B[0]; next.R[1] = current.B[1]; next.R[2] = current.B[2];
        next.F[0] = current.R[0]; next.F[1] = current.R[1]; next.F[2] = current.R[2];
      } else {
        next.U = rotateFaceCCW(current.U);
        next.F[0] = current.L[0]; next.F[1] = current.L[1]; next.F[2] = current.L[2];
        next.R[0] = current.F[0]; next.R[1] = current.F[1]; next.R[2] = current.F[2];
        next.B[0] = current.R[0]; next.B[1] = current.R[1]; next.B[2] = current.R[2];
        next.L[0] = current.B[0]; next.L[1] = current.B[1]; next.L[2] = current.B[2];
      }
    }

    else if (baseMove === 'D') {
      if (!isCCW) {
        next.D = rotateFaceCW(current.D);
        next.F[6] = current.L[6]; next.F[7] = current.L[7]; next.F[8] = current.L[8];
        next.R[6] = current.F[6]; next.R[7] = current.F[7]; next.R[8] = current.F[8];
        next.B[6] = current.R[6]; next.B[7] = current.R[7]; next.B[8] = current.R[8];
        next.L[6] = current.B[6]; next.L[7] = current.B[7]; next.L[8] = current.B[8];
      } else {
        next.D = rotateFaceCCW(current.D);
        next.L[6] = current.F[6]; next.L[7] = current.F[7]; next.L[8] = current.F[8];
        next.B[6] = current.L[6]; next.B[7] = current.L[7]; next.B[8] = current.L[8];
        next.R[6] = current.B[6]; next.R[7] = current.B[7]; next.R[8] = current.B[8];
        next.F[6] = current.R[6]; next.F[7] = current.R[7]; next.F[8] = current.R[8];
      }
    }

    else if (baseMove === 'R') {
      if (!isCCW) {
        next.R = rotateFaceCW(current.R);
        next.U[2] = current.F[2]; next.U[5] = current.F[5]; next.U[8] = current.F[8];
        next.B[6] = current.U[2]; next.B[3] = current.U[5]; next.B[0] = current.U[8];
        next.D[2] = current.B[6]; next.D[5] = current.B[3]; next.D[8] = current.B[0];
        next.F[2] = current.D[2]; next.F[5] = current.D[5]; next.F[8] = current.D[8];
      } else {
        next.R = rotateFaceCCW(current.R);
        next.F[2] = current.U[2]; next.F[5] = current.U[5]; next.F[8] = current.U[8];
        next.D[2] = current.F[2]; next.D[5] = current.F[5]; next.D[8] = current.F[8];
        next.B[6] = current.D[2]; next.B[3] = current.D[5]; next.B[0] = current.D[8];
        next.U[2] = current.B[6]; next.U[5] = current.B[3]; next.U[8] = current.B[0];
      }
    }

    else if (baseMove === 'L') {
      if (!isCCW) {
        next.L = rotateFaceCW(current.L);
        next.U[0] = current.B[8]; next.U[3] = current.B[5]; next.U[6] = current.B[2];
        next.F[0] = current.U[0]; next.F[3] = current.U[3]; next.F[6] = current.U[6];
        next.D[0] = current.F[0]; next.D[3] = current.F[3]; next.D[6] = current.F[6];
        next.B[8] = current.D[0]; next.B[5] = current.D[3]; next.B[2] = current.D[6];
      } else {
        next.L = rotateFaceCCW(current.L);
        next.B[8] = current.U[0]; next.B[5] = current.U[3]; next.B[2] = current.U[6];
        next.D[0] = current.B[8]; next.D[3] = current.B[5]; next.D[6] = current.B[2];
        next.F[0] = current.D[0]; next.F[3] = current.D[3]; next.F[6] = current.D[6];
        next.U[0] = current.F[0]; next.U[3] = current.F[3]; next.U[6] = current.F[6];
      }
    }

    else if (baseMove === 'F') {
      if (!isCCW) {
        next.F = rotateFaceCW(current.F);
        next.U[6] = current.L[8]; next.U[7] = current.L[5]; next.U[8] = current.L[2];
        next.R[0] = current.U[6]; next.R[3] = current.U[7]; next.R[6] = current.U[8];
        next.D[2] = current.R[0]; next.D[1] = current.R[3]; next.D[0] = current.R[6];
        next.L[8] = current.D[2]; next.L[5] = current.D[1]; next.L[2] = current.D[0];
      } else {
        next.F = rotateFaceCCW(current.F);
        next.L[8] = current.U[6]; next.L[5] = current.U[7]; next.L[2] = current.U[8];
        next.D[2] = current.L[8]; next.D[1] = current.L[5]; next.D[0] = current.L[2];
        next.R[0] = current.D[2]; next.R[3] = current.D[1]; next.R[6] = current.D[0];
        next.U[6] = current.R[0]; next.U[7] = current.R[3]; next.U[8] = current.R[6];
      }
    }

    else if (baseMove === 'B') {
      if (!isCCW) {
        next.B = rotateFaceCW(current.B);
        next.U[0] = current.R[2]; next.U[1] = current.R[5]; next.U[2] = current.R[8];
        next.L[6] = current.U[0]; next.L[3] = current.U[1]; next.L[0] = current.U[2];
        next.D[8] = current.L[6]; next.D[7] = current.L[3]; next.D[6] = current.L[0];
        next.R[2] = current.D[8]; next.R[5] = current.D[7]; next.R[8] = current.D[6];
      } else {
        next.B = rotateFaceCCW(current.B);
        next.R[2] = current.U[0]; next.R[5] = current.U[1]; next.R[8] = current.U[2];
        next.D[8] = current.R[2]; next.D[7] = current.R[5]; next.D[6] = current.R[8];
        next.L[6] = current.D[8]; next.L[3] = current.D[7]; next.L[0] = current.D[6];
        next.U[0] = current.L[6]; next.U[1] = current.L[3]; next.U[2] = current.L[0];
      }
    }
  }

  return next;
}

// Apply a series of moves to a cube state
export function applyMoves(state, movesString) {
  const moves = movesString.split(' ').map(m => m.trim()).filter(Boolean);
  let next = { ...state };
  for (const move of moves) {
    next = applyMove(next, move);
  }
  return next;
}

// Generate a random scramble (e.g. 20-30 random moves)
export function generateScramble() {
  const moves = ['U', 'D', 'R', 'L', 'F', 'B'];
  const modifiers = ['', "'", '2'];
  const scramble = [];
  let lastMove = '';

  for (let i = 0; i < 25; i++) {
    let move = '';
    do {
      move = moves[Math.floor(Math.random() * moves.length)];
    } while (move === lastMove); // Avoid turning the same face twice in a row

    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    scramble.push(move + modifier);
    lastMove = move;
  }

  return scramble.join(' ');
}
