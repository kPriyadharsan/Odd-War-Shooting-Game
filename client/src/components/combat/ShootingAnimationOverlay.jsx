import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ShootingAnimationOverlay Component (Task 10)
 * 2D SVG pencil-bullet projectile flight and impact burst animation across the notebook page.
 */
export const ShootingAnimationOverlay = ({ isActive = false, onAnimationComplete = () => {} }) => {
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
          <motion.div
            initial={{ opacity: 0.15 }}
            animate={{ opacity: [0.2, 0, 0.1, 0] }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-[#CE4242]/20"
          />

          {/* SVG Projectile Trajectory */}
          <svg className="w-full h-full absolute inset-0">
            {/* Flying Pencil Bullet Streak */}
            <motion.g
              initial={{ x: '15vw', y: '50vh', scale: 0.6 }}
              animate={{
                x: ['15vw', '50vw', '75vw'],
                y: ['50vh', '48vh', '52vh'],
                scale: [0.6, 1.2, 1.5]
              }}
              transition={{ duration: 0.5, ease: 'easeIn' }}
              onAnimationComplete={onAnimationComplete}
            >
              {/* Bullet Smoke Trail */}
              <line
                x1="-60"
                y1="0"
                x2="0"
                y2="0"
                stroke="#242730"
                strokeWidth="4"
                strokeDasharray="6 3"
                opacity="0.7"
              />
              {/* Pencil Lead Projectile */}
              <polygon points="0,-6 20,0 0,6" fill="#242730" />
              <circle cx="2" cy="0" r="4" fill="#CE4242" />
            </motion.g>

            {/* Impact Pencil Burst (Explosion) */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 0.9, 0], opacity: [0, 1, 0.8, 0] }}
              transition={{ delay: 0.45, duration: 0.45 }}
              style={{ transformOrigin: '75vw 52vh' }}
            >
              {/* Starburst rays */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <line
                  key={i}
                  x1="75vw"
                  y1="52vh"
                  x2={`calc(75vw + ${Math.cos((angle * Math.PI) / 180) * 35}px)`}
                  y2={`calc(52vh + ${Math.sin((angle * Math.PI) / 180) * 35}px)`}
                  stroke="#CE4242"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              ))}
              <circle cx="75vw" cy="52vh" r="14" fill="#FFD166" opacity="0.9" />
              <circle cx="75vw" cy="52vh" r="7" fill="#CE4242" />
            </motion.g>
          </svg>

          {/* On-Hit Comic Book Sound Text: "BANG!" */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="absolute left-[72vw] top-[46vh] font-handwriting text-3xl sm:text-4xl font-black text-[#CE4242] drop-shadow-sm select-none"
          >
            STRIKE!
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
