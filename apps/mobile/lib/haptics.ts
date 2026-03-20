import * as Haptics from "expo-haptics";

/** Light tap — chip/button taps, swipe threshold crossed */
export function tapLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap — FAB press, expense added */
export function tapMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy tap — expense deleted */
export function tapHeavy() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Success notification — expense submitted, sync complete */
export function notifySuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning notification — approaching budget limit */
export function notifyWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Selection changed — date/theme/picker changes */
export function selection() {
  Haptics.selectionAsync();
}

/** Budget warning — double-tap at 80% threshold */
export async function budgetWarning() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise((r) => setTimeout(r, 100));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Streak milestone — success pattern on new record */
export function streakMilestone() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Over budget — triple-tap warning */
export async function overBudget() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise((r) => setTimeout(r, 80));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise((r) => setTimeout(r, 80));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Sync complete — light confirmation tap */
export function syncComplete() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
