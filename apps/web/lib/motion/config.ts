/**
 * Motion configuration for consistent animations throughout the app
 * Inspired by Duolingo's reactive, playful feel
 */

// Spring presets for react-spring
export const SPRING_PRESETS = {
  // Snappy, responsive feel for buttons and immediate feedback
  snappy: { tension: 400, friction: 22 },

  // Bouncy entrance animations
  bouncy: { tension: 300, friction: 10 },

  // Gentle, smooth transitions for larger elements
  gentle: { tension: 170, friction: 26 },

  // Stiff for quick snaps
  stiff: { tension: 500, friction: 30 },

  // Wobbly for playful celebrations
  wobbly: { tension: 180, friction: 12 },

  // Molasses for slow, intentional animations
  molasses: { tension: 120, friction: 30 },
} as const;

// Animation durations in ms
export const DURATIONS = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 400,
  gentle: 600,
} as const;

// Stagger delays for list animations
export const STAGGER = {
  fast: 30,
  normal: 50,
  slow: 80,
} as const;

// Easing functions for CSS animations
export const EASINGS = {
  // For most animations - smooth deceleration
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  // For bouncy effects
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  // For subtle entrances
  gentle: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // For snappy feedback
  snappy: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

// Z-index layers for overlays and modals
export const Z_LAYERS = {
  base: 0,
  dropdown: 10,
  modal: 50,
  toast: 60,
  tooltip: 70,
  success: 80,
  spotlight: 100,
} as const;

// Success animation configuration
export const SUCCESS_ANIMATION = {
  // Duration of the success flash
  flashDuration: 300,
  // Duration of the checkmark animation
  checkDuration: 400,
  // How long to show the success state
  displayDuration: 1000,
} as const;

// Subtle spring presets for professional, refined animations
// More subdued than standard presets - "felt, not seen"
export const SUBTLE_PRESETS = {
  // Barely perceptible feedback
  whisper: { tension: 300, friction: 28 },

  // Smooth professional transitions
  professional: { tension: 220, friction: 26 },

  // Quick acknowledgment without drama
  acknowledge: { tension: 350, friction: 30 },

  // Gentle entrance for data appearing
  emerge: { tension: 200, friction: 24 },
} as const;

// Subtle animation values for micro-interactions
export const SUBTLE_VALUES = {
  // Scale amounts (smaller = more subtle)
  pressScale: 0.98,
  hoverScale: 1.01,
  successPulse: 1.02,

  // Movement distances in pixels
  slideDistance: 8,
  fadeInY: 4,

  // Timing in ms
  quickFeedback: 80,
  normalTransition: 180,
} as const;

// Milestone thresholds for progress animations
export const MILESTONES = {
  warning: 0.8,  // 80% - amber pulse
  critical: 1.0, // 100% - celebration or alert
  halfway: 0.5,  // 50% - subtle acknowledgment
} as const;
