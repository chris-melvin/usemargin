"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { CONFETTI_CONFIG, STORAGE_KEYS } from "@/lib/onboarding/constants";

/**
 * Comprehensive micro-interactions hook for Duolingo-style reactive feel
 * Provides sounds, haptic feedback, confetti, and animation utilities
 */
export function useMicroInteractions() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(true);
  const [isReady, setIsReady] = useState(false);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        setIsReady(true);
      }
    };

    // Check localStorage for sound preference
    const stored = localStorage.getItem(STORAGE_KEYS.soundEnabled);
    if (stored !== null) {
      soundEnabledRef.current = stored === "true";
    }

    // Initialize on any interaction
    const events = ["click", "keydown", "touchstart"];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, []);

  /**
   * Play a synthesized sound effect
   */
  const playSound = useCallback(
    (type: "pop" | "whoosh" | "success" | "click" | "error" | "coin" | "swipe") => {
      if (!soundEnabledRef.current || !audioContextRef.current) return;

      const ctx = audioContextRef.current;

      try {
        switch (type) {
          case "pop": {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
            break;
          }

          case "whoosh": {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
            break;
          }

          case "success": {
            // Pleasant ascending chord (C5, E5, G5)
            const frequencies = [523.25, 659.25, 783.99];
            frequencies.forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, ctx.currentTime);
              gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.05);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
              osc.start(ctx.currentTime + i * 0.05);
              osc.stop(ctx.currentTime + 0.5);
            });
            break;
          }

          case "click": {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.03);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.03);
            break;
          }

          case "error": {
            // Descending buzzy tone
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.type = "sawtooth";
            oscillator.frequency.setValueAtTime(300, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
            break;
          }

          case "coin": {
            // Mario-style coin sound
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.type = "square";
            oscillator.frequency.setValueAtTime(988, ctx.currentTime); // B5
            oscillator.frequency.setValueAtTime(1319, ctx.currentTime + 0.08); // E6
            gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
            break;
          }

          case "swipe": {
            // Quick swipe sound
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(400, ctx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.05);
            break;
          }
        }
      } catch {
        // Silently fail if audio context is suspended
      }
    },
    []
  );

  /**
   * Fire confetti celebration
   */
  const fireConfetti = useCallback((intensity: "small" | "medium" | "large" = "medium") => {
    const configs = {
      small: { particleCount: 30, spread: 40 },
      medium: { particleCount: 80, spread: 60 },
      large: { particleCount: 150, spread: 80 },
    };

    const config = configs[intensity];

    confetti({
      ...CONFETTI_CONFIG,
      ...config,
      origin: { x: 0.5, y: 0.6 },
    });

    if (intensity !== "small") {
      // Side bursts for medium and large
      setTimeout(() => {
        confetti({
          ...CONFETTI_CONFIG,
          particleCount: config.particleCount / 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
        });
      }, 150);

      setTimeout(() => {
        confetti({
          ...CONFETTI_CONFIG,
          particleCount: config.particleCount / 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
        });
      }, 300);
    }
  }, []);

  /**
   * Fire confetti at a specific element
   */
  const fireConfettiAt = useCallback((element: HTMLElement, color?: string) => {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { x, y },
      colors: color ? [color] : CONFETTI_CONFIG.colors,
      startVelocity: 25,
      gravity: 1.5,
      scalar: 0.8,
    });
  }, []);

  /**
   * Toggle sound effects
   */
  const toggleSound = useCallback(() => {
    soundEnabledRef.current = !soundEnabledRef.current;
    localStorage.setItem(STORAGE_KEYS.soundEnabled, String(soundEnabledRef.current));
    return soundEnabledRef.current;
  }, []);

  /**
   * Trigger haptic feedback (mobile) or visual pulse (desktop)
   */
  const triggerHaptic = useCallback((intensity: "light" | "medium" | "heavy" = "medium") => {
    // Try native haptic feedback
    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30],
      };
      navigator.vibrate(patterns[intensity]);
    }
  }, []);

  /**
   * Success celebration - combines sound, confetti, and haptic
   */
  const celebrate = useCallback((intensity: "small" | "medium" | "large" = "medium") => {
    playSound("success");
    fireConfetti(intensity);
    triggerHaptic(intensity === "small" ? "light" : intensity === "large" ? "heavy" : "medium");
  }, [playSound, fireConfetti, triggerHaptic]);

  /**
   * Quick positive feedback - for small wins like adding an expense
   */
  const quickWin = useCallback(() => {
    playSound("coin");
    triggerHaptic("light");
  }, [playSound, triggerHaptic]);

  return {
    playSound,
    fireConfetti,
    fireConfettiAt,
    toggleSound,
    triggerHaptic,
    celebrate,
    quickWin,
    isReady,
    isSoundEnabled: () => soundEnabledRef.current,
  };
}

// Export type for other components
export type MicroInteractionsReturn = ReturnType<typeof useMicroInteractions>;
