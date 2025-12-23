// Calendar day data computed from expenses
export interface CalendarDay {
  day: number;
  date: Date;
  key: string; // YYYY-MM-DD
  limit: number;
  spent: number;
  remaining: number;
  isPadding?: boolean;
}

// Local expense type for state management (before Supabase integration)
export interface LocalExpense {
  id: string;
  date: string; // ISO string
  amount: number;
  label: string;
  category?: string;
}
