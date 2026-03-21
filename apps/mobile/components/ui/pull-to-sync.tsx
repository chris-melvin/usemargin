import { useCallback } from "react";
import { RefreshControl } from "react-native";
import { useSyncStatus } from "@/hooks/use-sync";
import { useTheme } from "@/lib/theme/theme-context";

export function usePullToSync() {
  const { status, triggerSync } = useSyncStatus();
  const { colors } = useTheme();
  const isRefreshing = status === "syncing";

  const onRefresh = useCallback(() => {
    triggerSync();
  }, [triggerSync]);

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
      progressBackgroundColor={colors.background}
    />
  );

  return { refreshControl, isRefreshing, onRefresh };
}
