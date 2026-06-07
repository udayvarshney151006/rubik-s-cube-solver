import React, { useState, useEffect, useRef } from 'react';
import { getSolvedState, stateToString, stringToState, generateScramble, applyMove, applyMoves, COLOR_NAMES, DISPLAY_COLORS } from './utils/cubeState';
import RubiksCube from './components/RubiksCube';
import CubeConfigurator from './components/CubeConfigurator';
import VideoInput from './components/VideoInput';
import { Camera, Edit, HelpCircle, Volume2, VolumeX, Sparkles, RefreshCw, AlertTriangle, Zap, CheckCircle2, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Core cube states
  const [cubeState, setCubeState] = useState(getSolvedState());
  const [preSolvedState, setPreSolvedState] = useState(null); // Saved state before playback starts

  // UI state
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'webcam'
  const [activePaintColor, setActivePaintColor] = useState('U');
  const [showWebcamScanner, setShowWebcamScanner] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Solver states
  const [solution, setSolution] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [solveTimeMs, setSolveTimeMs] = useState(0);
  const [backendError, setBackendError] = useState(null);
  const [successToast, setSuccessToast] = useState(false);

  // Help Modal State
  const [showHelp, setShowHelp] = useState(false);

  // Web Audio Context reference for sound effects
  const audioCtxRef = useRef(null);

  // Initialize Audio Context on demand
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play a synthesized sound effect using Web Audio API
  const playSound = (type) => {
    if (!soundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;

      if (type === 'click') {
        // High pitch short pluck
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.06);
      } 
      else if (type === 'move') {
        // Satisfying low-mid woodblock click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.09);
      }
      else if (type === 'success') {
        // Ascending rapid chime arpeggio (C Major)
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
        notes.forEach((freq, idx) => {
          const oscNode = ctx.createOscillator();
          const gainN = ctx.createGain();
          oscNode.connect(gainN);
          gainN.connect(ctx.destination);
          
          oscNode.type = 'sine';
          oscNode.frequency.setValueAtTime(freq, now + idx * 0.06);
          gainN.gain.setValueAtTime(0, now);
          gainN.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.01);
          gainN.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
          
          oscNode.start(now + idx * 0.06);
          oscNode.stop(now + idx * 0.06 + 0.3);
        });
      }
      else if (type === 'error') {
        // Dissonant low buzzer sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.setValueAtTime(115, now + 0.1);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      }
    } catch (e) {
      console.warn('Audio Context failed to initialize:', e);
    }
  };

  // Trigger confetti fireworks
  const triggerConfetti = () => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Scramble the cube
  const handleScramble = () => {
    playSound('click');
    setBackendError(null);
    setSolution([]);
    setCurrentStep(0);
    setPreSolvedState(null);
    
    const scrambleMoves = generateScramble();
    const scrambledState = applyMoves(getSolvedState(), scrambleMoves);
    setCubeState(scrambledState);
  };

  // Reset cube to solved
  const handleResetCube = () => {
    playSound('click');
    setBackendError(null);
    setSolution([]);
    setCurrentStep(0);
    setPreSolvedState(null);
    setCubeState(getSolvedState());
  };

  // Apply a single move to state (called from RubiksCube.jsx animation callback)
  const applyMoveToState = (move) => {
    playSound('move');
    setCubeState((prev) => applyMove(prev, move));
  };

  // Execute solution solver from backend API
  const handleSolveCube = async () => {
    playSound('click');
    setIsSolving(true);
    setBackendError(null);
    setSolution([]);
    setCurrentStep(0);

    const stateStr = stateToString(cubeState);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: stateStr }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'An unexpected error occurred.');
      }

      // Save pre-solved state snapshot to allow rewinding playback
      setPreSolvedState({ ...cubeState });
      
      setSolution(data.solution);
      setSolveTimeMs(data.solveTimeMs);
      
      setIsSolving(false);

      if (data.solution.length === 0) {
        // Already solved!
        playSound('success');
        setSuccessToast(true);
        triggerConfetti();
        setTimeout(() => setSuccessToast(false), 4000);
      } else {
        playSound('success');
      }
    } catch (err) {
      console.error(err);
      playSound('error');
      setBackendError(err.message || 'Failed to connect to the backend server. Please verify it is running on port 5000.');
      setIsSolving(false);
    }
  };

  // Webcams scanner callbacks
  const handleScanComplete = (scannedCubeState) => {
    playSound('success');
    setCubeState(scannedCubeState);
    setShowWebcamScanner(false);
  };

  // Jump directly to a specific move step in the solution timeline
  const handleJumpToStep = (targetStep) => {
    if (!preSolvedState || solution.length === 0) return;
    playSound('click');

    // Start from the pre-solve state
    let nextState = { ...preSolvedState };
    
    // Apply moves up to the target step
    for (let i = 0; i < targetStep; i++) {
      nextState = applyMove(nextState, solution[i]);
    }

    setCubeState(nextState);
    setCurrentStep(targetStep);
  };

  // Get description for a move code
  const getMoveDescription = (move) => {
    if (!move) return '';
    const base = move[0];
    const modifier = move.substring(1);
    
    const faceNames = { U: 'Up (White)', D: 'Down (Yellow)', R: 'Right (Red)', L: 'Left (Orange)', F: 'Front (Green)', B: 'Back (Blue)' };
    const direction = modifier === "'" ? 'counter-clockwise' : modifier === '2' ? 'double (180°)' : 'clockwise';
    
    return `Rotate the ${faceNames[base]} face 90° ${direction}.`;
  };

  return (
    <div className="relative min-h-screen pb-12 overflow-hidden bg-slate-950 font-sans">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none animate-float-medium" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none animate-float-fast" />

      {/* HEADER SECTION */}
      <header className="w-full py-5 px-6 sm:px-12 flex justify-between items-center border-b border-slate-900 bg-slate-950/45 backdrop-blur z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-xl">🧩</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-blue-100 to-blue-400">
              AETHERCUBE
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold select-none">
              Optimal Two-Phase Solver
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition ${
              soundEnabled 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20' 
                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="How to use"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-12 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
        
        {/* Left Column: 3D Visualization Canvas (Spans 5 cols) */}
        <section className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full glass-panel rounded-3xl p-5 border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[440px]">
            
            {/* Glossy lighting overlay */}
            <div className="absolute top-0 left-0 w-full h-[60px] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold font-orbitron tracking-wider text-slate-400 uppercase select-none">
                3D Simulator
              </span>
              
              {solution.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Solved in {solveTimeMs}ms
                </div>
              )}
            </div>

            {/* Rubik's Cube 3D Component */}
            <RubiksCube
              state={cubeState}
              applyMoveToState={applyMoveToState}
              solution={solution}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isSolving={isSolving}
            />

            {/* Solve Details Overlay */}
            {solution.length > 0 && currentStep < solution.length && (
              <div className="mt-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Active Move Instruction
                </span>
                <span className="text-sm font-semibold text-blue-300 font-orbitron block">
                  Step {currentStep + 1}: {solution[currentStep]}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  {getMoveDescription(solution[currentStep])}
                </span>
              </div>
            )}
            
            {solution.length > 0 && currentStep === solution.length && (
              <div className="mt-3 bg-emerald-950/20 p-3 rounded-xl border border-emerald-950/40 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Cube solved successfully!
                </span>
              </div>
            )}

          </div>
        </section>

        {/* Right Column: Configuration & Controls (Spans 7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="w-full glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-2xl flex flex-col">
            
            {/* Tab Navigation header */}
            <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-900 mb-6">
              <button
                onClick={() => { playSound('click'); setActiveTab('manual'); }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                  activeTab === 'manual'
                    ? 'bg-slate-900 text-blue-400 border border-slate-800 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit className="w-4 h-4" />
                Manual Paint Net
              </button>
              
              <button
                onClick={() => { playSound('click'); setActiveTab('webcam'); }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                  activeTab === 'webcam'
                    ? 'bg-slate-900 text-blue-400 border border-slate-800 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                Webcam Scanner
              </button>
            </div>

            {/* TAB PANELS */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              
              {activeTab === 'manual' ? (
                <CubeConfigurator
                  state={cubeState}
                  onChange={(next) => { playSound('click'); setCubeState(next); setSolution([]); setCurrentStep(0); }}
                  activeColor={activePaintColor}
                  setActiveColor={setActivePaintColor}
                />
              ) : (
                <div className="flex flex-col items-center p-6 text-center max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4 animate-pulse">
                    <Camera className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-base font-bold font-orbitron mb-2">Webcam Camera Scanning</h4>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Capture each of the 6 faces sequentially using your webcam. The smart analyzer will run basic color classification. You can correct any errors afterwards.
                  </p>
                  <button
                    onClick={() => { playSound('click'); setShowWebcamScanner(true); }}
                    className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-600/15 flex items-center gap-2 transition"
                  >
                    Launch Webcam Scanner
                  </button>
                </div>
              )}

            </div>

            {/* Primary Action Buttons Footer */}
            <div className="mt-8 pt-6 border-t border-slate-900/60 grid grid-cols-3 gap-3">
              <button
                onClick={handleScramble}
                disabled={isSolving}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 transition flex items-center justify-center gap-1.5 shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scramble
              </button>
              
              <button
                onClick={handleResetCube}
                disabled={isSolving}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 transition flex items-center justify-center gap-1.5 shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset solved
              </button>

              <button
                onClick={handleSolveCube}
                disabled={isSolving}
                className="py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none rounded-2xl text-xs font-black text-slate-950 tracking-wider transition shadow-lg shadow-blue-500/15 flex items-center justify-center gap-1.5"
              >
                {isSolving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    SOLVING...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current text-slate-950" />
                    SOLVE CUBE
                  </>
                )}
              </button>
            </div>

            {/* API Errors Card */}
            {backendError && (
              <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-300">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-bold uppercase tracking-wider">Solving Failed</span>
                  <span className="leading-relaxed">{backendError}</span>
                </div>
              </div>
            )}

          </div>

        </section>

      </main>

      {/* SOLUTION TIMELINE (BOTTOM DRAWER) */}
      {solution.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-12 mt-8 z-10 relative animate-fade-in">
          <div className="w-full glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col gap-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-base font-bold font-orbitron tracking-wider text-blue-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Solution Sequence
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                  Click any move block to jump to that step position in 3D rotation
                </p>
              </div>

              <div className="flex gap-4 text-xs font-bold font-orbitron">
                <span className="text-slate-400">
                  MOVES: <span className="text-blue-400">{solution.length}</span>
                </span>
                <span className="text-slate-400">
                  TIME: <span className="text-blue-400">{solveTimeMs}ms</span>
                </span>
              </div>
            </div>

            {/* Steps Timeline Track */}
            <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-custom w-full max-w-full">
              {solution.map((move, idx) => {
                const isActive = idx === currentStep;
                const isPassed = idx < currentStep;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleJumpToStep(idx + 1)}
                    className={`flex-none w-14 py-3 rounded-xl border font-bold font-orbitron flex flex-col items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 ${
                      isActive
                        ? 'bg-blue-600 border-blue-400 text-slate-950 scale-110 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10'
                        : isPassed
                          ? 'bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-300'
                          : 'bg-slate-850 border-slate-750 text-slate-200 hover:border-slate-650'
                    }`}
                  >
                    <span className="text-[10px] opacity-60">#{idx + 1}</span>
                    <span className="text-sm">{move}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* TOAST NOTIFICATION */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500 border border-emerald-400 text-slate-950 font-bold rounded-2xl shadow-xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 fill-current" />
          <div className="flex flex-col text-xs">
            <span>Congratulations!</span>
            <span className="font-normal opacity-90">The cube is already in a solved configuration!</span>
          </div>
        </div>
      )}

      {/* WEBCAM SCANNER OVERLAY MODAL */}
      {showWebcamScanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <VideoInput
            onScanComplete={handleScanComplete}
            onCancel={() => { playSound('click'); setShowWebcamScanner(false); }}
          />
        </div>
      )}

      {/* HELP GUIDE OVERLAY MODAL */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
            
            <h3 className="text-base font-bold font-orbitron text-blue-400 mb-4 uppercase tracking-wider">
              AetherCube Instructions
            </h3>
            
            <div className="text-xs text-slate-300 flex flex-col gap-4 leading-relaxed">
              <div>
                <p className="font-bold text-slate-100 mb-1">1. Configure Cube State</p>
                <p>Use either **Manual Paint Net** (click colors and paint the 2D layout) or the **Webcam Scanner** (scan each face step-by-step) to replicate your physical cube.</p>
              </div>
              
              <div>
                <p className="font-bold text-slate-100 mb-1">2. Run Solver</p>
                <p>Click **SOLVE CUBE**. The backend compiles and executes Herbert Kociemba's optimal two-phase algorithm in C++ to find the shortest moves (under 21 turns).</p>
              </div>

              <div>
                <p className="font-bold text-slate-100 mb-1">3. Playback Solution</p>
                <p>Use the 3D playback panel below the cube to play/pause, step forward/backward, and adjust execution speed. Click any move in the solution timeline track to jump directly to that step.</p>
              </div>
              
              <div>
                <p className="font-bold text-slate-100 mb-1">Note: Centers are fixed</p>
                <p>Rubik's Cube centers do not move relative to each other. The Up center is White, Right is Red, Front is Green, Down is Yellow, Left is Orange, and Back is Blue. This standard setup maps to the solver codes (U, R, F, D, L, B).</p>
              </div>
            </div>

            <button
              onClick={() => { playSound('click'); setShowHelp(false); }}
              className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
