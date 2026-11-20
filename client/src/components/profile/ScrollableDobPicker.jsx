import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronUp, ChevronDown, Calendar, Lock } from 'lucide-react';

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

const ITEM_HEIGHT = 44; // pixels per item row
const VISIBLE_ROWS = 5; // 2 above, 1 center, 2 below
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS; // 220px

/**
 * Individual 3D cylindrical drum wheel column.
 */
const DrumColumn = ({
  items,
  selectedIndex,
  onSelect,
  label,
  formatItem = (item) => String(item),
  isScrolling,
  setIsScrolling
}) => {
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isProgrammaticScroll = useRef(false);

  // Sync scroll position when selectedIndex changes externally
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
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedIndex]);

  // Handle user scroll and snap to nearest item
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

      // Snap neatly to item boundary
      container.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: 'smooth'
      });

      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
    }, 120);
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

  const handleStep = (direction) => {
    const newIndex = Math.max(0, Math.min(items.length - 1, selectedIndex + direction));
    handleItemClick(newIndex);
  };

  return (
    <div className="flex-1 flex flex-col items-center select-none relative group">
      {/* Column header label */}
      <div className="text-[10px] font-mono tracking-widest uppercase text-[#FF54A5] font-bold mb-1 opacity-90 flex items-center gap-1">
        <span>{label}</span>
      </div>

      {/* Up Nudge Arrow */}
      <button
        type="button"
        onClick={() => handleStep(-1)}
        disabled={selectedIndex <= 0}
        aria-label={`Previous ${label}`}
        className="w-full py-0.5 text-zinc-500 hover:text-[#FF2A85] disabled:opacity-20 transition-colors flex items-center justify-center cursor-pointer"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      {/* Drum Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: PICKER_HEIGHT,
          scrollSnapType: 'y mandatory',
          perspective: '500px',
          perspectiveOrigin: 'center center'
        }}
        className="w-full overflow-y-auto no-scrollbar relative focus:outline-none"
      >
        {/* Top Spacer for 2 rows */}
        <div style={{ height: ITEM_HEIGHT * 2 }} />

        {items.map((item, idx) => {
          const offset = idx - selectedIndex;
          const isSelected = offset === 0;
          const distance = Math.abs(offset);

          // 3D Depth transform calculations
          let rotateX = 0;
          let scale = 1;
          let opacity = 1;

          if (distance === 0) {
            scale = 1.1;
            opacity = 1;
            rotateX = 0;
          } else if (distance === 1) {
            scale = 0.92;
            opacity = 0.55;
            rotateX = offset > 0 ? -24 : 24;
          } else if (distance === 2) {
            scale = 0.8;
            opacity = 0.25;
            rotateX = offset > 0 ? -42 : 42;
          } else {
            scale = 0.65;
            opacity = 0.08;
            rotateX = offset > 0 ? -55 : 55;
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
                transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.18s ease, color 0.18s ease',
                transformStyle: 'preserve-3d'
              }}
              className={`flex items-center justify-center font-mono cursor-pointer transition-all ${
                isSelected
                  ? 'text-white font-extrabold text-base tracking-wider'
                  : 'text-zinc-400 font-semibold text-sm hover:text-pink-200'
              }`}
            >
              <span
                style={{
                  textShadow: isSelected
                    ? '0 0 10px #FF2A85, 0 0 20px #FF007F, 0 0 30px rgba(255, 42, 133, 0.6)'
                    : 'none'
                }}
              >
                {formatItem(item)}
              </span>
            </div>
          );
        })}

        {/* Bottom Spacer for 2 rows */}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>

      {/* Down Nudge Arrow */}
      <button
        type="button"
        onClick={() => handleStep(1)}
        disabled={selectedIndex >= items.length - 1}
        aria-label={`Next ${label}`}
        className="w-full py-0.5 text-zinc-500 hover:text-[#FF2A85] disabled:opacity-20 transition-colors flex items-center justify-center cursor-pointer"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/**
 * ScrollableDobPicker
 * Features:
 * - 3D cylindrical drum wheels for Day, Month, Year.
 * - GTA 6 Neon Pink tone effect with vibrant glow during scrolling and selection.
 * - Dynamic leap-year and month-length auto-correction.
 * - Seamless integration with standard YYYY-MM-DD date format.
 */
export const ScrollableDobPicker = ({
  value = '',
  onChange,
  className = ''
}) => {
  const [isScrolling, setIsScrolling] = useState(false);

  // Available Years: 1920 to current year
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr = [];
    for (let y = currentYear; y >= 1920; y--) {
      arr.push(y);
    }
    return arr;
  }, [currentYear]);

  // Parse incoming value (YYYY-MM-DD) or default to ~year 2000
  const initialDate = useMemo(() => {
    if (value && typeof value === 'string') {
      const parts = value.split('-');
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
  }, [value]);

  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);

  // Calculate days in current month & year
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

  // Ensure day doesn't exceed days in month
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  // Broadcast change whenever year, month, or day updates
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

  const selectedMonthObj = MONTHS[monthIndex];

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 transition-all ${className}`}
      style={{
        background: 'linear-gradient(145deg, #181920 0%, #201324 50%, #15161C 100%)',
        borderColor: isScrolling ? '#FF2A85' : '#3E2445',
        boxShadow: isScrolling
          ? '0 0 25px rgba(255, 42, 133, 0.4), 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(255, 42, 133, 0.15)'
          : '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 42, 133, 0.08)'
      }}
    >
      {/* Background Neon Glow Pulse */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 42, 133, 0.12) 0%, rgba(255, 0, 127, 0.04) 50%, transparent 80%)',
          opacity: isScrolling ? 1 : 0.6
        }}
      />

      {/* Top Header Bar: Neon Title & Preview */}
      <div className="relative z-10 px-4 py-2.5 border-b border-[#3E2445] bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF2A85] animate-pulse shadow-[0_0_8px_#FF2A85]" />
          <span className="text-[11px] font-mono tracking-wider font-bold text-[#FF85C0] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#FF2A85]" />
            <span>GTA VI Pink Cylinder Drum</span>
          </span>
        </div>

        {/* Selected Date Summary Tag */}
        <div className="px-2.5 py-0.5 rounded-full bg-[#FF2A85]/15 border border-[#FF2A85]/50 text-[#FFD6EC] font-mono text-xs font-bold shadow-[0_0_10px_rgba(255,42,133,0.3)]">
          {selectedMonthObj?.full} {selectedDay}, {selectedYear}
        </div>
      </div>

      {/* Main Wheel Area */}
      <div className="relative p-3 sm:p-4">
        {/* Central Cylindrical Active Crossbar (Selection Window) */}
        <div
          className="absolute left-3 right-3 sm:left-4 sm:right-4 pointer-events-none z-20 rounded-xl transition-all duration-200"
          style={{
            top: '50%',
            height: ITEM_HEIGHT,
            transform: 'translateY(-50%)',
            background: 'linear-gradient(90deg, rgba(255, 42, 133, 0.08) 0%, rgba(255, 0, 128, 0.22) 50%, rgba(255, 42, 133, 0.08) 100%)',
            borderTop: '1.5px solid rgba(255, 42, 133, 0.85)',
            borderBottom: '1.5px solid rgba(255, 42, 133, 0.85)',
            boxShadow: '0 0 14px rgba(255, 42, 133, 0.45), inset 0 0 10px rgba(255, 42, 133, 0.25)'
          }}
        >
          {/* Neon side corner brackets in Vice City Pink */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#FF2A85] rounded-full shadow-[0_0_8px_#FF2A85]" />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#FF2A85] rounded-full shadow-[0_0_8px_#FF2A85]" />
        </div>

        {/* Top Gradient Vignette Overlay (Depth effect falloff) */}
        <div
          className="absolute left-0 right-0 top-0 pointer-events-none z-10"
          style={{
            height: ITEM_HEIGHT * 2,
            background: 'linear-gradient(to bottom, #181920 15%, rgba(24, 25, 32, 0.7) 60%, transparent 100%)'
          }}
        />

        {/* Bottom Gradient Vignette Overlay (Depth effect falloff) */}
        <div
          className="absolute left-0 right-0 bottom-0 pointer-events-none z-10"
          style={{
            height: ITEM_HEIGHT * 2,
            background: 'linear-gradient(to top, #15161C 15%, rgba(21, 22, 28, 0.7) 60%, transparent 100%)'
          }}
        />

        {/* Three Drum Columns Grid: Day | Month | Year */}
        <div className="flex items-center gap-2 sm:gap-4 relative z-0">
          {/* 1. Day Column */}
          <DrumColumn
            items={daysList}
            selectedIndex={dayIndex}
            onSelect={(idx) => setSelectedDay(daysList[idx])}
            label="Day"
            formatItem={(d) => String(d).padStart(2, '0')}
            isScrolling={isScrolling}
            setIsScrolling={setIsScrolling}
          />

          {/* Divider */}
          <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-[#FF2A85]/40 to-transparent relative z-20 shrink-0" />

          {/* 2. Month Column */}
          <DrumColumn
            items={MONTHS}
            selectedIndex={monthIndex}
            onSelect={(idx) => setSelectedMonth(MONTHS[idx].value)}
            label="Month"
            formatItem={(m) => m.name.toUpperCase()}
            isScrolling={isScrolling}
            setIsScrolling={setIsScrolling}
          />

          {/* Divider */}
          <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-[#FF2A85]/40 to-transparent relative z-20 shrink-0" />

          {/* 3. Year Column */}
          <DrumColumn
            items={years}
            selectedIndex={yearIndex}
            onSelect={(idx) => setSelectedYear(years[idx])}
            label="Year"
            formatItem={(y) => String(y)}
            isScrolling={isScrolling}
            setIsScrolling={setIsScrolling}
          />
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-2 bg-black/50 border-t border-[#3E2445]/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span className="flex items-center gap-1.5 text-zinc-400">
          <Lock className="w-3 h-3 text-[#FF54A5]" />
          <span>Strictly Private & Confidential</span>
        </span>
        <span className="text-[#FF85C0] font-semibold text-[10px]">
          Scroll or click to rotate
        </span>
      </div>
    </div>
  );
};

export default ScrollableDobPicker;
