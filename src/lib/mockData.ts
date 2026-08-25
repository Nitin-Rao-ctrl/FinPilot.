// src/lib/mockData.ts

/* ============================================================
   TYPES
============================================================ */

export type LoanType = 'lent' | 'borrowed';

export type LoanStatus =
  | 'pending'
  | 'partially_paid'
  | 'paid';

export interface Loan {
  id: string;
  person: string;
  amount: number;
  type: LoanType;
  date: string;
  dueDate: string | null;
  status: LoanStatus;
}

export type GoalStatus =
  | 'on-track'
  | 'challenging'
  | 'completed';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  requiredMonthly: number;
  progress: number;
  status: GoalStatus;
}

export type TransactionType =
  | 'income'
  | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
}

export interface Budget {
  monthly: number;
}


/* ============================================================
   EMPTY INITIAL DATA
   ------------------------------------------------------------
   IMPORTANT:
   Previously fake/mock data was being loaded here.
   Now everything starts EMPTY / ZERO.
============================================================ */

export const mockLoans: Loan[] = [];

export const mockGoals: Goal[] = [];

export const mockTransactions: Transaction[] = [];

export const mockBudget: Budget = {
  monthly: 0,
};


/* ============================================================
   OPTIONAL DEFAULT VALUES
   ------------------------------------------------------------
   Keep these empty so new users don't see fake data.
============================================================ */

export const mockExpenses: Transaction[] = [];

export const mockIncome: Transaction[] = [];


/* ============================================================
   CATEGORIES
============================================================ */

export const categories = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Other',
];


/* ============================================================
   DASHBOARD / INSIGHTS DEFAULT DATA
============================================================ */

export const mockInsights = {
  totalIncome: 0,
  totalExpenses: 0,
  balance: 0,
  savings: 0,
};


/* ============================================================
   WEEKLY REPORT DEFAULT DATA
============================================================ */

export const mockWeeklyReport = {
  totalSpent: 0,
  totalIncome: 0,
  averageDailySpend: 0,
  topCategory: '',
};


/* ============================================================
   SHOULD I SPEND DEFAULT DATA
============================================================ */

export const mockSpendingAnalysis = {
  currentBalance: 0,
  dailyLimit: 0,
  budgetRemaining: 0,
  categoryPercentage: 0,
};


/* ============================================================
   HELPER
============================================================ */

export function createEmptyGoal(
  name: string,
  targetAmount: number,
  deadline: string
): Goal {
  return {
    id: String(Date.now()),
    name,
    targetAmount,
    savedAmount: 0,
    deadline,
    requiredMonthly: 0,
    progress: 0,
    status: 'challenging',
  };
}


export function createEmptyLoan(
  person: string,
  amount: number,
  type: LoanType,
  date: string
): Loan {
  return {
    id: String(Date.now()),
    person,
    amount,
    type,
    date,
    dueDate: null,
    status: 'pending',
  };
}