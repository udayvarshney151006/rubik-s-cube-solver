import React, { useState, useEffect, useRef } from 'react';
import { DISPLAY_COLORS } from '../utils/cubeState';
import { Play, Pause, SkipBack, ChevronLeft, ChevronRight, RotateCcw, Sliders } from 'lucide-react';

export default function RubiksCube({
  state,
  applyMoveToState,
  solution = [],
  currentStep = 0,
  setCurrentStep,
  isSolving = false
}) {
  // 3D Viewport rotation angles
  const [rotX, setRotX] = useState(-25);
  const [rotY, setRotY] = useState(45);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(800); // ms per move
  const [animatingMove, setAnimatingMove] = useState(null); // Current move being animated in 3D
  const timerRef = useRef(null);

  // Mouse drag to rotate the cube viewport
  const handleMouseDown = (e) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    
    setRotY((y) => y + deltaX * 0.5);
    setRotX((x) => Math.max(-85, Math.min(85, x - deltaY * 0.5))); // Clamp X to avoid flipping

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch support for mobile dragging
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStart.current.x;
    const deltaY = e.touches[0].clientY - dragStart.current.y;
    
    setRotY((y) => y + deltaX * 0.6);
    setRotX((x) => Math.max(-85, Math.min(85, x - deltaY * 0.6)));

    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Execute a move with 3D animation
  const animateAndExecuteMove = (move, direction = 'forward') => {
    if (!move) return;

    return new Promise((resolve) => {
      // Set the active animating move to trigger CSS transforms
      setAnimatingMove({ move, direction });

      // Wait for CSS transition (duration is tied to speed, max 500ms or 70% of speed)
      const animDuration = Math.min(350, playbackSpeed * 0.7);
      
      setTimeout(() => {
        // Apply changes to the logical cube state
        if (direction === 'forward') {
          applyMoveToState(move);
        } else {
          // Play inverse move
          const base = move[0];
          const mod = move.substring(1);
          let invMove = base;
          if (mod === '') invMove = base + "'";
          else if (mod === "'") invMove = base;
          else invMove = move; // U2 is its own inverse
          applyMoveToState(invMove);
        }
        
        // Reset animating move to snap cubies back to static state
        setAnimatingMove(null);
        resolve();
      }, animDuration);
    });
  };

  // Autoplay loop
  useEffect(() => {
    if (isPlaying && currentStep < solution.length) {
      timerRef.current = setTimeout(async () => {
        const move = solution[currentStep];
        await animateAndExecuteMove(move, 'forward');
        setCurrentStep((step) => step + 1);
      }, playbackSpeed);
    } else if (currentStep >= solution.length && isPlaying) {
      setIsPlaying(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, solution, playbackSpeed]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (solution.length === 0) return;
    if (currentStep >= solution.length) {
      // Auto restart if finished
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  // Step forward
  const handleStepForward = async () => {
    if (currentStep < solution.length && !animatingMove) {
      setIsPlaying(false);
      const move = solution[currentStep];
      await animateAndExecuteMove(move, 'forward');
      setCurrentStep(currentStep + 1);
    }
  };

  // Step backward
  const handleStepBackward = async () => {
    if (currentStep > 0 && !animatingMove) {
      setIsPlaying(false);
      const prevStep = currentStep - 1;
      const move = solution[prevStep];
      await animateAndExecuteMove(move, 'backward');
      setCurrentStep(prevStep);
    }
  };

  // Reset playback
  const handleResetPlayback = () => {
    setIsPlaying(false);
    // Rewind state step by step if needed, or trigger full state refresh
    // For simplicity, we just reset step to 0. The parent must reset the cube.
    setCurrentStep(0);
  };

  // --- 3D Cubie Coordinates & Render Mapper ---
  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Skip inner core cubie (not visible)
        if (x === 0 && y === 0 && z === 0) continue;
        cubies.push({ x, y, z });
      }
    }
  }

  // Gets the style for a cubie, applying rotation if it belongs to the animating layer
  const getCubieStyle = (cx, cy, cz) => {
    let style = {
      transform: `translateX(${cx * 80}px) translateY(${cy * 80}px) translateZ(${cz * 80}px)`
    };

    if (animatingMove) {
      const { move, direction } = animatingMove;
      const baseMove = move[0];
      const modifier = move.substring(1);
      
      const isDouble = modifier === '2';
      const isCCW = modifier === "'";
      
      // Compute rotation angle
      let angle = 90;
      if (isDouble) angle = 180;
      if (isCCW) angle = -90;
      if (direction === 'backward') angle = -angle;

      const animDuration = Math.min(350, playbackSpeed * 0.7);
      const transitionStyle = `transform ${animDuration}ms cubic-bezier(0.25, 0.8, 0.25, 1)`;

      // Check if this cubie belongs to the rotating layer
      if (baseMove === 'R' && cx === 1) {
        style.transform = `rotateX(${-angle}deg) ` + style.transform;
        style.transition = transitionStyle;
      } else if (baseMove === 'L' && cx === -1) {
        style.transform = `rotateX(${angle}deg) ` + style.transform;
        style.transition = transitionStyle;
      } else if (baseMove === 'U' && cy === -1) {
        style.transform = `rotateY(${-angle}deg) ` + style.transform;
        style.transition = transitionStyle;
      } else if (baseMove === 'D' && cy === 1) {
        style.transform = `rotateY(${angle}deg) ` + style.transform;
        style.transition = transitionStyle;
      } else if (baseMove === 'F' && cz === 1) {
        style.transform = `rotateZ(${-angle}deg) ` + style.transform;
        style.transition = transitionStyle;
      } else if (baseMove === 'B' && cz === -1) {
        style.transform = `rotateZ(${angle}deg) ` + style.transform;
        style.transition = transitionStyle;
      }
    }

    return style;
  };

  // Get facelet color code (U, R, F, D, L, B) based on cubie coordinate and face direction
  const getFaceletColor = (cx, cy, cz, face) => {
    // Only return colors for exterior stickers
    if (face === 'U' && cy === -1) {
      const idx = (cz + 1) * 3 + (cx + 1);
      return DISPLAY_COLORS[state.U[idx]];
    }
    if (face === 'D' && cy === 1) {
      const idx = (1 - cz) * 3 + (cx + 1);
      return DISPLAY_COLORS[state.D[idx]];
    }
    if (face === 'F' && cz === 1) {
      const idx = (cy + 1) * 3 + (cx + 1);
      return DISPLAY_COLORS[state.F[idx]];
    }
    if (face === 'B' && cz === -1) {
      const idx = (cy + 1) * 3 + (1 - cx);
      return DISPLAY_COLORS[state.B[idx]];
    }
    if (face === 'L' && cx === -1) {
      const idx = (cy + 1) * 3 + (cz + 1);
      return DISPLAY_COLORS[state.L[idx]];
    }
    if (face === 'R' && cx === 1) {
      const idx = (cy + 1) * 3 + (1 - cz);
      return DISPLAY_COLORS[state.R[idx]];
    }
    
    return '#090d16'; // Internal facelets are black charcoal
  };

  return (
    <div className="flex flex-col items-center w-full select-none">
      
      {/* 3D Viewport canvas container */}
      <div
        className="w-full h-[320px] sm:h-[380px] flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Helper drag info */}
        <span className="absolute top-2 right-4 text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-900/30 px-3 py-1 rounded-full pointer-events-none">
          Drag to Rotate 3D
        </span>

        {/* Loading Spinner during Solve operations */}
        {isSolving && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20" />
            <span className="text-xs font-semibold text-blue-300 font-orbitron tracking-wider">Solving Cube...</span>
          </div>
        )}

        <div className="cube-viewport">
          <div
            className="cube-container"
            style={{
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            }}
          >
            {/* Render 26 exterior cubies */}
            {cubies.map(({ x, y, z }) => (
              <div
                key={`cubie-${x}-${y}-${z}`}
                className="cubie"
                style={getCubieStyle(x, y, z)}
              >
                {/* 6 Faces per cubie */}
                {['u', 'd', 'f', 'b', 'l', 'r'].map((face) => {
                  const upperFace = face.toUpperCase();
                  const color = getFaceletColor(x, y, z, upperFace);
                  const showBorder = color !== '#090d16';
                  
                  return (
                    <div
                      key={face}
                      className={`cubie-face cubie-face-${face}`}
                      style={{
                        backgroundColor: color,
                        boxShadow: showBorder ? 'inset 0 0 10px rgba(0,0,0,0.15)' : 'none',
                        borderColor: showBorder ? '#1e293b' : 'transparent',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Solution Playback controls */}
      {solution.length > 0 && (
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3.5 shadow-xl glass-panel-light backdrop-blur mt-4">
          
          {/* Progress bar */}
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-bold font-orbitron tracking-wide text-slate-400">
              <span className="text-blue-400">PLAYBACK</span>
              <span>
                {currentStep} / {solution.length} MOVES
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full shadow-neon"
                style={{ width: `${(currentStep / solution.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Buttons panel */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={handleResetPlayback}
              title="Reset solution playback"
              className="p-2.5 bg-slate-800 hover:bg-slate-700/80 active:scale-90 text-slate-400 hover:text-slate-200 rounded-xl transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleStepBackward}
              disabled={currentStep === 0 || animatingMove}
              title="Step Backward"
              className="p-2.5 bg-slate-800 hover:bg-slate-700/80 active:scale-90 disabled:opacity-40 disabled:pointer-events-none text-slate-300 rounded-xl transition border border-slate-700/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause solution' : 'Play solution'}
              className={`p-4 active:scale-95 text-slate-950 rounded-2xl transition shadow-lg ${
                isPlaying
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-500/15'
                  : 'bg-gradient-to-r from-blue-400 to-indigo-500 shadow-blue-500/15'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            <button
              onClick={handleStepForward}
              disabled={currentStep === solution.length || animatingMove}
              title="Step Forward"
              className="p-2.5 bg-slate-800 hover:bg-slate-700/80 active:scale-90 disabled:opacity-40 disabled:pointer-events-none text-slate-300 rounded-xl transition border border-slate-700/50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(solution.length);
              }}
              title="Skip to end"
              className="p-2.5 bg-slate-800 hover:bg-slate-700/80 active:scale-90 text-slate-400 hover:text-slate-200 rounded-xl transition"
            >
              <SkipBack className="w-4 h-4 rotate-180" />
            </button>
          </div>

          {/* Speed slider control */}
          <div className="flex items-center gap-3 border-t border-slate-850 pt-3">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">Speed</span>
            <input
              type="range"
              min="300"
              max="2000"
              step="100"
              value={2300 - playbackSpeed} // Invert slider representation
              onChange={(e) => setPlaybackSpeed(2300 - parseInt(e.target.value, 10))}
              className="flex-1 accent-blue-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer border border-slate-850"
            />
            <span className="text-[10px] font-bold font-orbitron text-slate-400 w-12 text-right">
              {((2300 - playbackSpeed) / 1000).toFixed(1)}s
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
