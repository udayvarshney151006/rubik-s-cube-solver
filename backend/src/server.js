const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');
const { validateCubeState } = require('./utils/cubeValidator');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Path to compiled C++ solver binary
const SOLVER_PATH = path.join(__dirname, '../bin/kociemba_solver.exe');
const SOLVED_STATE = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Rubik\'s Cube Solver Backend is running.' });
});

// Solve endpoint
app.post('/solve', (req, res) => {
  const { state } = req.body;

  // 1. Basic validation
  const validation = validateCubeState(state);
  if (!validation.isValid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  // 2. Check if cube is already solved
  if (state === SOLVED_STATE) {
    return res.json({
      success: true,
      solution: [],
      movesCount: 0,
      solveTimeMs: 0,
      message: 'Cube is already solved!'
    });
  }

  const startTime = process.hrtime();

  // 3. Spawn C++ solver child process
  // We specify a timeout of 10 seconds to prevent hanging
  execFile(SOLVER_PATH, [state], { timeout: 10000 }, (error, stdout, stderr) => {
    const diff = process.hrtime(startTime);
    const solveTimeMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6); // nanoseconds to milliseconds

    if (error) {
      // Check if timeout occurred
      if (error.killed) {
        return res.status(500).json({
          success: false,
          error: 'Solver execution timed out. The cube might be in an extremely complex or corrupt state.'
        });
      }
      
      console.error('Solver process error:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred while trying to solve the cube.'
      });
    }

    const output = stdout.trim();

    // 4. Handle unsolvable output
    if (output.includes('Unsolvable cube!')) {
      return res.status(422).json({
        success: false,
        error: 'The cube configuration is unsolvable. This usually happens when edges or corners have been twisted or flipped incorrectly during manual paint or webcam scan (e.g., incorrect parity).'
      });
    }

    // 5. Parse and clean solution moves
    // Moves are space-separated, ending with a trailing space
    const moves = output.split(' ').map(m => m.trim()).filter(Boolean);

    res.json({
      success: true,
      solution: moves,
      movesCount: moves.length,
      solveTimeMs: solveTimeMs
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`C++ Solver path configured: ${SOLVER_PATH}`);
});
