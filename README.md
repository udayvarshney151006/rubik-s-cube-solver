# AetherCube - High-Performance Rubik's Cube Solver

A gorgeous, full-stack Rubik's Cube solver web application featuring a modern React frontend and a blazing fast C++ backend using Herbert Kociemba's optimal Two-Phase algorithm.

## Features

- **Optimal Solving:** Solves any valid Rubik's Cube scramble in 21 moves or fewer.
- **High Performance:** Core solving engine written in C++ for maximum efficiency.
- **Interactive 3D UI:** A fully interactive, animated 3D CSS Rubik's Cube simulator.
- **Webcam Scanning:** Automatically scan your physical cube using computer vision color detection.
- **Manual Input:** Interactive 2D paint net to manually configure your cube state.
- **Modern Aesthetics:** Premium Glassmorphism UI with smooth animations and dynamic lighting.
- **Audio/Visual Polish:** Custom synthesized Web Audio sound effects and celebratory confetti.

## Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS v3
- **Icons:** Lucide React
- **3D Engine:** Pure CSS 3D Transforms (`preserve-3d`)

### Backend
- **Server:** Node.js + Express
- **Solver Bridge:** `child_process.execFile`
- **Core Algorithm:** C++ (Ported Kociemba Two-Phase algorithm)
- **Build System:** CMake + Make

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- GCC/MinGW (for C++ compilation on Windows)
- Make and CMake

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd rubiks-solver
   ```

2. **Backend Setup:**
   Navigate to the backend directory, install dependencies, and build the C++ executable.
   ```bash
   cd backend
   npm install
   
   # Build the C++ solver executable (if not already compiled)
   mkdir bin
   gcc -O3 -I./kociemba_api ./kociemba_api/*.c -o ./bin/kociemba_solver.exe
   ```
   Start the backend Express API (runs on port 5000):
   ```bash
   npm start
   ```
   *Note: On the very first run, the C++ solver will generate prerequisite pruning cache tables in a `cache/` folder. This takes ~3-5 seconds. Subsequent runs will be nearly instantaneous.*

3. **Frontend Setup:**
   Open a new terminal, navigate to the frontend directory, and start the Vite dev server.
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The application will be available at `http://localhost:5173/` (or port 5174 if 5173 is in use).

## Usage

1. Select **Manual Paint Net** or **Webcam Scanner** to replicate your physical cube's state.
2. Click **SOLVE CUBE** to request the shortest solution from the C++ backend.
3. Use the timeline drawer below the 3D simulator to playback the solution step-by-step.

## License
MIT License
