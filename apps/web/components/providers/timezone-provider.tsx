"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";

interface TimezoneContextValue {
  /**
   * User's current timezone (e.g., "America/New_York")
   */
  timezone: string;

  /**
   * Update the user's timezone
   * Note: This only updates the client-side context.
   * To persist, you must also call the updateSettings server action.
   */
  updateTimezone: (timezone: string) => void;

  /**
   * Whether the timezone has been loaded
   */
  isLoaded: boolean;
}

const TimezoneContext = createContext<TimezoneContextValue | undefined>(undefined);

interface TimezoneProviderProps {
  children: ReactNode;
  /**
   * Initial timezone from user settings
   * If not provided, defaults to UTC
   */
  initialTimezone?: string;
}

/**
 * Timezone Provider
 *
 * Provides the user's timezone to all child components via React context.
 * The timezone is used throughout the app for displaying and storing dates correctly.
 *
 * @example
 * // In your root layout:
 * <TimezoneProvider initialTimezone={userSettings.timezone}>
 *   {children}
 * </TimezoneProvider>
 *
 * // In components:
 * const { timezone } = useTimezone();
 * const date = dateUtils.formatDate(timestamp, timezone, "PPP");
 */
export function TimezoneProvider({ children, initialTimezone }: TimezoneProviderProps) {
  const [timezone, setTimezone] = useState<string>(initialTimezone ?? DEFAULT_TIMEZONE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set timezone from initial prop
    if (initialTimezone) {
      setTimezone(initialTimezone);
    }
    setIsLoaded(true);
  }, [initialTimezone]);

  const updateTimezone = (newTimezone: string) => {
    setTimezone(newTimezone);
  };

  return (
    <TimezoneContext.Provider value={{ timezone, updateTimezone, isLoaded }}>
      {children}
    </TimezoneContext.Provider>
  );
}

/**
 * Hook to access the current user's timezone
 *
 * @returns Timezone context value with timezone and update function
 * @throws Error if used outside of TimezoneProvider
 *
 * @example
 * function MyComponent() {
 *   const { timezone, updateTimezone } = useTimezone();
 *
 *   const formattedDate = dateUtils.formatDate(
 *     expense.occurred_at,
 *     timezone,
 *     "PPP"
 *   );
 *
 *   return <div>{formattedDate}</div>;
 * }
 */
export function useTimezone(): TimezoneContextValue {
  const context = useContext(TimezoneContext);

  if (context === undefined) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }

  return context;
}

/**
 * Optional hook that returns timezone or a default if provider is not available
 * Useful for components that may be rendered outside the provider during testing
 */
export function useTimezoneOptional(): string {
  const context = useContext(TimezoneContext);
  return context?.timezone ?? DEFAULT_TIMEZONE;
}
