
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

const ITEM_HEIGHT = 34;
const VISIBLE_ROWS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif';

/* Apple-inspired 3D wheel column */
const DrumColumn = ({
  items,
  selectedIndex,
  onSelect,
  formatItem = (item) => String(item)
}) => {
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const programmaticRef = useRef(false);
  const previousIndexRef = useRef(selectedIndex);
  const isScrollingRef = useRef(false);

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(
    selectedIndex * ITEM_HEIGHT
  );

  // Synchronize selection with scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (previousIndexRef.current !== selectedIndex) {
      previousIndexRef.current = selectedIndex;
      programmaticRef.current = true;

      container.scrollTo({
        top: selectedIndex * ITEM_HEIGHT,
        behavior: 'smooth'
      });

      const timer = setTimeout(() => {
        programmaticRef.current = false;
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [selectedIndex]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Handle natural wheel scrolling
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setScrollPosition(container.scrollTop);

    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      setIsScrolling(true);
    }

    if (programmaticRef.current) return;

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const index = Math.max(
        0,
        Math.min(
          items.length - 1,
          Math.round(container.scrollTop / ITEM_HEIGHT)
        )
      );

      isScrollingRef.current = false;
      setIsScrolling(false);

      if (index !== selectedIndex) {
        onSelect(index);
      }

      container.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth'
      });
    }, 130);
  }, [items.length, selectedIndex, onSelect]);

  const handleClick = (index) => {
    onSelect(index);

    containerRef.current?.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: 'smooth'
    });
  };

  return (
    <div
      className="flex-1 min-w-0 relative"
      style={{
        perspective: '500px',
        perspectiveOrigin: 'center center'
      }}
    >
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full overflow-y-auto overscroll-contain"
        style={{
          height: PICKER_HEIGHT,
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          transformStyle: 'preserve-3d',
          touchAction: 'pan-y'
        }}
      >
        <div style={{ height: ITEM_HEIGHT }} />

        {items.map((item, index) => {
          const position =
            (index * ITEM_HEIGHT - scrollPosition) / ITEM_HEIGHT;

          const distance = Math.abs(position);
          const selected = distance < 0.15;

          const rotateX = Math.max(
            -32,
            Math.min(32, position * -9)
          );

          const scale = Math.max(
            0.88,
            1.04 - distance * 0.035
          );

          const opacity = Math.max(
            0.52,
            1 - distance * 0.16
          );

          const fontSize = isScrolling
            ? Math.max(16, 20 - distance * 0.5)
            : selected
              ? 21
              : Math.max(16, 18 - distance * 0.35);

          return (
            <div
              key={index}
              onClick={() => handleClick(index)}
              className="flex items-center justify-center cursor-pointer select-none"
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: 'center',
                fontFamily: FONT_STACK,
                fontSize: `${fontSize}px`,
                fontWeight: selected ? 600 : 450,
                letterSpacing: '-0.4px',
                color: selected ? '#1c1c1e' : '#77777e',
                opacity,
                transform: `
                  perspective(500px)
                  rotateX(${rotateX}deg)
                  scale(${scale})
                  translateZ(${selected ? 4 : 0}px)
                `,
                transformOrigin: 'center center',
                transition: isScrolling
                  ? 'none'
                  : 'transform 180ms ease, opacity 180ms ease, color 180ms ease',
                whiteSpace: 'nowrap',
                backfaceVisibility: 'hidden',
                WebkitFontSmoothing: 'antialiased'
              }}
            >
              {formatItem(item)}
            </div>
          );
        })}

        <div style={{ height: ITEM_HEIGHT }} />
      </div>
    </div>
  );
};

/* Main Date Picker */
export const ScrollableDobPicker = ({
  value = '',
  onChange,
  className = ''
}) => {
  const parseValue = useCallback((val) => {
    if (typeof val === 'string') {
      const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        if (
          year >= 1920 &&
          year <= new Date().getFullYear() &&
          month >= 1 &&
          month <= 12 &&
          day >= 1 &&
          day <= new Date(year, month, 0).getDate()
        ) {
          return { year, month, day };
        }
      }
    }

    return { year: 2000, month: 1, day: 1 };
  }, []);

  const initial = useMemo(
    () => parseValue(value),
    [value, parseValue]
  );

  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState(initial.day);

  const currentYear = new Date().getFullYear();

  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1919 },
        (_, i) => currentYear - i
      ),
    [currentYear]
  );

  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth, 0).getDate(),
    [selectedYear, selectedMonth]
  );

  const days = useMemo(
    () =>
      Array.from(
        { length: daysInMonth },
        (_, i) => i + 1
      ),
    [daysInMonth]
  );

  // Sync external value changes
  useEffect(() => {
    if (!value) return;

    const parsed = parseValue(value);

    setSelectedYear(parsed.year);
    setSelectedMonth(parsed.month);
    setSelectedDay(parsed.day);
  }, [value, parseValue]);

  // Leap year and month correction
  useEffect(() => {
    setSelectedDay((previous) =>
      Math.min(previous, daysInMonth)
    );
  }, [daysInMonth]);

  // Emit formatted date
  useEffect(() => {
    const safeDay = Math.min(selectedDay, daysInMonth);

    const formatted = [
      selectedYear,
      String(selectedMonth).padStart(2, '0'),
      String(safeDay).padStart(2, '0')
    ].join('-');

    if (formatted !== value) {
      onChange?.(formatted);
    }
  }, [
    selectedYear,
    selectedMonth,
    selectedDay,
    daysInMonth,
    value,
    onChange
  ]);

  const yearIndex = Math.max(
    0,
    years.indexOf(selectedYear)
  );

  const monthIndex = selectedMonth - 1;
  const dayIndex = selectedDay - 1;

  return (
    <div
      className={`
        relative
        w-[65%]
        max-sm:w-[90%]
        max-w-[420px]
        mx-auto
        ${className}
      `}
      style={{
        fontFamily: FONT_STACK,
        WebkitFontSmoothing: 'antialiased',
        textRendering: 'optimizeLegibility'
      }}
    >
      <div
        className="relative flex items-center justify-center gap-1 sm:gap-3 px-1"
        style={{
          height: PICKER_HEIGHT,
          perspective: '600px'
        }}
      >
        {/* Minimal selected row highlight */}
        <div
          className="absolute pointer-events-none z-0"
          style={{
            left: 4,
            right: 4,
            top: '50%',
            height: ITEM_HEIGHT,
            transform: 'translateY(-50%)',
            background: 'rgba(120, 120, 128, 0.09)',
            borderRadius: 10
          }}
        />

        {/* DAY */}
        <div className="relative z-10 flex-1 min-w-0">
          <DrumColumn
            items={days}
            selectedIndex={dayIndex}
            onSelect={(index) =>
              setSelectedDay(days[index])
            }
            formatItem={(day) =>
              String(day).padStart(2, '0')
            }
          />
        </div>

        {/* MONTH */}
        <div className="relative z-10 flex-1 min-w-0">
          <DrumColumn
            items={MONTHS}
            selectedIndex={monthIndex}
            onSelect={(index) =>
              setSelectedMonth(index + 1)
            }
            formatItem={(month) =>
              month.slice(0, 3)
            }
          />
        </div>

        {/* YEAR */}
        <div className="relative z-10 flex-1 min-w-0">
          <DrumColumn
            items={years}
            selectedIndex={yearIndex}
            onSelect={(index) =>
              setSelectedYear(years[index])
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ScrollableDobPicker;
