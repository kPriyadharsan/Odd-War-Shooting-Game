import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { animatePencilStroke } from '../../animations/strokeAnimations.js';
import { Button } from './Button.jsx';

/**
 * PencilStrokeDemo Component
 * Demonstrates SVG pencil-stroke drawing animation using GSAP path reveal.
 * Visual foundation for future hand-drawn 2D pencil characters and icons.
 */
export const PencilStrokeDemo = ({ className = '' }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const pathRef1 = useRef(null);
  const pathRef2 = useRef(null);
  const pathRef3 = useRef(null);
  const pathRef4 = useRef(null);
  const pathRef5 = useRef(null);

  const drawPaths = () => {
    setIsDrawing(true);
    const paths = [
      pathRef1.current,
      pathRef2.current,
      pathRef3.current,
      pathRef4.current,
      pathRef5.current
    ].filter(Boolean);

    animatePencilStroke(paths, {
      duration: 0.9,
      stagger: 0.22,
      ease: 'power2.out',
      onComplete: () => setIsDrawing(false)
    });
  };

  useEffect(() => {
    drawPaths();
  }, []);

  return (
    <div
      className={`flex flex-col items-center p-6 bg-[#FFFDF9] border border-[#D5CFC3] rounded-xl shadow-paper ${className}`}
    >
      <div className="text-center mb-4">
        <span className="text-xs font-mono uppercase tracking-wider text-[#5C6069] block mb-1">
          SVG Pencil-Stroke Engine
        </span>
        <h4 className="text-lg font-handwriting font-bold text-[#23252A]">
          Hand-Drawn Battle Insignia
        </h4>
      </div>

      {/* SVG Canvas with Hand-Drawn Notebook Pencil Stroke */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 p-4 rounded-xl bg-[#FCFAF3] border border-dashed border-[#D5CFC3] flex items-center justify-center my-2">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle pencil sketch grid background in circle */}
          <circle
            cx="100"
            cy="100"
            r="82"
            stroke="#E5DFD3"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Path 1: Hand-drawn outer circle sketch */}
          <path
            ref={pathRef1}
            d="M 100 22 C 146 20, 180 58, 178 100 C 176 144, 142 178, 98 178 C 54 178, 22 144, 22 98 C 22 52, 58 24, 102 22"
            stroke="#23252A"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Path 2: Inner crosshair horizontal sketch */}
          <path
            ref={pathRef2}
            d="M 38 102 C 60 99, 90 101, 162 100"
            stroke="#2B68B4"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Path 3: Inner crosshair vertical sketch */}
          <path
            ref={pathRef3}
            d="M 100 38 C 101 65, 99 125, 101 162"
            stroke="#2B68B4"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Path 4: Target diamond / battle marker */}
          <path
            ref={pathRef4}
            d="M 100 68 L 132 100 L 100 132 L 68 100 Z"
            stroke="#CE4242"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Path 5: Center strike point */}
          <path
            ref={pathRef5}
            d="M 97 97 L 103 103 M 103 97 L 97 103"
            stroke="#23252A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Floating pencil status badge */}
        <div className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFE8DA] text-[#5C6069] border border-[#D5CFC3]">
          {isDrawing ? 'Sketching...' : 'Rendered (2D)'}
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-3">
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={drawPaths}
          disabled={isDrawing}
        >
          Re-Sketch Insignia
        </Button>
      </div>
    </div>
  );
};

export default PencilStrokeDemo;
