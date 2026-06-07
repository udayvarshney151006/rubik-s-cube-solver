import React from 'react';
import { DISPLAY_COLORS, FACE_NAMES, COLOR_NAMES } from '../utils/cubeState';
import { RotateCcw, Lock } from 'lucide-react';

export default function CubeConfigurator({ state, onChange, activeColor, setActiveColor }) {
  
  // Handle click on a facelet to paint it
  const handleFaceletClick = (face, index) => {
    // Center facelets (index 4) are fixed and cannot be changed
    if (index === 4) return;

    const newFaceArray = [...state[face]];
    newFaceArray[index] = activeColor;

    const nextState = {
      ...state,
      [face]: newFaceArray
    };

    onChange(nextState);
  };

  // Reset to solved state
  const handleReset = () => {
    const solved = {
      U: Array(9).fill('U'),
      R: Array(9).fill('R'),
      F: Array(9).fill('F'),
      D: Array(9).fill('D'),
      L: Array(9).fill('L'),
      B: Array(9).fill('B')
    };
    onChange(solved);
  };

  // Renders a 3x3 face grid for the net layout
  const renderFaceGrid = (face) => {
    const facelets = state[face];
    
    return (
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700/50 shadow-inner w-[100px] h-[100px] sm:w-[120px] sm:h-[120px]">
        {facelets.map((colorCode, idx) => {
          const isCenter = idx === 4;
          const bgStyle = { backgroundColor: DISPLAY_COLORS[colorCode] };
          
          return (
            <button
              key={`${face}-${idx}`}
              onClick={() => handleFaceletClick(face, idx)}
              className={`relative rounded-md transition-all duration-150 shadow-sm border border-black/10 hover:brightness-110 active:scale-95 flex items-center justify-center`}
              style={bgStyle}
              title={`${face}${idx + 1}: ${COLOR_NAMES[colorCode]}`}
              disabled={isCenter}
            >
              {isCenter && (
                <Lock className="w-3.5 h-3.5 text-black/40 drop-shadow" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Color Palette Selector */}
      <div className="mb-6 w-full flex flex-col items-center">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Select Paint Color
        </label>
        
        <div className="flex gap-2 sm:gap-3 bg-slate-900/60 p-2 sm:p-3 rounded-2xl border border-slate-800 shadow-inner">
          {FACE_NAMES.map((colorCode) => {
            const isSelected = activeColor === colorCode;
            const bgStyle = { backgroundColor: DISPLAY_COLORS[colorCode] };
            
            return (
              <button
                key={colorCode}
                onClick={() => setActiveColor(colorCode)}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl transition-all duration-200 border-2 hover:scale-105 active:scale-95 flex flex-col items-center justify-center ${
                  isSelected 
                    ? 'border-white scale-110 ring-4 ring-blue-500/20 shadow-lg' 
                    : 'border-transparent opacity-85 hover:opacity-100'
                }`}
                style={bgStyle}
                title={`Paint with ${COLOR_NAMES[colorCode]}`}
              >
                <span className="text-[10px] sm:text-xs font-black text-black/50 drop-shadow-sm select-none">
                  {colorCode}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive 2D Cube Net Layout */}
      {/* 
            [ U ]
        [L] [ F ] [R] [B]
            [ D ]
      */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 mb-6 p-4 sm:p-6 bg-slate-900/40 rounded-3xl border border-slate-800/60 shadow-xl max-w-full overflow-x-auto">
        {/* Row 1: U Face */}
        <div className="flex justify-center w-full">
          <div className="w-[100px] sm:w-[120px]"></div> {/* spacer for Left */}
          {renderFaceGrid('U')}
          <div className="w-[100px] sm:w-[120px]"></div> {/* spacer for Right */}
          <div className="w-[100px] sm:w-[120px]"></div> {/* spacer for Back */}
        </div>

        {/* Row 2: L, F, R, B Faces */}
        <div className="flex justify-center gap-1.5 sm:gap-2 w-full">
          {renderFaceGrid('L')}
          {renderFaceGrid('F')}
          {renderFaceGrid('R')}
          {renderFaceGrid('B')}
        </div>

        {/* Row 3: D Face */}
        <div className="flex justify-center w-full">
          <div className="w-[100px] sm:w-[120px]"></div> {/* spacer for Left */}
          {renderFaceGrid('D')}
          <div className="w-[100px] sm:w-[120px]"></div> {/* spacer for Right */}
          <div className="w-[100px] sm:w-[120px]"></div> {/* spacer for Back */}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700/80 active:scale-95 text-slate-300 rounded-xl transition-all duration-200 border border-slate-700/60 shadow"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Solved
        </button>
      </div>
    </div>
  );
}
