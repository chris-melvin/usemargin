/**
 * Onboarding Constants
 */

// Animation durations (in ms)
export const ANIMATION_DURATION = {
  spotlight: 300,
  tooltip: 400,
  fadeIn: 200,
  fadeOut: 150,
  bounce: 600,
  confetti: 3000,
};

// Z-index layers
export const ONBOARDING_Z_INDEX = {
  spotlight: 9998,
  tooltip: 9999,
  hint: 9997,
};

// Tooltip positioning
export const TOOLTIP_OFFSET = 16; // Gap between tooltip and target element
export const TOOLTIP_PADDING = 16; // Padding from viewport edges
export const ARROW_SIZE = 8;

// Spotlight
export const SPOTLIGHT_PADDING = 8; // Padding around highlighted element
export const SPOTLIGHT_BORDER_RADIUS = 12;

// Sound effects
export const SOUNDS = {
  pop: "/sounds/pop.mp3",
  whoosh: "/sounds/whoosh.mp3",
  success: "/sounds/success.mp3",
  click: "/sounds/click.mp3",
} as const;

// Confetti configuration
export const CONFETTI_CONFIG = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ["#f59e0b", "#78716c", "#10b981", "#3b82f6", "#ec4899"],
};

// Local storage keys (for immediate state updates)
export const STORAGE_KEYS = {
  tourStep: "usemargin_onboarding_step",
  tourCompleted: "usemargin_onboarding_completed",
  soundEnabled: "usemargin_sounds_enabled",
};
