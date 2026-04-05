"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import {
  assetRepository,
  billRepository,
  savingsGoalRepository,
} from "@/lib/repositories";
import type { Asset, Debt, SavingsGoal } from "@repo/database";

export interface DashboardGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  progressPercentage: number;
  icon: string | null;
  color: string | null;
}

export interface DashboardBill {
  id: string;
  name: string;
  amount: number;
  dueDate: number | null;
  status: string;
  daysUntilDue: number | null;
  isOverdue: boolean;
}

export interface DashboardAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  isLiquid: boolean;
}

export interface DashboardSummary {
  // Accounts summary
  totalBalance: number;
  accountCount: number;

  // Goals summary
  activeGoals: number;
  totalSaved: number;
  completedGoals: number;

  // Bills summary
  upcomingBills: number;
  overdueBills: number;
  totalDueThisMonth: number;

  // Data
  recentGoals: DashboardGoal[];
  upcomingBillsList: DashboardBill[];
  accounts: DashboardAccount[];
}

/**
 * Get comprehensive dashboard summary
 * Combines data from all three pillars: Accounts, Goals, Bills
 */
export async function getDashboardSummary(): Promise<ActionResult<DashboardSummary>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase, user } = authResult.data;

  // Get user's timezone or default to UTC
  const timezone = user?.user_metadata?.timezone ?? "UTC";

  try {
    // Fetch all data in parallel
    const [assets, goals, bills] = await Promise.all([
      assetRepository.findAll(supabase, userId),
      savingsGoalRepository.findActive(supabase, userId),
      billRepository.findActive(supabase, userId),
    ]);

    // Calculate account metrics
    const totalBalance = assets.reduce((sum, a) => sum + Number(a.balance), 0);

    // Calculate goal metrics
    const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_balance), 0);
    const completedGoals = goals.filter((g) =>
      savingsGoalRepository.isCompleted(g)
    ).length;

    // Format goals for dashboard
    const recentGoals: DashboardGoal[] = goals.slice(0, 3).map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentBalance: Number(g.current_balance),
      progressPercentage: savingsGoalRepository.getProgressPercentage(g),
      icon: g.icon,
      color: g.color,
    }));

    // Format accounts for dashboard
    const accounts: DashboardAccount[] = assets.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: Number(a.balance),
      isLiquid: a.is_liquid,
    }));

    // Calculate bill metrics
    const today = new Date();
    const currentDay = today.getDate();

    // Get upcoming bills (due within 30 days)
    const upcomingBillsList: DashboardBill[] = bills
      .filter((b) => b.status !== "paid")
      .map((b) => {
        const dueDate = b.due_date ?? 1;
        let daysUntilDue = dueDate - currentDay;

        // Handle month wrap (if due date has passed, it's next month)
        if (daysUntilDue < 0) {
          daysUntilDue += 30; // Approximate
        }

        return {
          id: b.id,
          name: b.label,
          amount: Number(b.amount),
          dueDate: b.due_date,
          status: b.status,
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
        };
      })
      .sort((a, b) => (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999))
      .slice(0, 5);

    const overdueBills = upcomingBillsList.filter((b) => b.isOverdue).length;
    const totalDueThisMonth = upcomingBillsList.reduce(
      (sum, b) => sum + b.amount,
      0
    );

    return success({
      totalBalance,
      accountCount: assets.length,
      activeGoals: goals.length,
      totalSaved,
      completedGoals,
      upcomingBills: bills.filter((b) => b.status !== "paid").length,
      overdueBills,
      totalDueThisMonth,
      recentGoals,
      upcomingBillsList,
      accounts,
    });
  } catch (err) {
    console.error("Failed to get dashboard summary:", err);
    return error("Failed to load dashboard data", "DATABASE_ERROR");
  }
}

/**
 * Get quick stats for the header
 */
export async function getQuickStats(): Promise<
  ActionResult<{
    totalBalance: number;
    billsDue: number;
    goalsProgress: number;
  }>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const [totalBalance, bills, goals] = await Promise.all([
      assetRepository.getTotalBalance(supabase, userId),
      billRepository.findActive(supabase, userId),
      savingsGoalRepository.findActive(supabase, userId),
    ]);

    const billsDue = bills.filter((b) => b.status !== "paid").length;

    const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
    const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_balance), 0);
    const goalsProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    return success({
      totalBalance,
      billsDue,
      goalsProgress,
    });
  } catch (err) {
    console.error("Failed to get quick stats:", err);
    return error("Failed to load stats", "DATABASE_ERROR");
  }
}
