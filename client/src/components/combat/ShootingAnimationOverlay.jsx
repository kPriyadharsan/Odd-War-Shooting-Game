import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ShootingAnimationOverlay Component (Tasks 10 & 12)
 * 2D SVG pencil-bullet projectile flight and impact burst animation across the notebook page.
 * Respects prefers-reduced-motion and provides cinematic graphite paper combat feel.
 */
export const ShootingAnimationOverlay = ({ isActive = false, onAnimationComplete = () => {} }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden"
        >
          {/* Subtle paper shake screen flash */}
          {!prefersReducedMotion && (
            <motion.div
              initial={{ opacity: 0.15 }}
              animate={{ opacity: [0.25, 0, 0.15, 0] }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 bg-[#CE4242]/20"
            />
          )}

          {/* SVG Projectile Trajectory */}
          <svg className="w-full h-full absolute inset-0">
            {/* Flying Pencil Bullet Streak (from left territory 25% across to right territory 75%) */}
            <motion.g
              initial={{ x: '22vw', y: '50vh', scale: 0.7 }}
              animate={
                prefersReducedMotion
                  ? { x: '75vw', y: '52vh', scale: 1.2 }
                  : {
                      x: ['22vw', '50vw', '75vw'],
                      y: ['50vh', '48vh', '52vh'],
                      scale: [0.7, 1.2, 1.5]
                    }
              }
              transition={{ duration: prefersReducedMotion ? 0.2 : 0.5, ease: 'easeIn' }}
              onAnimationComplete={onAnimationComplete}
            >
              {/* Bullet Smoke & Graphite Trail */}
              <line
                x1="-70"
                y1="0"
                x2="0"
                y2="0"
                stroke="#242730"
                strokeWidth="4"
                strokeDasharray="6 3"
                opacity="0.8"
              />
              <line
                x1="-90"
                y1="-2"
                x2="-30"
                y2="-2"
                stroke="#8C929D"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              {/* Pencil Lead Projectile */}
              <polygon points="0,-7 22,0 0,7" fill="#242730" />
              <circle cx="2" cy="0" r="4.5" fill="#CE4242" />
            </motion.g>

            {/* Impact Pencil Burst (Explosion) */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1, 0], opacity: [0, 1, 0.8, 0] }}
              transition={{ delay: prefersReducedMotion ? 0.15 : 0.45, duration: 0.45 }}
              style={{ transformOrigin: '75vw 52vh' }}
            >
              {/* Starburst rays */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <line
                  key={i}
                  x1="75vw"
                  y1="52vh"
                  x2={`calc(75vw + ${Math.cos((angle * Math.PI) / 180) * (i % 2 === 0 ? 38 : 24)}px)`}
                  y2={`calc(52vh + ${Math.sin((angle * Math.PI) / 180) * (i % 2 === 0 ? 38 : 24)}px)`}
                  stroke={i % 2 === 0 ? '#CE4242' : '#242730'}
                  strokeWidth={i % 2 === 0 ? '3.5' : '2'}
                  strokeLinecap="round"
                />
              ))}
              <circle cx="75vw" cy="52vh" r="15" fill="#FFD166" opacity="0.9" />
              <circle cx="75vw" cy="52vh" r="8" fill="#CE4242" />
            </motion.g>
          </svg>

          {/* On-Hit Comic Book Sound Text: "STRIKE!" */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0] }}
            transition={{ delay: prefersReducedMotion ? 0.15 : 0.45, duration: 0.55 }}
            className="absolute left-[70vw] top-[44vh] font-handwriting text-3xl sm:text-5xl font-black text-[#CE4242] drop-shadow-md select-none tracking-wider"
          >
            STRIKE!
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
