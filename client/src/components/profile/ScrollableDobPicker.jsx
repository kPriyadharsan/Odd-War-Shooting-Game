import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const MONTHS = [
  { value: 1, name: 'Jan', full: 'January' },
  { value: 2, name: 'Feb', full: 'February' },
  { value: 3, name: 'Mar', full: 'March' },
  { value: 4, name: 'Apr', full: 'April' },
  { value: 5, name: 'May', full: 'May' },
  { value: 6, name: 'Jun', full: 'June' },
  { value: 7, name: 'Jul', full: 'July' },
  { value: 8, name: 'Aug', full: 'August' },
  { value: 9, name: 'Sep', full: 'September' },
  { value: 10, name: 'Oct', full: 'October' },
  { value: 11, name: 'Nov', full: 'November' },
  { value: 12, name: 'Dec', full: 'December' }
];

// Compact sizing: 3 rows visible (1 top, 1 middle selected, 1 bottom)
const ITEM_HEIGHT = 36;
const VISIBLE_ROWS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS; // 108px

/**
 * Individual compact 3D cylindrical drum wheel column.
 */
const DrumColumn = ({
  items,
  selectedIndex,
  onSelect,
  label,
  formatItem = (item) => String(item),
  setIsScrolling
}) => {
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isProgrammaticScroll = useRef(false);

  // Sync scroll position when selectedIndex changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targetScrollTop = selectedIndex * ITEM_HEIGHT;
    if (Math.abs(container.scrollTop - targetScrollTop) > 1) {
      isProgrammaticScroll.current = true;
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      const timer = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      if (isProgrammaticScroll.current) return;

      const rawIndex = Math.round(container.scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));

      container.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: 'smooth'
      });

      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
    }, 100);
  }, [items.length, onSelect, selectedIndex, setIsScrolling]);

  const handleItemClick = (index) => {
    const container = containerRef.current;
    if (!container) return;
    onSelect(index);
    container.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: 'smooth'
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center select-none relative">
      {/* Subtle small column label */}
      <div className="text-[10px] font-mono tracking-wider uppercase text-[#FF54A5] font-bold mb-1 opacity-80">
        {label}
      </div>

      {/* Wheel Column */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: PICKER_HEIGHT,
          scrollSnapType: 'y mandatory',
          perspective: '400px',
          perspectiveOrigin: 'center center'
        }}
        className="w-full overflow-y-auto no-scrollbar relative focus:outline-none"
      >
        {/* Top Spacer for 1 row */}
        <div style={{ height: ITEM_HEIGHT }} />

        {items.map((item, idx) => {
          const offset = idx - selectedIndex;
          const isSelected = offset === 0;
          const distance = Math.abs(offset);

          let rotateX = 0;
          let scale = 1;
          let opacity = 1;

          if (distance === 0) {
            scale = 1.06;
            opacity = 1;
            rotateX = 0;
          } else if (distance === 1) {
            scale = 0.88;
            opacity = 0.4;
            rotateX = offset > 0 ? -26 : 26;
          } else {
            scale = 0.7;
            opacity = 0.12;
            rotateX = offset > 0 ? -48 : 48;
          }

          return (
            <div
              key={idx}
              onClick={() => handleItemClick(idx)}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: 'center',
                transform: `rotateX(${rotateX}deg) scale(${scale})`,
                opacity,
                transition: 'transform 0.15s ease, opacity 0.15s ease, color 0.15s ease',
                transformStyle: 'preserve-3d'
              }}
              className={`flex items-center justify-center font-mono cursor-pointer transition-all ${
                isSelected
                  ? 'text-white font-bold text-sm tracking-wide'
                  : 'text-zinc-400 font-medium text-xs hover:text-pink-300'
              }`}
            >
              <span
                style={{
                  textShadow: isSelected
                    ? '0 0 8px #FF2A85, 0 0 16px #FF007F'
                    : 'none'
                }}
              >
                {formatItem(item)}
              </span>
            </div>
          );
        })}

        {/* Bottom Spacer for 1 row */}
        <div style={{ height: ITEM_HEIGHT }} />
      </div>
    </div>
  );
};

/**
 * Compact ScrollableDobPicker
 * Features:
 * - Simple, compact 3D cylindrical scroller (108px height).
 * - Vibrant GTA 6 Pink tone neon glow active row.
 * - Auto-correcting days in month (leap year support).
 * - Returns clean YYYY-MM-DD.
 */
export const ScrollableDobPicker = ({
  value = '',
  onChange,
  className = ''
}) => {
  const [isScrolling, setIsScrolling] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr = [];
    for (let y = currentYear; y >= 1920; y--) {
      arr.push(y);
    }
    return arr;
  }, [currentYear]);

  const parseValue = useCallback((val) => {
    if (val && typeof val === 'string') {
      const parts = val.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return { year: y, month: m, day: d };
        }
      }
    }
    return { year: 2000, month: 1, day: 1 };
  }, []);

  const initial = useMemo(() => parseValue(value), [parseValue, value]);

  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState(initial.day);

  // Sync state if external value changes
  useEffect(() => {
    if (value) {
      const parsed = parseValue(value);
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
    }
  }, [value, parseValue]);

  // Dynamic days count
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const daysList = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d);
    }
    return arr;
  }, [daysInMonth]);

  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  // Emit change on date change
  useEffect(() => {
    const safeDay = Math.min(selectedDay, daysInMonth);
    const formatted = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    if (formatted !== value) {
      onChange(formatted);
    }
  }, [selectedYear, selectedMonth, selectedDay, daysInMonth, onChange, value]);

  const yearIndex = useMemo(() => {
    const idx = years.indexOf(selectedYear);
    return idx !== -1 ? idx : 0;
  }, [years, selectedYear]);

  const monthIndex = useMemo(() => {
    return Math.max(0, Math.min(11, selectedMonth - 1));
  }, [selectedMonth]);

  const dayIndex = useMemo(() => {
    return Math.max(0, Math.min(daysList.length - 1, selectedDay - 1));
  }, [daysList.length, selectedDay]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border transition-all ${className}`}
      style={{
        background: '#13141A',
        borderColor: isScrolling ? '#FF2A85' : '#331B39',
        boxShadow: isScrolling
          ? '0 0 15px rgba(255, 42, 133, 0.35), inset 0 0 10px rgba(255, 42, 133, 0.1)'
          : '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 0 6px rgba(255, 42, 133, 0.05)'
      }}
    >
      {/* Main Wheel Area */}
      <div className="relative px-3 py-2">
        {/* Active Selection Crossbar Window */}
        <div
          className="absolute left-2 right-2 pointer-events-none z-20 rounded-lg transition-all duration-150"
          style={{
            top: 'calc(50% + 8px)',
            height: ITEM_HEIGHT,
            transform: 'translateY(-50%)',
            background: 'linear-gradient(90deg, rgba(255, 42, 133, 0.06) 0%, rgba(255, 0, 128, 0.18) 50%, rgba(255, 42, 133, 0.06) 100%)',
            borderTop: '1px solid rgba(255, 42, 133, 0.8)',
            borderBottom: '1px solid rgba(255, 42, 133, 0.8)',
            boxShadow: '0 0 10px rgba(255, 42, 133, 0.35)'
          }}
        >
          {/* Neon side corner brackets in Vice City Pink */}
          <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#FF2A85] rounded-full shadow-[0_0_6px_#FF2A85]" />
          <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#FF2A85] rounded-full shadow-[0_0_6px_#FF2A85]" />
        </div>

        {/* Top Vignette Depth Overlay */}
        <div
          className="absolute left-0 right-0 top-6 pointer-events-none z-10"
          style={{
            height: ITEM_HEIGHT,
            background: 'linear-gradient(to bottom, #13141A 15%, transparent 100%)'
          }}
        />

        {/* Bottom Vignette Depth Overlay */}
        <div
          className="absolute left-0 right-0 bottom-0 pointer-events-none z-10"
          style={{
            height: ITEM_HEIGHT,
            background: 'linear-gradient(to top, #13141A 15%, transparent 100%)'
          }}
        />

        {/* Three Drum Columns: Day | Month | Year */}
        <div className="flex items-center gap-2 relative z-0">
          <DrumColumn
            items={daysList}
            selectedIndex={dayIndex}
            onSelect={(idx) => setSelectedDay(daysList[idx])}
            label="Day"
            formatItem={(d) => String(d).padStart(2, '0')}
            setIsScrolling={setIsScrolling}
          />

          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-[#FF2A85]/30 to-transparent relative z-20 shrink-0" />

          <DrumColumn
            items={MONTHS}
            selectedIndex={monthIndex}
            onSelect={(idx) => setSelectedMonth(MONTHS[idx].value)}
            label="Month"
            formatItem={(m) => m.name.toUpperCase()}
            setIsScrolling={setIsScrolling}
          />

          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-[#FF2A85]/30 to-transparent relative z-20 shrink-0" />

          <DrumColumn
            items={years}
            selectedIndex={yearIndex}
            onSelect={(idx) => setSelectedYear(years[idx])}
            label="Year"
            formatItem={(y) => String(y)}
            setIsScrolling={setIsScrolling}
          />
        </div>
      </div>
    </div>
  );
};

export default ScrollableDobPicker;
