import React from 'react';
import { motion } from 'framer-motion';
import { paperEntranceVariants } from '../../animations/strokeAnimations.js';

export const Card = ({
  children,
  variant = 'default', // 'default' | 'ruled' | 'taped' | 'sketch'
  padding = 'md',     // 'none' | 'sm' | 'md' | 'lg'
  className = '',
  animate = false,
  index = 0,
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-4 sm:p-6 md:p-8'
  }[padding] || 'p-4 sm:p-6';

  let variantClasses = '';
  if (variant === 'ruled') {
    variantClasses = 'card-ruled border border-[#D5CFC3] shadow-paper rounded-xl';
  } else if (variant === 'taped') {
    variantClasses = 'bg-[#FFFDF9] border border-[#D5CFC3] shadow-paper rounded-xl tape-top-center';
  } else if (variant === 'sketch') {
    variantClasses = 'bg-[#FFFDF9] border-2 border-[#23252A] shadow-sketch rounded-xl';
  } else {
    // Default paper card
    variantClasses = 'bg-[#FFFDF9] border border-[#D5CFC3] shadow-paper rounded-xl';
  }

  const Component = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        variants: paperEntranceVariants,
        initial: 'hidden',
        animate: 'visible',
        custom: index
      }
    : {};

  return (
    <Component
      className={`relative transition-all duration-150 ${variantClasses} ${paddingClasses} ${className}`}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
