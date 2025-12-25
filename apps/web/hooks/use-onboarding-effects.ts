"use client";

import { useCallback, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { CONFETTI_CONFIG, STORAGE_KEYS } from "@/lib/onboarding/constants";

/**
 * Hook for onboarding sound and visual effects
 */
export function useOnboardingEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(true);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
    };

    // Check localStorage for sound preference
    const stored = localStorage.getItem(STORAGE_KEYS.soundEnabled);
    if (stored !== null) {
      soundEnabledRef.current = stored === "true";
    }

    document.addEventListener("click", initAudio, { once: true });
    document.addEventListener("keydown", initAudio, { once: true });

    return () => {
      document.removeEventListener("click", initAudio);
      document.removeEventListener("keydown", initAudio);
    };
  }, []);

  /**
   * Play a synthesized sound effect
   */
  const playSound = useCallback(
    (type: "pop" | "whoosh" | "success" | "click") => {
      if (!soundEnabledRef.current || !audioContextRef.current) return;

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      switch (type) {
        case "pop":
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;

        case "whoosh":
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;

        case "success":
          // Play a pleasant chord
          const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
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

        case "click":
          oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.03);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.03);
          break;
      }
    },
    []
  );

  /**
   * Fire confetti celebration
   */
  const fireConfetti = useCallback((options?: Partial<confetti.Options>) => {
    confetti({
      ...CONFETTI_CONFIG,
      ...options,
    });

    // Fire a second burst for extra effect
    setTimeout(() => {
      confetti({
        ...CONFETTI_CONFIG,
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        ...options,
      });
    }, 150);

    setTimeout(() => {
      confetti({
        ...CONFETTI_CONFIG,
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        ...options,
      });
    }, 300);
  }, []);

  /**
   * Toggle sound effects
   */
  const toggleSound = useCallback(() => {
    soundEnabledRef.current = !soundEnabledRef.current;
    localStorage.setItem(
      STORAGE_KEYS.soundEnabled,
      String(soundEnabledRef.current)
    );
    return soundEnabledRef.current;
  }, []);

  return {
    playSound,
    fireConfetti,
    toggleSound,
    isSoundEnabled: () => soundEnabledRef.current,
  };
}
