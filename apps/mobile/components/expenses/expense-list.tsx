import { useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  StyleSheet,
} from "react-native";
import { CURRENCY } from "@repo/shared/constants";
import { formatDate, DATE_FORMATS } from "@repo/shared/date";
import { tapHeavy } from "@/lib/haptics";
import type { LocalExpense } from "@/lib/db/expense-dao";

interface ExpenseListProps {
  expenses: LocalExpense[];
  timezone: string;
  onDelete: (id: string) => void;
  onEdit: (expense: LocalExpense) => void;
}

const SWIPE_THRESHOLD = -80;

function ExpenseItem({
  expense,
  timezone,
  onDelete,
  onEdit,
}: {
  expense: LocalExpense;
  timezone: string;
  onDelete: (id: string) => void;
  onEdit: (expense: LocalExpense) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwipedOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -120));
        } else if (isSwipedOpen.current) {
          translateX.setValue(Math.min(gestureState.dx + SWIPE_THRESHOLD, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = true;
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = false;
        }
      },
    })
  ).current;

  const handlePress = useCallback(() => {
    if (isSwipedOpen.current) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      isSwipedOpen.current = false;
      return;
    }
    onEdit(expense);
  }, [expense, onEdit]);

  const handleDelete = useCallback(() => {
    tapHeavy();
    onDelete(expense.id);
  }, [expense.id, onDelete]);

  return (
    <View className="relative overflow-hidden">
      {/* Delete action behind */}
      <TouchableOpacity
        onPress={handleDelete}
        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 items-center justify-center"
      >
        <Text style={itemStyles.deleteText}>Delete</Text>
      </TouchableOpacity>

      {/* Foreground content */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          className="flex-row items-center justify-between px-4 py-3"
          style={{ backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F5F5F4" }}
        >
          {/* Category color left border */}
          {expense.category && (
            <View style={itemStyles.categoryStripe} />
          )}
          <View className="flex-1">
            <Text style={itemStyles.label}>
              {expense.label}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Text style={itemStyles.time}>
                {formatDate(expense.occurred_at, timezone, DATE_FORMATS.TIME_12H)}
              </Text>
              {expense.category ? (
                <View style={itemStyles.categoryBadge}>
                  <Text style={itemStyles.categoryText}>
                    {expense.category}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <View className="items-end">
            <Text style={itemStyles.amount}>
              -{CURRENCY}
              {expense.amount.toLocaleString()}
            </Text>
            {expense.is_synced === 0 && (
              <Text style={itemStyles.syncPending}>
                pending sync
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#292524",
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "#78716C",
  },
  categoryStripe: {
    position: "absolute",
    left: 0,
    top: 4,
    bottom: 4,
    width: 3,
    borderRadius: 1.5,
    backgroundColor: "#1A9E9E",
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#F5F5F4",
  },
  categoryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: "#57534E",
  },
  amount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#44403C",
    fontVariant: ["tabular-nums"],
  },
  syncPending: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "#D97706",
    marginTop: 2,
  },
  deleteText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#FFFFFF",
  },
});

export function ExpenseList({
  expenses,
  timezone,
  onDelete,
  onEdit,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <View style={styles.container}>
        <View className="items-center justify-center py-12">
          <Text style={styles.emptyTitle}>No expenses yet today</Text>
          <Text style={styles.emptySubtitle}>Tap + to add one</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: "#F5F5F4" }}>
        <Text style={styles.headerTitle}>Today's Transactions</Text>
        <Text style={styles.headerCount}>{expenses.length} total</Text>
      </View>

      {/* Items */}
      {expenses.map((item) => (
        <ExpenseItem
          key={item.id}
          expense={item}
          timezone={timezone}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(231,229,228,0.6)",
    overflow: "hidden",
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1C1917",
  },
  headerCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#A8A29E",
  },
  emptyTitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#A8A29E",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#D6D3D1",
    marginTop: 4,
  },
});
