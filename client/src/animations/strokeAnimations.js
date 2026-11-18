import gsap from 'gsap';

/**
 * Notebook & Pencil Stroke Animation Utilities
 * Built on Framer Motion and GSAP.
 */

// Framer Motion spring presets for natural notebook interactions
export const notebookSpring = {
  type: 'spring',
  stiffness: 400,
  damping: 25
};

// Smooth paper entrance variants
export const paperEntranceVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

// Interactive button feedback variants (playful pencil press)
export const buttonPressVariants = {
  hover: {
    y: -2,
    boxShadow: '3px 3px 0px #23252A',
    transition: { duration: 0.15 }
  },
  tap: {
    y: 1,
    x: 1,
    boxShadow: '0px 0px 0px #23252A',
    transition: { duration: 0.05 }
  }
};

// Secondary button feedback (subtle pencil border shift)
export const secondaryPressVariants = {
  hover: {
    y: -1,
    boxShadow: '2px 2px 0px #9C9486',
    transition: { duration: 0.15 }
  },
  tap: {
    y: 1,
    x: 1,
    boxShadow: '0px 0px 0px #9C9486',
    transition: { duration: 0.05 }
  }
};

/**
 * GSAP Pencil-Stroke Reveal Utility
 * Animates any SVG path or collection of paths using stroke-dasharray/stroke-dashoffset.
 *
 * @param {SVGPathElement|SVGPathElement[]|string} target - DOM path element or selector
 * @param {Object} options - animation options (duration, ease, onComplete)
 */
export const animatePencilStroke = (target, options = {}) => {
  const elements = typeof target === 'string' 
    ? document.querySelectorAll(target) 
    : (Array.isArray(target) ? target : [target]);

  const timeline = gsap.timeline({ onComplete: options.onComplete });

  elements.forEach((path) => {
    if (!path || typeof path.getTotalLength !== 'function') return;

    const length = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length,
      opacity: 1
    });

    timeline.to(
      path,
      {
        strokeDashoffset: 0,
        duration: options.duration || 1.2,
        ease: options.ease || 'power2.inOut',
        stagger: options.stagger || 0.15
      },
      options.position || '<0.1'
    );
  });

  return timeline;
};
