import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  variant = 'standard', // 'standard' | 'ruled'
  id,
  className = '',
  disabled = false,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs uppercase tracking-wider font-semibold text-[#5C6069] flex items-center justify-between"
        >
          <span>{label}</span>
          {helperText && !error && (
            <span className="text-[11px] font-normal lowercase tracking-normal text-[#8E949F]">
              {helperText}
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-[#8E949F] pointer-events-none flex items-center">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm font-sans text-[#23252A] placeholder-[#8E949F] bg-[#FFFDF9] transition-all duration-150 outline-none
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${
              variant === 'ruled'
                ? 'border-b-2 border-t-0 border-x-0 border-[#D5CFC3] rounded-none bg-transparent focus:border-[#2B68B4]'
                : 'border border-[#D5CFC3] rounded-lg shadow-sm focus:border-[#23252A] focus:ring-1 focus:ring-[#23252A]/20'
            }
            ${error ? '!border-[#CE4242] focus:!ring-[#CE4242]/20' : ''}
            ${disabled ? 'bg-[#EFE8DA]/40 cursor-not-allowed opacity-60' : ''}
          `}
          {...props}
        />
      </div>

      {error && (
        <span className="text-xs text-[#CE4242] font-medium flex items-center gap-1 mt-0.5">
          <span className="inline-block w-1 h-1 rounded-full bg-[#CE4242]" />
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
