import { Slot, useRouter, useSegments } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect, useCallback } from "react";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Lora_400Regular,
  Lora_700Bold,
} from "@expo-google-fonts/lora";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import { SyncProvider } from "@/components/providers/sync-provider";
import { TimezoneProvider } from "@/components/providers/timezone-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { runMigrations } from "@/lib/db/migrations";
import "../global.css";

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_400Regular,
    Lora_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="ledgr.db" onInit={runMigrations}>
      <AuthProvider>
        <SyncProvider>
          <SettingsProvider>
            <TimezoneProvider>
              <ThemeProvider>
                <StatusBar style="auto" />
                <AuthGate />
              </ThemeProvider>
            </TimezoneProvider>
          </SettingsProvider>
        </SyncProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}
