import { useCallback } from "react";
import { RefreshControl } from "react-native";
import { useSyncStatus } from "@/hooks/use-sync";

export function usePullToSync() {
  const { status, triggerSync } = useSyncStatus();
  const isRefreshing = status === "syncing";

  const onRefresh = useCallback(() => {
    triggerSync();
  }, [triggerSync]);

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor="#1A9E9E"
      colors={["#1A9E9E"]}
      progressBackgroundColor="#FDFBF7"
    />
  );

  return { refreshControl, isRefreshing, onRefresh };
}
