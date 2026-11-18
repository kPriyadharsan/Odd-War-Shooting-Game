import React from 'react';

export const SectionHeading = ({
  title,
  subtitle,
  badge,
  as: Tag = 'h2',
  align = 'left', // 'left' | 'center'
  showUnderline = true,
  className = '',
  ...props
}) => {
  const isCenter = align === 'center';

  return (
    <div
      className={`mb-6 ${isCenter ? 'text-center flex flex-col items-center' : 'text-left'} ${className}`}
      {...props}
    >
      {badge && (
        <span className="inline-block px-2.5 py-0.5 mb-2 text-xs font-mono font-medium tracking-wide uppercase bg-[#EFE8DA] text-[#5C6069] border border-[#D5CFC3] rounded-md">
          {badge}
        </span>
      )}

      <Tag className="text-2xl sm:text-3xl font-handwriting font-bold tracking-wide text-[#23252A] relative inline-block">
        {title}
        {showUnderline && (
          <svg
            className={`w-full h-2.5 mt-0.5 text-[#2B68B4]/40 ${
              isCenter ? 'mx-auto' : ''
            }`}
            viewBox="0 0 100 10"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M2 7 C 25 3, 50 8, 98 4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </Tag>

      {subtitle && (
        <p className="mt-1.5 text-sm sm:text-base text-[#5C6069] max-w-2xl font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
