import React from 'react';
import { motion } from 'framer-motion';

export const LoadingIndicator = ({
  size = 'md', // 'sm' | 'md' | 'lg'
  label = 'Sketching...',
  showLabel = true,
  className = ''
}) => {
  const sizeConfig = {
    sm: { container: 'h-6 gap-2', dot: 'w-2 h-2', text: 'text-xs' },
    md: { container: 'h-10 gap-3', dot: 'w-2.5 h-2.5', text: 'text-sm' },
    lg: { container: 'h-14 gap-3.5', dot: 'w-3.5 h-3.5', text: 'text-base' }
  }[size] || { container: 'h-10 gap-3', dot: 'w-2.5 h-2.5', text: 'text-sm' };

  return (
    <div
      className={`inline-flex items-center justify-center font-sans ${sizeConfig.container} ${className}`}
      role="status"
      aria-label={label}
    >
      {/* Animated Pencil Lead Dots */}
      <div className="flex items-center space-x-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className={`${sizeConfig.dot} rounded-full bg-[#23252A]`}
            animate={{
              y: [0, -6, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 0.75,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.18
            }}
          />
        ))}
      </div>

      {showLabel && (
        <span className={`font-handwriting font-bold tracking-wide text-[#5C6069] ${sizeConfig.text}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default LoadingIndicator;
