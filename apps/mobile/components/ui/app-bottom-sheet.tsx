import { forwardRef, useMemo } from "react";
import { StyleSheet } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetProps,
} from "@gorhom/bottom-sheet";

let BlurView: any = null;
try {
  BlurView = require("expo-blur").BlurView;
} catch {
  // expo-blur not available
}

interface AppBottomSheetProps extends Partial<BottomSheetProps> {
  snapPoints?: (string | number)[];
  children: React.ReactNode;
}

export const AppBottomSheet = forwardRef<BottomSheet, AppBottomSheetProps>(
  ({ snapPoints: customSnapPoints, children, ...props }, ref) => {
    const snapPoints = useMemo(() => customSnapPoints ?? ["40%", "85%"], [customSnapPoints]);

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
        backdropComponent={(backdropProps) => (
          <BottomSheetBackdrop
            {...backdropProps}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
        {...props}
      >
        {children}
      </BottomSheet>
    );
  }
);

AppBottomSheet.displayName = "AppBottomSheet";

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#FDFBF7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 12,
  },
  handle: {
    backgroundColor: "#D6D3D1",
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});
