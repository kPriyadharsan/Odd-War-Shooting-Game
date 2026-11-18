import React from 'react';

/**
 * Converts an array of point coordinates into a smooth SVG path d attribute.
 * Uses midpoint quadratic Bézier curve interpolation for natural pencil strokes.
 */
export const pointsToSvgPath = (points) => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  if (points.length === 2) {
    return `${d} L ${points[1].x} ${points[1].y}`;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }

  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
};

/**
 * RenderedCharacterStrokes Component (Task 09)
 * Renders completed or preview strokes as responsive vector SVGs inside row stations or modals.
 * Preserves the original freehand pencil sketch feel.
 */
export const RenderedCharacterStrokes = ({
  drawings = null,
  strokes = null,
  width = '100%',
  height = '100%',
  viewBox = '0 0 400 300',
  className = '',
  dimmed = false
}) => {
  // Aggregate all strokes from drawings object (HEAD, BODY, GUN, BULLET) or use strokes array directly
  let allStrokes = [];

  if (strokes && Array.isArray(strokes)) {
    allStrokes = strokes;
  } else if (drawings && typeof drawings === 'object') {
    const stageOrder = ['HEAD', 'BODY', 'GUN', 'BULLET'];
    stageOrder.forEach((stage) => {
      const stageDrawing = drawings[stage];
      if (stageDrawing?.strokes && Array.isArray(stageDrawing.strokes)) {
        allStrokes.push(...stageDrawing.strokes);
      }
    });
  }

  if (allStrokes.length === 0) {
    return null;
  }

  return (
    <svg
      viewBox={viewBox}
      className={`overflow-visible select-none pointer-events-none ${className}`}
      style={{ width, height, opacity: dimmed ? 0.35 : 1 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {allStrokes.map((stroke, idx) => {
        const pathData = pointsToSvgPath(stroke.points);
        if (!pathData) return null;

        const isEraser = Boolean(stroke.isEraser);
        const strokeColor = isEraser ? '#FCFAF3' : (stroke.color || '#23252A');
        const strokeWidth = stroke.width || 3;

        return (
          <path
            key={stroke.id || idx}
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              mixBlendMode: isEraser ? 'normal' : 'multiply'
            }}
          />
        );
      })}
    </svg>
  );
};
