import React from 'react';

/**
 * NotebookBackground Component
 * Renders lightweight CSS-ruled warm ivory notebook paper with subtle margin ruling.
 * Zero raster images, purely CSS-driven, responsive and performant.
 */
export const NotebookBackground = ({
  children,
  showMargin = true,
  className = '',
  as: Component = 'div'
}) => {
  return (
    <Component
      className={`min-h-screen w-full relative ${
        showMargin ? 'notebook-paper' : 'card-ruled'
      } ${className}`}
    >
      {children}
    </Component>
  );
};

export default NotebookBackground;
