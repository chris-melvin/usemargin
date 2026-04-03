import React, { createContext, useContext } from "react";
import * as Localization from "expo-localization";
import { useSettingsContext } from "./settings-provider";

interface TimezoneContextType {
  timezone: string;
}

const TimezoneContext = createContext<TimezoneContextType>({
  timezone: "UTC",
});

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettingsContext();
  const deviceTimezone = Localization.getCalendars()[0]?.timeZone ?? "UTC";
  const timezone = settings.timezone || deviceTimezone;

  return (
    <TimezoneContext.Provider value={{ timezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  return useContext(TimezoneContext).timezone;
}
