import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { DISPLAY_COLORS, FACE_NAMES, COLOR_NAMES } from '../utils/cubeState';
import { sampleGridCell } from '../utils/colorDetection';

export default function VideoInput({ onScanComplete, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [activeFaceIndex, setActiveFaceIndex] = useState(0);
  const [scannedState, setScannedState] = useState({
    U: null, R: null, F: null, D: null, L: null, B: null
  });
  const [liveColors, setLiveColors] = useState(Array(9).fill('U'));
  
  const [hasCameraError, setHasCameraError] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('Initializing camera...');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const facesToScan = FACE_NAMES; // ['U', 'R', 'F', 'D', 'L', 'B']

  // Target center colors for reference
  const centerColors = {
    U: 'U', // White
    R: 'R', // Red
    F: 'F', // Green
    D: 'D', // Yellow
    L: 'L', // Orange
    B: 'B', // Blue
  };

  // Start webcam stream
  const startCamera = async () => {
    setHasCameraError(false);
    setCameraMessage('Accessing camera stream...');
    setIsCameraActive(false);

    if (streamRef.current) {
      stopCamera();
    }

    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera for laptops, change to 'environment' if desired
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsCameraActive(true);
          startProcessing();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setHasCameraError(true);
      setCameraMessage('Could not access your camera. Please check permissions and connection.');
    }
  };

  // Stop webcam stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Process video frames to run color detection in real-time
  const startProcessing = () => {
    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size matching the video feed
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Draw mirror image for intuitive user experience
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform

      // Compute grid coordinates
      // Place the 3x3 grid overlay in the center of the canvas
      const size = Math.min(canvas.width, canvas.height) * 0.6; // 60% of viewport
      const startX = (canvas.width - size) / 2;
      const startY = (canvas.height - size) / 2;
      const cellSize = size / 3;

      const newLiveColors = [];

      // Loop through the 9 grid cells
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const idx = row * 3 + col;
          
          // Compute center coordinates of this grid cell
          const cellX = startX + col * cellSize + cellSize / 2;
          const cellY = startY + row * cellSize + cellSize / 2;
          const sampleBoxSize = Math.max(12, Math.round(cellSize * 0.25)); // Sample 25% of grid box

          let detected = 'U';

          // Sample color
          if (idx === 4) {
            // Center is always locked to the target face's color
            detected = centerColors[facesToScan[activeFaceIndex]];
          } else {
            detected = sampleGridCell(ctx, cellX, cellY, sampleBoxSize);
          }

          newLiveColors.push(detected);

          // Draw grid border on canvas
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            startX + col * cellSize + 4,
            startY + row * cellSize + 4,
            cellSize - 8,
            cellSize - 8
          );

          // Draw small color sample indicators in the center
          ctx.fillStyle = DISPLAY_COLORS[detected];
          ctx.beginPath();
          ctx.arc(cellX, cellY, 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
      }

      setLiveColors(newLiveColors);
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [activeFaceIndex]);

  // Capture the current face colors
  const handleCapture = () => {
    const face = facesToScan[activeFaceIndex];
    const newFaceState = [...liveColors];

    // Force the center facelet to be exactly the expected face code
    newFaceState[4] = centerColors[face];

    setScannedState(prev => ({
      ...prev,
      [face]: newFaceState
    }));

    // Auto advance to next face if not the last one
    if (activeFaceIndex < 5) {
      setActiveFaceIndex(prev => prev + 1);
    }
  };

  // Complete scanning and send back to parent
  const handleConfirm = () => {
    // Fill in default solved facelets for any missing scans just in case
    const finalState = {};
    for (const face of facesToScan) {
      finalState[face] = scannedState[face] || Array(9).fill(face);
    }
    onScanComplete(finalState);
  };

  const currentFace = facesToScan[activeFaceIndex];
  const allFacesCaptured = facesToScan.every(f => scannedState[f] !== null);

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full max-w-5xl mx-auto p-4 glass-panel rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* Background glow lines */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-green-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Left Column: Live camera view */}
      <div className="flex-1 flex flex-col items-center">
        <h3 className="text-lg font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          Align & Scan Cube
        </h3>
        <p className="text-xs text-slate-400 text-center mb-4 max-w-md">
          Align the <span className="font-semibold text-blue-300">{COLOR_NAMES[centerColors[currentFace]]} center</span> with the center square. Keep the cube flat and steady under clear lighting.
        </p>

        {/* Video stream viewport wrapper */}
        <div className="relative w-full aspect-[4/3] max-w-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
          
          <video
            ref={videoRef}
            className="hidden"
            playsInline
            muted
          />

          <canvas
            ref={canvasRef}
            className={`w-full h-full object-cover transform ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Fallback states */}
          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {hasCameraError ? (
                <>
                  <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
                  <p className="text-sm text-slate-300 font-medium mb-4">{cameraMessage}</p>
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold rounded-xl transition shadow-lg text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                  <p className="text-sm text-slate-400">{cameraMessage}</p>
                </>
              )}
            </div>
          )}

          {/* Guide Overlay Text */}
          {isCameraActive && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: DISPLAY_COLORS[centerColors[currentFace]] }}></span>
              SCANNING {COLOR_NAMES[centerColors[currentFace]].toUpperCase()} FACE
            </div>
          )}
        </div>

        {/* Capture button */}
        <div className="mt-6 flex gap-4 w-full max-w-[480px]">
          <button
            onClick={handleCapture}
            disabled={!isCameraActive}
            className="flex-1 py-3 px-6 font-bold text-white rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Capture Face
          </button>
        </div>
      </div>

      {/* Right Column: Scan status & sequential guide */}
      <div className="w-full xl:w-[320px] flex flex-col bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 shadow-inner">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 border-b border-slate-800 pb-2">
          Scanning Progress
        </h4>

        {/* 6 Face progress buttons */}
        <div className="grid grid-cols-3 xl:grid-cols-2 gap-2 mb-6">
          {facesToScan.map((face, idx) => {
            const isActive = idx === activeFaceIndex;
            const isScanned = scannedState[face] !== null;
            
            return (
              <button
                key={face}
                onClick={() => setActiveFaceIndex(idx)}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 relative ${
                  isActive 
                    ? 'bg-blue-600/10 border-blue-500 text-blue-300 ring-2 ring-blue-500/20' 
                    : isScanned
                      ? 'bg-emerald-600/5 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-700'
                }`}
              >
                {/* Captured checkmark dot */}
                {isScanned && (
                  <span className="absolute top-1 right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5">
                    <Check className="w-2 h-2 stroke-[4]" />
                  </span>
                )}
                
                <span className="w-4 h-4 rounded" style={{ backgroundColor: DISPLAY_COLORS[centerColors[face]] }} />
                <span className="text-xs font-bold font-orbitron">{COLOR_NAMES[centerColors[face]]} ({face})</span>
              </button>
            );
          })}
        </div>

        {/* Live captured facelet preview */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center mb-6">
            <span className="text-xs font-semibold text-slate-400 block mb-3 uppercase tracking-wider">
              {scannedState[currentFace] ? 'Captured Preview' : 'Live Analyzer Preview'}
            </span>
            
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-0.5 p-1 bg-slate-900 rounded-lg border border-slate-800 w-[90px] h-[90px]">
                {(scannedState[currentFace] || liveColors).map((color, idx) => (
                  <span
                    key={idx}
                    className="rounded-sm"
                    style={{ backgroundColor: DISPLAY_COLORS[color] }}
                  />
                ))}
              </div>
            </div>
            
            {scannedState[currentFace] && (
              <span className="text-[10px] text-emerald-400 font-semibold mt-2 block">
                Face captured successfully!
              </span>
            )}
          </div>
        </div>

        {/* Navigation / Action Footer */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between gap-3">
            <button
              onClick={() => setActiveFaceIndex(p => Math.max(0, p - 1))}
              disabled={activeFaceIndex === 0}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-700 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            
            <button
              onClick={() => setActiveFaceIndex(p => Math.min(5, p + 1))}
              disabled={activeFaceIndex === 5}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-700 transition"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl text-xs font-bold transition border border-slate-700/60"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={!allFacesCaptured}
              className="flex-1 py-2.5 font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-350 hover:to-teal-350 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs shadow-lg transition-all duration-200 flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Confirm & Apply
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
