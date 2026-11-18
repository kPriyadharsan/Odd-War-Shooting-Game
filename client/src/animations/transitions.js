import gsap from 'gsap';

/**
 * GSAP & Framer Motion Animation Presets Foundation
 */
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
};

export const pulseAnimation = (elementRef) => {
  if (elementRef.current) {
    gsap.to(elementRef.current, {
      scale: 1.05,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    });
  }
};
