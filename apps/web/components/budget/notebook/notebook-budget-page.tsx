"use client";

import { useState, useMemo } from "react";
import { Banknote, Receipt, CreditCard, RefreshCw, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotebookPaper } from "./notebook-paper";
import { NotebookRow, NotebookEmptyRow, NotebookAddRow } from "./notebook-row";
import { NotebookSection, NotebookSectionContent, NotebookSectionDivider } from "./notebook-section";
import { NotebookSectionHeader, NotebookSubtotal } from "./notebook-section-header";
import { NotebookSummaryHeader, NotebookRunningTotal } from "./notebook-summary-header";
import { BillForm } from "../bill-form";
import { IncomeForm } from "../income-form";
import { DebtQuickForm } from "../debt-quick-form";
import type { Income, Debt } from "@repo/database";
import type { CreateIncomeInput, UpdateIncomeInput } from "@/lib/validations/income.schema";
import type { CreateBillInput, UpdateBillInput } from "@/lib/validations/bill.schema";
import type { OptimisticIncome, OptimisticDebt } from "@/hooks/use-server-budget";

interface NotebookBudgetPageProps {
  incomes: OptimisticIncome[];
  bills: OptimisticDebt[];
  regularBills: OptimisticDebt[];
  debts: OptimisticDebt[];
  subscriptions: OptimisticDebt[];
  plannedExpenses: OptimisticDebt[];
  currency: string;
  isPending: boolean;
  totals: {
    totalIncome: number;
    totalBills: number;
    totalDebtPayments: number;
    totalSubscriptions: number;
    totalExpenses: number;
    remaining: number;
  };
  onAddIncome: (data: CreateIncomeInput) => Promise<{ success: boolean; error?: string }>;
  onUpdateIncome: (id: string, data: UpdateIncomeInput) => Promise<{ success: boolean; error?: string }>;
  onDeleteIncome: (id: string) => Promise<{ success: boolean; error?: string }>;
  onMarkIncomeReceived: (id: string, receivedDate?: string) => Promise<{ success: boolean; error?: string }>;
  onResetIncomeStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
  onAddBill: (data: CreateBillInput) => Promise<{ success: boolean; error?: string }>;
  onUpdateBill: (id: string, data: UpdateBillInput) => Promise<{ success: boolean; error?: string }>;
  onDeleteBill: (id: string) => Promise<{ success: boolean; error?: string }>;
  onMarkBillPaid: (id: string, paidDate?: string) => Promise<{ success: boolean; error?: string }>;
  onResetBillStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
  onMakeDebtPayment: (id: string, paymentAmount: number, paidDate?: string) => Promise<{ success: boolean; error?: string }>;
  onRecordDebtPayment?: (id: string, paymentAmount: number, paidDate?: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
}

// Helper to detect subscriptions by label
function isSubscription(label: string): boolean {
  const subscriptionKeywords = [
    "netflix", "spotify", "youtube", "disney", "hbo", "amazon prime",
    "apple", "google", "microsoft", "adobe", "canva", "figma",
    "gym", "fitness", "membership", "subscription", "premium",
    "hulu", "paramount", "peacock", "crunchyroll",
  ];
  const lowerLabel = label.toLowerCase();
  return subscriptionKeywords.some((keyword) => lowerLabel.includes(keyword));
}

export function NotebookBudgetPage({
  incomes,
  bills,
  regularBills,
  debts,
  subscriptions,
  plannedExpenses,
  currency,
  isPending,
  totals,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onMarkIncomeReceived,
  onResetIncomeStatus,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onMarkBillPaid,
  onResetBillStatus,
  onMakeDebtPayment,
  onRecordDebtPayment,
}: NotebookBudgetPageProps) {
  // Form states
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isBillFormOpen, setIsBillFormOpen] = useState(false);
  const [isDebtFormOpen, setIsDebtFormOpen] = useState(false);
  const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);

  // Edit states
  const [editingIncome, setEditingIncome] = useState<OptimisticIncome | null>(null);
  const [editingBill, setEditingBill] = useState<OptimisticDebt | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"income" | "bill" | null>(null);

  // Handlers for income
  const handleAddIncome = async (data: CreateIncomeInput) => {
    const result = await onAddIncome(data);
    if (result.success) {
      toast.success("Income added");
      setIsIncomeFormOpen(false);
    } else {
      toast.error(result.error ?? "Failed to add income");
    }
  };

  const handleUpdateIncome = async (data: CreateIncomeInput) => {
    if (!editingIncome) return;
    const result = await onUpdateIncome(editingIncome.id, data);
    if (result.success) {
      toast.success("Income updated");
      setEditingIncome(null);
    } else {
      toast.error(result.error ?? "Failed to update income");
    }
  };

  const handleDeleteIncome = async (id: string) => {
    setDeleteId(id);
    setDeleteType("income");
  };

  const handleToggleIncome = async (income: OptimisticIncome) => {
    if (income.status === "received") {
      const result = await onResetIncomeStatus(income.id);
      if (result.success) {
        toast.success("Income reset");
      } else {
        toast.error(result.error ?? "Failed to reset");
      }
    } else {
      const result = await onMarkIncomeReceived(income.id);
      if (result.success) {
        toast.success("Income received!");
      } else {
        toast.error(result.error ?? "Failed to mark received");
      }
    }
  };

  // Handlers for bills
  const handleAddBill = async (data: CreateBillInput) => {
    const result = await onAddBill(data);
    if (result.success) {
      toast.success("Bill added");
      setIsBillFormOpen(false);
      setIsSubscriptionFormOpen(false);
    } else {
      toast.error(result.error ?? "Failed to add bill");
    }
  };

  const handleAddDebt = async (data: CreateBillInput) => {
    const result = await onAddBill(data);
    if (result.success) {
      toast.success("Debt added");
      setIsDebtFormOpen(false);
    } else {
      toast.error(result.error ?? "Failed to add debt");
    }
  };

  const handleUpdateBill = async (data: CreateBillInput) => {
    if (!editingBill) return;
    const result = await onUpdateBill(editingBill.id, data);
    if (result.success) {
      toast.success("Updated");
      setEditingBill(null);
    } else {
      toast.error(result.error ?? "Failed to update");
    }
  };

  const handleDeleteBill = async (id: string) => {
    setDeleteId(id);
    setDeleteType("bill");
  };

  const handleToggleBill = async (bill: OptimisticDebt) => {
    if (bill.status === "paid") {
      const result = await onResetBillStatus(bill.id);
      if (result.success) {
        toast.success("Status reset");
      } else {
        toast.error(result.error ?? "Failed to reset");
      }
    } else {
      const result = await onMarkBillPaid(bill.id);
      if (result.success) {
        toast.success("Marked as paid!");
      } else {
        toast.error(result.error ?? "Failed to mark paid");
      }
    }
  };

  // Handle debt payment (for variable debts, record payment history)
  const handleDebtPayment = async (debt: OptimisticDebt, amount?: number) => {
    const paymentAmount = amount ?? debt.minimum_payment ?? debt.amount;

    // Use recordDebtPayment for variable debts to track history
    if (debt.payment_type === "variable" && onRecordDebtPayment) {
      const result = await onRecordDebtPayment(debt.id, paymentAmount);
      if (result.success) {
        toast.success(`${debt.label} payment recorded`);
      } else {
        toast.error(result.error ?? "Failed to record payment");
      }
    } else {
      const result = await onMakeDebtPayment(debt.id, paymentAmount);
      if (result.success) {
        toast.success(`${debt.label} payment marked`);
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteId || !deleteType) return;

    const result = deleteType === "income"
      ? await onDeleteIncome(deleteId)
      : await onDeleteBill(deleteId);

    if (result.success) {
      toast.success("Deleted");
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
    setDeleteId(null);
    setDeleteType(null);
  };

  // Running total sections for footer
  const runningSections = [
    { label: "Income", total: totals.totalIncome, colorClass: "text-emerald-600" },
    { label: "Bills", total: totals.totalBills, colorClass: "text-amber-600" },
    { label: "Debt Payments", total: totals.totalDebtPayments, colorClass: "text-rose-600" },
    { label: "Subscriptions", total: totals.totalSubscriptions, colorClass: "text-violet-600" },
  ];

  return (
    <>
      <NotebookPaper>
        {/* Summary Header */}
        <NotebookSummaryHeader
          totalIncome={totals.totalIncome}
          totalExpenses={totals.totalExpenses}
          remaining={totals.remaining}
          currency={currency}
        />

        {/* Income Section */}
        <NotebookSection>
          <NotebookSectionHeader
            title="Income"
            icon={<Banknote className="w-4 h-4 text-emerald-600" />}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100"
            total={totals.totalIncome}
            currency={currency}
            count={incomes.length}
            onAdd={() => setIsIncomeFormOpen(true)}
            marginAnnotation="earnings"
          />
          <NotebookSectionContent>
            {incomes.length === 0 ? (
              <NotebookEmptyRow
                message="No income tracked"
                actionLabel="Add income"
                onAction={() => setIsIncomeFormOpen(true)}
              />
            ) : (
              incomes.map((income) => (
                <NotebookRow
                  key={income.id}
                  label={income.label}
                  amount={income.amount}
                  currency={currency}
                  status={income.status === "received" ? "received" : "expected"}
                  dueDate={income.day_of_month}
                  colorScheme="emerald"
                  isPending={income.pending}
                  onMarkComplete={() => handleToggleIncome(income)}
                  onEdit={() => setEditingIncome(income)}
                  onDelete={() => handleDeleteIncome(income.id)}
                />
              ))
            )}
          </NotebookSectionContent>
        </NotebookSection>

        <NotebookSectionDivider />

        {/* Bills Section */}
        <NotebookSection>
          <NotebookSectionHeader
            title="Bills"
            icon={<Receipt className="w-4 h-4 text-amber-600" />}
            iconColor="text-amber-600"
            iconBg="bg-amber-100"
            total={totals.totalBills}
            currency={currency}
            count={regularBills.length}
            onAdd={() => setIsBillFormOpen(true)}
            marginAnnotation="monthly"
          />
          <NotebookSectionContent>
            {regularBills.length === 0 ? (
              <NotebookEmptyRow
                message="No bills tracked"
                actionLabel="Add bill"
                onAction={() => setIsBillFormOpen(true)}
              />
            ) : (
              regularBills.map((bill) => (
                <NotebookRow
                  key={bill.id}
                  label={bill.label}
                  amount={bill.amount}
                  currency={currency}
                  icon={bill.icon ?? undefined}
                  status={bill.status}
                  dueDate={bill.due_date}
                  colorScheme="amber"
                  isPending={bill.pending}
                  onMarkComplete={() => handleToggleBill(bill)}
                  onEdit={() => setEditingBill(bill)}
                  onDelete={() => handleDeleteBill(bill.id)}
                />
              ))
            )}
          </NotebookSectionContent>
        </NotebookSection>

        <NotebookSectionDivider />

        {/* Debt Section */}
        <NotebookSection>
          <NotebookSectionHeader
            title="Debt"
            icon={<CreditCard className="w-4 h-4 text-rose-600" />}
            iconColor="text-rose-600"
            iconBg="bg-rose-100"
            total={totals.totalDebtPayments}
            currency={currency}
            count={debts.length}
            onAdd={() => setIsDebtFormOpen(true)}
            marginAnnotation="payments"
          />
          <NotebookSectionContent>
            {debts.length === 0 ? (
              <NotebookEmptyRow
                message="No debts tracked"
                actionLabel="Add debt"
                onAction={() => setIsDebtFormOpen(true)}
              />
            ) : (
              debts.map((debt) => (
                <NotebookRow
                  key={debt.id}
                  label={debt.label}
                  amount={debt.minimum_payment ?? debt.amount}
                  currency={currency}
                  icon={debt.icon ?? undefined}
                  status={debt.status}
                  dueDate={debt.due_date}
                  colorScheme="rose"
                  isVariable={debt.payment_type === "variable"}
                  isPending={debt.pending}
                  onMarkComplete={() => handleDebtPayment(debt)}
                  onEdit={() => setEditingBill(debt)}
                  onDelete={() => handleDeleteBill(debt.id)}
                  onAmountChange={
                    debt.payment_type === "variable"
                      ? (amount) => handleDebtPayment(debt, amount)
                      : undefined
                  }
                />
              ))
            )}
          </NotebookSectionContent>
        </NotebookSection>

        <NotebookSectionDivider />

        {/* Subscriptions Section */}
        <NotebookSection>
          <NotebookSectionHeader
            title="Subscriptions"
            icon={<RefreshCw className="w-4 h-4 text-violet-600" />}
            iconColor="text-violet-600"
            iconBg="bg-violet-100"
            total={totals.totalSubscriptions}
            currency={currency}
            count={subscriptions.length}
            onAdd={() => setIsSubscriptionFormOpen(true)}
            marginAnnotation="recurring"
          />
          <NotebookSectionContent>
            {subscriptions.length === 0 ? (
              <NotebookEmptyRow
                message="No subscriptions tracked"
                actionLabel="Add subscription"
                onAction={() => setIsSubscriptionFormOpen(true)}
              />
            ) : (
              subscriptions.map((sub) => (
                <NotebookRow
                  key={sub.id}
                  label={sub.label}
                  amount={sub.amount}
                  currency={currency}
                  icon={sub.icon ?? undefined}
                  status={sub.status}
                  dueDate={sub.due_date}
                  colorScheme="violet"
                  isPending={sub.pending}
                  onMarkComplete={() => handleToggleBill(sub)}
                  onEdit={() => setEditingBill(sub)}
                  onDelete={() => handleDeleteBill(sub.id)}
                />
              ))
            )}
          </NotebookSectionContent>
        </NotebookSection>

        {/* Planned Expenses Section (if any) */}
        {plannedExpenses.length > 0 && (
          <>
            <NotebookSectionDivider />
            <NotebookSection>
              <NotebookSectionHeader
                title="Planned Expenses"
                icon={<Calendar className="w-4 h-4 text-blue-600" />}
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
                total={plannedExpenses.reduce((sum, e) => sum + e.amount, 0)}
                currency={currency}
                count={plannedExpenses.length}
                marginAnnotation="one-time"
              />
              <NotebookSectionContent>
                {plannedExpenses.map((expense) => (
                  <NotebookRow
                    key={expense.id}
                    label={expense.label}
                    amount={expense.amount}
                    currency={currency}
                    icon={expense.icon ?? undefined}
                    status={expense.status}
                    dueDate={expense.due_date}
                    colorScheme="blue"
                    isPending={expense.pending}
                    onMarkComplete={() => handleToggleBill(expense)}
                    onEdit={() => setEditingBill(expense)}
                    onDelete={() => handleDeleteBill(expense.id)}
                  />
                ))}
              </NotebookSectionContent>
            </NotebookSection>
          </>
        )}

        {/* Running Total Footer */}
        <NotebookRunningTotal
          sections={runningSections}
          currency={currency}
          grandTotal={totals.totalExpenses}
        />
      </NotebookPaper>

      {/* Forms */}
      <IncomeForm
        open={isIncomeFormOpen}
        onClose={() => setIsIncomeFormOpen(false)}
        currency={currency}
        onSave={handleAddIncome}
      />

      <IncomeForm
        open={!!editingIncome}
        onClose={() => setEditingIncome(null)}
        currency={currency}
        income={editingIncome ?? undefined}
        onSave={handleUpdateIncome}
      />

      <BillForm
        open={isBillFormOpen}
        onClose={() => setIsBillFormOpen(false)}
        currency={currency}
        onSave={handleAddBill}
      />

      <BillForm
        open={isSubscriptionFormOpen}
        onClose={() => setIsSubscriptionFormOpen(false)}
        currency={currency}
        onSave={handleAddBill}
      />

      <DebtQuickForm
        open={isDebtFormOpen}
        onClose={() => setIsDebtFormOpen(false)}
        currency={currency}
        onSave={handleAddDebt}
      />

      <BillForm
        open={!!editingBill}
        onClose={() => setEditingBill(null)}
        bill={editingBill}
        currency={currency}
        isDebt={editingBill?.total_amount !== null}
        onSave={handleUpdateBill}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteType === "income" ? "Income" : "Item"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
