import React from 'react';
import { motion } from 'framer-motion';
import { buttonPressVariants, secondaryPressVariants } from '../../animations/strokeAnimations.js';

export const IconButton = ({
  icon: Icon,
  variant = 'secondary', // 'secondary' | 'primary' | 'ghost'
  size = 'md',          // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  onClick,
  title,
  ariaLabel,
  ...props
}) => {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5 rounded-md text-xs',
    md: 'w-11 h-11 p-2.5 rounded-lg text-sm',
    lg: 'w-13 h-13 p-3 rounded-xl text-base'
  }[size] || 'w-11 h-11 p-2.5 rounded-lg text-sm';

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size] || 'w-5 h-5';

  let variantClasses = '';
  let motionVariants = isPrimary ? buttonPressVariants : secondaryPressVariants;

  if (isPrimary) {
    variantClasses = 'bg-[#23252A] text-[#F8F4EB] border border-[#23252A] shadow-sketch hover:bg-[#2C3038]';
  } else if (isGhost) {
    variantClasses = 'bg-transparent text-[#5C6069] hover:text-[#23252A] hover:bg-black/5 border border-transparent';
    motionVariants = {};
  } else {
    // Secondary default
    variantClasses = 'bg-[#FFFDF9] text-[#23252A] border border-[#D5CFC3] shadow-sketch-sm hover:border-[#9C9486] hover:bg-[#FAF6EC]';
  }

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none shadow-none'
    : 'cursor-pointer';

  return (
    <motion.button
      type="button"
      variants={!disabled ? motionVariants : undefined}
      initial={false}
      whileHover={!disabled && motionVariants.hover ? 'hover' : undefined}
      whileTap={!disabled && motionVariants.tap ? 'tap' : undefined}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      className={`inline-flex items-center justify-center select-none transition-colors duration-150 ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
      {...props}
    >
      {Icon && <Icon className={iconSizes} />}
    </motion.button>
  );
};

export default IconButton;
