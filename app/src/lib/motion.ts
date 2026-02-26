/**
 * Framer Motion Configurations - Pachanga y Pochola
 * Sprint 4: Rediseño Premium
 * 
 * Configuraciones reutilizables para animaciones
 */

import type { Variants, Transition } from 'framer-motion';

// ========================================
// SPRING CONFIGURATIONS
// ========================================

export const springConfig = {
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
  },
  snappy: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  },
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
  },
  smooth: {
    type: 'spring',
    stiffness: 100,
    damping: 20,
  },
} as const;

// ========================================
// TRANSITION PRESETS
// ========================================

export const transitions = {
  fast: {
    duration: 0.2,
    ease: [0.16, 1, 0.3, 1], // ease-out-expo
  },
  normal: {
    duration: 0.4,
    ease: [0.16, 1, 0.3, 1],
  },
  slow: {
    duration: 0.8,
    ease: [0.16, 1, 0.3, 1],
  },
  spring: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
  },
} as const;

// ========================================
// VARIANTS - FADE
// ========================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.fast,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export const fadeInDown: Variants = {
  hidden: { 
    opacity: 0, 
    y: -20 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
};

export const fadeInScale: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// ========================================
// VARIANTS - SLIDE
// ========================================

export const slideInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -30 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
};

export const slideInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 30 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
};

export const slideUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...transitions.normal,
      duration: 0.5,
    },
  },
};

// ========================================
// VARIANTS - STAGGER
// ========================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// ========================================
// VARIANTS - CARDS & ITEMS
// ========================================

export const cardReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

export const itemReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.fast,
  },
};

// ========================================
// VARIANTS - PAGE TRANSITIONS
// ========================================

export const pageTransition: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.4 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ========================================
// VARIANTS - HERO SECTION
// ========================================

export const heroTextReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const heroParallax = {
  initial: { 
    opacity: 1, 
    scale: 1,
    filter: 'blur(0px)',
  },
  scroll: (progress: number) => ({
    opacity: 1 - progress * 0.8,
    scale: 1 + progress * 0.2,
    filter: `blur(${progress * 10}px)`,
  }),
};

// ========================================
// VARIANTS - MODAL & OVERLAY
// ========================================

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2, delay: 0.1 },
  },
};

export const modalContent: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      delay: 0.1,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
};

// ========================================
// VARIANTS - BUTTON & INTERACTIVE
// ========================================

export const buttonTap = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// ========================================
// VARIANTS - NOTIFICATIONS
// ========================================

export const toastSlideIn: Variants = {
  hidden: { 
    opacity: 0, 
    x: 100,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

// ========================================
// HOOK HELPERS
// ========================================

/**
 * Generate stagger delay for children
 */
export const getStaggerDelay = (index: number, baseDelay: number = 0.1): number => {
  return index * baseDelay;
};

/**
 * Spring animation with custom stiffness/damping
 */
export const createSpring = (stiffness: number, damping: number): Transition => ({
  type: 'spring',
  stiffness,
  damping,
});

/**
 * Easing functions as arrays for Framer Motion
 */
export const easings = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  outBack: [0.34, 1.56, 0.64, 1] as const,
  inOutCubic: [0.65, 0, 0.35, 1] as const,
  springLike: [0.175, 0.885, 0.32, 1.275] as const,
};
