import React from 'react';
import { motion } from 'framer-motion';
import { buttonPressVariants, secondaryPressVariants } from '../../animations/strokeAnimations.js';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon = null,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const isSecondary = variant === 'secondary';

  // Base sizing (touch friendly, minimum 44px on md/lg)
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px] gap-1.5 rounded-md font-medium',
    md: 'px-5 py-2.5 text-sm min-h-[44px] gap-2 rounded-lg font-medium',
    lg: 'px-7 py-3 text-base min-h-[50px] gap-2.5 rounded-lg font-semibold'
  }[size] || 'px-5 py-2.5 text-sm min-h-[44px] gap-2 rounded-lg font-medium';

  // Aesthetic styling matching the notebook palette
  let variantClasses = '';
  let motionVariants = isPrimary ? buttonPressVariants : secondaryPressVariants;

  if (isPrimary) {
    variantClasses = 'bg-[#23252A] text-[#F8F4EB] border border-[#23252A] shadow-sketch hover:bg-[#2C3038]';
  } else if (isSecondary) {
    variantClasses = 'bg-[#FFFDF9] text-[#23252A] border border-[#D5CFC3] shadow-sketch-sm hover:border-[#9C9486] hover:bg-[#FAF6EC]';
  } else if (isDanger) {
    variantClasses = 'bg-[#CE4242] text-[#FFFDF9] border border-[#B73333] shadow-sketch hover:bg-[#B73333]';
  } else if (isGhost) {
    variantClasses = 'bg-transparent text-[#5C6069] hover:text-[#23252A] hover:bg-black/5 border border-transparent';
    motionVariants = {};
  }

  const disabledClasses = disabled || isLoading
    ? 'opacity-50 cursor-not-allowed pointer-events-none shadow-none'
    : 'cursor-pointer';

  return (
    <motion.button
      type={type}
      variants={!disabled && !isLoading ? motionVariants : undefined}
      initial={false}
      whileHover={!disabled && !isLoading && motionVariants.hover ? 'hover' : undefined}
      whileTap={!disabled && !isLoading && motionVariants.tap ? 'tap' : undefined}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none font-sans transition-colors duration-150 ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>Penciling...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </motion.button>
  );
};

export default Button;
