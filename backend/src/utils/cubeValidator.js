/**
 * Validates a Rubik's Cube state string.
 * @param {string} state - A 54-character string composed of U, R, F, D, L, B.
 * @returns {object} { isValid: boolean, error: string | null }
 */
function validateCubeState(state) {
  if (!state) {
    return { isValid: false, error: 'Cube state is required.' };
  }

  if (typeof state !== 'string') {
    return { isValid: false, error: 'Cube state must be a string.' };
  }

  // Length must be exactly 54
  if (state.length !== 54) {
    return { isValid: false, error: `Invalid cube state length: got ${state.length}, expected 54.` };
  }

  // Must only contain U, R, F, D, L, B
  const validChars = /^[URFDLB]+$/;
  if (!validChars.test(state)) {
    return { isValid: false, error: 'Cube state contains invalid characters. Only U, R, F, D, L, B are allowed.' };
  }

  // Count distribution of each facelet
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  for (let i = 0; i < state.length; i++) {
    counts[state[i]]++;
  }

  for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
    if (counts[face] !== 9) {
      return {
        isValid: false,
        error: `Invalid cube state: Face '${face}' has ${counts[face]} stickers, but must have exactly 9.`
      };
    }
  }

  // Verify center facelets are in their standard positions
  // U: 4, R: 13, F: 22, D: 31, L: 40, B: 49
  const centers = {
    4: 'U',
    13: 'R',
    22: 'F',
    31: 'D',
    40: 'L',
    49: 'B'
  };

  for (const [index, expected] of Object.entries(centers)) {
    const idx = parseInt(index, 10);
    if (state[idx] !== expected) {
      return {
        isValid: false,
        error: `Invalid center alignment: center of face ${expected} (index ${idx}) is '${state[idx]}', expected '${expected}'.`
      };
    }
  }

  return { isValid: true, error: null };
}

module.exports = { validateCubeState };
