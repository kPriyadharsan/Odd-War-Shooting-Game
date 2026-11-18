import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil,
  Eraser,
  RotateCcw,
  Trash2,
  Check,
  Palette,
  Minus,
  Sparkles
} from 'lucide-react';
import { RenderedCharacterStrokes, pointsToSvgPath } from './RenderedCharacterStrokes.jsx';

/**
 * DrawingCanvas Component (Task 09)
 *
 * Implements:
 * - Freehand free-form pencil drawing with Pointer Events (Mouse, Touch, Stylus).
 * - Normalized virtual coordinate resolution (400 x 300).
 * - touch-action: none to prevent mobile scroll interference.
 * - Adjustable thickness (Fine 2px, Medium 4px, Thick 6px).
 * - Eraser tool with custom width.
 * - Undo last stroke & Clear canvas with confirmation.
 * - Underlayer showing previously completed construction stages.
 */
export const DrawingCanvas = ({
  stage = 'HEAD',
  previousDrawings = null,
  playerShadeHex = '#2B68B4',
  onSave = () => {},
  initialStrokes = [],
  className = ''
}) => {
  const containerRef = useRef(null);

  // Drawing state
  const [strokes, setStrokes] = useState(initialStrokes);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState('pencil'); // 'pencil' | 'eraser'
  const [pencilColor, setPencilColor] = useState('#23252A'); // Graphite default
  const [strokeWidth, setStrokeWidth] = useState(4); // 2, 4, 6
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Active in-progress stroke
  const currentPointsRef = useRef([]);
  const [activePoints, setActivePoints] = useState([]);

  // Coordinate conversion helper: client coordinates -> 400x300 virtual coordinate space
  const getCanvasCoords = useCallback((e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 300 / rect.height;

    const x = Math.max(0, Math.min(400, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(300, (e.clientY - rect.top) * scaleY));

    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10
    };
  }, []);

  // Pointer Down
  const handlePointerDown = (e) => {
    e.preventDefault();
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {}

    const coords = getCanvasCoords(e);
    currentPointsRef.current = [coords];
    setActivePoints([coords]);
    setIsDrawing(true);
  };

  // Pointer Move
  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    const lastPoint = currentPointsRef.current[currentPointsRef.current.length - 1];

    // Minimal distance threshold to prevent unnecessary point spam
    if (lastPoint) {
      const dx = coords.x - lastPoint.x;
      const dy = coords.y - lastPoint.y;
      if (dx * dx + dy * dy < 2.5) return;
    }

    currentPointsRef.current.push(coords);
    setActivePoints([...currentPointsRef.current]);
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}

    setIsDrawing(false);

    const completedPoints = currentPointsRef.current;
    if (completedPoints.length > 0) {
      const isEraser = activeTool === 'eraser';
      const newStroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        points: completedPoints,
        color: isEraser ? '#FCFAF3' : pencilColor,
        width: isEraser ? 16 : strokeWidth,
        isEraser
      };

      setStrokes((prev) => [...prev, newStroke]);
    }

    currentPointsRef.current = [];
    setActivePoints([]);
  };

  // Undo Last Stroke
  const handleUndo = () => {
    if (strokes.length === 0) return;
    setStrokes((prev) => prev.slice(0, -1));
  };

  // Clear Canvas
  const handleClear = () => {
    setStrokes([]);
    setShowClearConfirm(false);
  };

  const activePathData = pointsToSvgPath(activePoints);

  return (
    <div className={`flex flex-col w-full max-w-lg mx-auto select-none ${className}`}>
      {/* Top Toolbar: Tools, Colors, Width, Undo */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-2.5 rounded-t-xl border-2 border-b-0 border-[#23252A] bg-[#FAF5EB]">
        {/* Left: Pencil vs Eraser Toggle */}
        <div className="flex items-center gap-1 bg-[#EFE8DA]/80 p-1 rounded-lg border border-[#D5CFC3]">
          <button
            type="button"
            onClick={() => setActiveTool('pencil')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
              activeTool === 'pencil'
                ? 'bg-[#242730] text-[#F8F4EB] shadow-xs'
                : 'text-[#4A4F5B] hover:text-[#242730]'
            }`}
            title="Pencil Tool"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pencil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
              activeTool === 'eraser'
                ? 'bg-[#242730] text-[#F8F4EB] shadow-xs'
                : 'text-[#4A4F5B] hover:text-[#242730]'
            }`}
            title="Eraser Tool"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eraser</span>
          </button>
        </div>

        {/* Center: Thickness Options (2px, 4px, 6px) */}
        {activeTool === 'pencil' && (
          <div className="flex items-center gap-1 bg-[#EFE8DA]/80 p-1 rounded-lg border border-[#D5CFC3]">
            {[
              { size: 2, label: 'Fine' },
              { size: 4, label: 'Medium' },
              { size: 6, label: 'Thick' }
            ].map(({ size, label }) => (
              <button
                key={size}
                type="button"
                onClick={() => setStrokeWidth(size)}
                className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition-colors ${
                  strokeWidth === size
                    ? 'bg-[#242730] text-[#F8F4EB] font-bold shadow-xs'
                    : 'text-[#5C6069] hover:text-[#242730]'
                }`}
                title={`${label} line (${size}px)`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: strokeWidth === size ? '#F8F4EB' : '#5C6069',
                    transform: `scale(${size / 2})`
                  }}
                />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Color Palette Toggle: Graphite (#23252A) vs Player Color */}
        {activeTool === 'pencil' && (
          <div className="flex items-center gap-1 bg-[#EFE8DA]/80 p-1 rounded-lg border border-[#D5CFC3]">
            <button
              type="button"
              onClick={() => setPencilColor('#23252A')}
              className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${
                pencilColor === '#23252A'
                  ? 'border-[#242730] scale-110 shadow-xs'
                  : 'border-transparent opacity-70'
              }`}
              style={{ backgroundColor: '#23252A' }}
              title="Graphite Pencil"
            >
              {pencilColor === '#23252A' && <Check className="w-3 h-3 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => setPencilColor(playerShadeHex)}
              className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${
                pencilColor === playerShadeHex
                  ? 'border-[#242730] scale-110 shadow-xs'
                  : 'border-transparent opacity-70'
              }`}
              style={{ backgroundColor: playerShadeHex }}
              title="Player Character Ink"
            >
              {pencilColor === playerShadeHex && <Check className="w-3 h-3 text-white" />}
            </button>
          </div>
        )}

        {/* Right: Undo & Clear Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-1.5 rounded border border-[#D5CFC3] bg-[#FCFAF5] hover:bg-[#EFE8DA] text-[#242730] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Undo last stroke"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={strokes.length === 0}
            className="p-1.5 rounded border border-[#CE4242]/30 bg-[#FCFAF5] hover:bg-[#FDF2F2] text-[#CE4242] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Clear drawing"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawing Surface Viewport (Aspect ratio 400 x 300) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full aspect-[4/3] rounded-b-xl border-2 border-[#23252A] bg-[#FCFAF5] overflow-hidden cursor-crosshair shadow-inner"
        style={{ touchAction: 'none' }}
      >
        {/* Notebook Paper Horizontal Rulings */}
        <div className="absolute inset-0 pointer-events-none opacity-25 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_21px,rgba(130,155,185,0.3)_22px)]" />

        {/* Subtle Notebook Left Margin Accent */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#D75050]/20 pointer-events-none" />

        {/* Underlayer: Faint Previous Drawings (HEAD, BODY, GUN, etc.) */}
        {previousDrawings && (
          <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
            <RenderedCharacterStrokes
              drawings={previousDrawings}
              dimmed={true}
              viewBox="0 0 400 300"
            />
          </div>
        )}

        {/* Main SVG Vector Layer */}
        <svg
          viewBox="0 0 400 300"
          className="relative z-10 w-full h-full overflow-hidden pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Completed Strokes */}
          {strokes.map((stroke, idx) => {
            const pathData = pointsToSvgPath(stroke.points);
            if (!pathData) return null;
            return (
              <path
                key={stroke.id || idx}
                d={pathData}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  mixBlendMode: stroke.isEraser ? 'normal' : 'multiply'
                }}
              />
            );
          })}

          {/* Active In-Progress Stroke */}
          {activePathData && (
            <path
              d={activePathData}
              fill="none"
              stroke={activeTool === 'eraser' ? '#FCFAF5' : pencilColor}
              strokeWidth={activeTool === 'eraser' ? 16 : strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                mixBlendMode: activeTool === 'eraser' ? 'normal' : 'multiply'
              }}
            />
          )}
        </svg>

        {/* Empty Canvas Guide Label */}
        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-4">
            <Pencil className="w-8 h-8 text-[#D59926]/40 mb-1" />
            <span className="font-handwriting text-base text-[#8C929D]">
              Draw your {stage} here
            </span>
            <span className="font-mono text-[10px] text-[#8C929D]/60 mt-0.5">
              Touch, mouse, or stylus supported
            </span>
          </div>
        )}

        {/* Stroke counter indicator */}
        <div className="absolute bottom-2 right-2.5 pointer-events-none z-20">
          <span className="font-mono text-[9px] text-[#8C929D] px-1.5 py-0.5 rounded bg-white/70 border border-black/10">
            {strokes.length} stroke{strokes.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Clear Confirmation Prompt */}
      {showClearConfirm && (
        <div className="mt-2 p-2.5 rounded-lg border border-[#CE4242]/40 bg-[#FDF2F2] flex items-center justify-between gap-3 text-xs font-mono">
          <span className="text-[#CE4242]">Clear all pencil strokes?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-2 py-0.5 rounded border border-[#D5CFC3] bg-white text-[#4A4F5B]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-0.5 rounded bg-[#CE4242] text-white font-bold"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Bottom Action: Review & Submit */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-handwriting text-xs text-[#5C6069]">
          Stage: <strong className="text-[#242730]">{stage}</strong> • Complete stage to advance
        </span>

        <button
          type="button"
          onClick={() => onSave({ strokes })}
          disabled={strokes.length === 0}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2E8557] hover:bg-[#1C5236] text-white font-mono font-bold text-xs shadow-sketch disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>SUBMIT {stage}</span>
        </button>
      </div>
    </div>
  );
};
