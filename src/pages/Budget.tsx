import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import { Reveal } from '@/lib/animations';
import { supabase } from '@/lib/supabase';

type Transaction = {
  _id?: string;
  id?: string;
  type: 'income' | 'expense';
  amount: number | string;
  category?: string;
  description?: string;
  merchant?: string;
  date: string;
};

type Category = {
  category: string;
  total: number;
  percentage: number;
};

const API_URL = 'https://finpilot-backend-23iz.onrender.com';

function isCurrentMonth(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

export function BudgetPage() {
  const [budget, setBudget] = useState('');
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spent, setSpent] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ==========================================================
     LOAD SAVED BUDGET
  ========================================================== */

  useEffect(() => {
    const savedBudget =
      localStorage.getItem('smartspend_budget');

    if (!savedBudget) return;

    try {
      const parsed = JSON.parse(savedBudget);

      if (
        parsed &&
        typeof parsed.totalBudget === 'number'
      ) {
        setBudget(
          String(parsed.totalBudget)
        );
      }
    } catch (error) {
      console.error(
        'Failed to load saved budget:',
        error
      );
    }
  }, []);

  /* ==========================================================
     LOAD TRANSACTIONS
  ========================================================== */

  useEffect(() => {
    fetchTransactions();
  }, []);

 async function fetchTransactions() {
  try {
    setLoading(true);
    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User is not logged in');
    }

    const response = await fetch(
      `${API_URL}/api/transactions?userId=${encodeURIComponent(user.id)}`
    );

    if (!response.ok) {
      throw new Error(
        'Failed to fetch transactions'
      );
    }

    const data = await response.json();

    const transactionList: Transaction[] =
      Array.isArray(data)
        ? data
        : [];

    setTransactions(transactionList);
  } catch (error) {
    console.error(
      'Failed to fetch transactions:',
      error
    );

    setError(
      'Could not load transaction data.'
    );

    setTransactions([]);
  } finally {
    setLoading(false);
  }
}
  /* ==========================================================
     CURRENT MONTH EXPENSES
  ========================================================== */

  const currentMonthExpenses = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        transaction.type === 'expense' &&
        isCurrentMonth(transaction.date)
    );
  }, [transactions]);

  /* ==========================================================
     CURRENT MONTH SPENT
  ========================================================== */

  useEffect(() => {
    const totalSpent =
      currentMonthExpenses.reduce(
        (sum, transaction) =>
          sum +
          Number(
            transaction.amount || 0
          ),
        0
      );

    setSpent(totalSpent);
  }, [currentMonthExpenses]);

  /* ==========================================================
     CATEGORY BREAKDOWN
  ========================================================== */

  useEffect(() => {
    const categoryMap: Record<
      string,
      number
    > = {};

    currentMonthExpenses.forEach(
      (transaction) => {
        const category =
          transaction.category ||
          'Other';

        categoryMap[category] =
          (categoryMap[category] || 0) +
          Number(
            transaction.amount || 0
          );
      }
    );

    const totalSpent =
      currentMonthExpenses.reduce(
        (sum, transaction) =>
          sum +
          Number(
            transaction.amount || 0
          ),
        0
      );

    const breakdown: Category[] =
      Object.entries(
        categoryMap
      )
        .map(
          ([category, total]) => ({
            category,
            total,
            percentage:
              totalSpent > 0
                ? Math.round(
                    (total /
                      totalSpent) *
                      100
                  )
                : 0,
          })
        )
        .sort(
          (a, b) =>
            b.total - a.total
        );

    setCategories(
      breakdown
    );
  }, [currentMonthExpenses]);

  /* ==========================================================
     BUDGET VALUES
  ========================================================== */

  const budgetNum =
    parseFloat(budget) || 0;

  const remaining = Math.max(
    0,
    budgetNum - spent
  );

  const exceededBy = Math.max(
    0,
    spent - budgetNum
  );

  const utilization =
    budgetNum > 0
      ? (spent / budgetNum) * 100
      : 0;

  /* ==========================================================
     STATUS
  ========================================================== */

  const status =
    utilization >= 100
      ? {
          label: 'Budget exceeded',
          color: 'text-red-400',
          bg: 'bg-red-400/10',
        }
      : utilization >= 90
      ? {
          label: 'Very close to limit',
          color: 'text-amber-400',
          bg: 'bg-amber-400/10',
        }
      : utilization >= 75
      ? {
          label: 'Approaching budget',
          color: 'text-amber-400',
          bg: 'bg-amber-400/10',
        }
      : {
          label: 'Within budget',
          color: 'text-emerald-400',
          bg: 'bg-emerald-400/10',
        };

  /* ==========================================================
     SAVE BUDGET
  ========================================================== */

  function handleSaveBudget() {
    const value =
      parseFloat(budget);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      setSaved(false);
      alert(
        'Please enter a valid monthly budget.'
      );
      return;
    }

    localStorage.setItem(
      'smartspend_budget',
      JSON.stringify({
        totalBudget: value,
        updatedAt:
          new Date().toISOString(),
      })
    );

    setBudget(
      String(value)
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  /* ==========================================================
     RESET BUDGET
  ========================================================== */

  function handleResetBudget() {
    localStorage.removeItem(
      'smartspend_budget'
    );

    setBudget('');
    setSaved(false);
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <Reveal>

        <div className="flex items-start justify-between gap-4">

          <div>

            <h1 className="text-2xl font-bold text-white">
              Budget
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Set and monitor your monthly spending limit
            </p>

          </div>

          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/[0.07] text-gray-400 text-xs hover:text-white hover:bg-white/[0.03] transition-all disabled:opacity-50"
          >

            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh

          </button>

        </div>

      </Reveal>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <Reveal>

          <div className="rounded-xl border border-red-400/10 bg-red-400/[0.05] p-4">

            <p className="text-sm text-red-300">
              {error}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Make sure the backend server is running on port 5000.
            </p>

          </div>

        </Reveal>

      )}

      {/* ====================================================
          MONTHLY BUDGET
      ==================================================== */}

      <Reveal delay={50}>

        <div className="glass-card p-5">

          <span className="metric-label">
            Monthly Budget
          </span>

          <div className="flex gap-3 mt-3">

            <div className="relative flex-1">

              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                ₹
              </span>

              <input
                type="number"
                min="0"
                step="100"
                value={budget}
                onChange={(e) => {
                  setBudget(
                    e.target.value
                  );

                  setSaved(false);
                }}
                placeholder="Enter monthly budget"
                className="form-input pl-8 pr-3 py-3 text-lg font-semibold text-white"
              />

            </div>

            <button
              type="button"
              onClick={
                handleSaveBudget
              }
              className="px-5 py-3 bg-emerald-400 text-[#050505] text-sm font-semibold rounded-lg hover:bg-emerald-300 transition-all glow-emerald"
            >

              {saved ? (
                <>
                  <Check className="w-4 h-4 inline mr-1" />
                  Saved
                </>
              ) : (
                'Save'
              )}

            </button>

            {budget && (

              <button
                type="button"
                onClick={
                  handleResetBudget
                }
                className="px-4 py-3 border border-white/[0.08] text-gray-400 text-sm rounded-lg hover:text-white hover:bg-white/[0.03] transition-all"
              >
                Reset
              </button>

            )}

          </div>

          <p className="text-[10px] text-gray-600 mt-2">
            This budget is saved locally and is used by the Should I Spend? analysis.
          </p>

        </div>

      </Reveal>

      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading ? (

        <Reveal delay={75}>

          <div className="glass-card p-8 text-center">

            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto mb-3" />

            <p className="text-sm text-gray-500">
              Loading transaction data...
            </p>

          </div>

        </Reveal>

      ) : (

        <>
          {/* ==================================================
              BUDGET STATUS
          ================================================== */}

          <Reveal delay={100}>

            <div className="glass-card p-5">

              <div className="flex items-center justify-between mb-5">

                <span className="metric-label">
                  Budget Status
                </span>

                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.color}`}
                >
                  {budgetNum > 0
                    ? status.label
                    : 'Set a budget first'}
                </span>

              </div>

              {/* Progress */}

              <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-4">

                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    utilization >= 100
                      ? 'bg-red-400'
                      : utilization >= 90
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  }`}
                  style={{
                    width:
                      budgetNum > 0
                        ? `${Math.min(
                            100,
                            utilization
                          )}%`
                        : '0%',
                  }}
                />

              </div>

              {/* Numbers */}

              <div className="grid grid-cols-3 gap-4 text-center">

                <div>

                  <p className="metric-label">
                    Spent
                  </p>

                  <p className="text-lg font-bold text-white mt-1">
                    ₹
                    {spent.toLocaleString(
                      'en-IN'
                    )}
                  </p>

                </div>

                <div>

                  <p className="metric-label">
                    Remaining
                  </p>

                  <p className="text-lg font-bold text-white mt-1">
                    {budgetNum > 0
                      ? `₹${remaining.toLocaleString(
                          'en-IN'
                        )}`
                      : 'N/A'}
                  </p>

                </div>

                <div>

                  <p className="metric-label">
                    Utilization
                  </p>

                  <p className="text-lg font-bold text-white mt-1">
                    {budgetNum > 0
                      ? `${utilization.toFixed(
                          1
                        )}%`
                      : 'N/A'}
                  </p>

                </div>

              </div>

              {/* Exceeded warning */}

              {budgetNum > 0 &&
                utilization >= 90 && (

                  <div className="mt-4 flex items-start gap-2 bg-amber-400/[0.05] border border-amber-400/15 rounded-xl p-3">

                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />

                    <p className="text-sm text-amber-300">

                      {utilization >= 100
                        ? `You have exceeded your budget by ₹${exceededBy.toLocaleString(
                            'en-IN'
                          )}.`
                        : `You're very close to your budget limit. Only ₹${remaining.toLocaleString(
                            'en-IN'
                          )} left.`}

                    </p>

                  </div>

                )}

            </div>

          </Reveal>

          {/* ==================================================
              CATEGORY BREAKDOWN
          ================================================== */}

          <Reveal delay={150}>

            <div className="glass-card p-5">

              <span className="metric-label">
                Category Breakdown vs Budget
              </span>

              <p className="text-xs text-gray-600 mt-1">
                Current month expenses
              </p>

              <div className="space-y-4 mt-5">

                {categories.length === 0 ? (

                  <p className="text-sm text-gray-500 text-center py-6">
                    No expense data available for this month yet.
                  </p>

                ) : (

                  categories.map(
                    (cat) => {

                      const budgetPercentage =
                        budgetNum > 0
                          ? (cat.total /
                              budgetNum) *
                            100
                          : 0;

                      return (

                        <div
                          key={
                            cat.category
                          }
                        >

                          <div className="flex items-center justify-between mb-1.5">

                            <span className="text-sm text-gray-200">
                              {cat.category}
                            </span>

                            <span className="text-xs text-gray-500">
                              ₹
                              {cat.total.toLocaleString(
                                'en-IN'
                              )}
                              {' · '}
                              {cat.percentage}%
                            </span>

                          </div>

                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">

                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                budgetPercentage > 40
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{
                                width:
                                  budgetNum >
                                  0
                                    ? `${Math.min(
                                        100,
                                        budgetPercentage
                                      )}%`
                                    : '0%',
                              }}
                            />

                          </div>

                        </div>

                      );
                    }
                  )

                )}

              </div>

            </div>

          </Reveal>

          {/* ==================================================
              CURRENT MONTH SUMMARY
          ================================================== */}

          <Reveal delay={200}>

            <div className="glass-card p-5">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <SummaryBox
                  label="Transactions"
                  value={String(
                    currentMonthExpenses.length
                  )}
                />

                <SummaryBox
                  label="Total Spent"
                  value={`₹${spent.toLocaleString(
                    'en-IN'
                  )}`}
                />

                <SummaryBox
                  label="Budget"
                  value={
                    budgetNum > 0
                      ? `₹${budgetNum.toLocaleString(
                          'en-IN'
                        )}`
                      : 'N/A'
                  }
                />

                <SummaryBox
                  label="Remaining"
                  value={
                    budgetNum > 0
                      ? `₹${remaining.toLocaleString(
                          'en-IN'
                        )}`
                      : 'N/A'
                  }
                />

              </div>

            </div>

          </Reveal>

        </>

      )}

    </div>
  );
}

/* ============================================================
   SUMMARY BOX
============================================================ */

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/[0.025] rounded-xl p-4">

      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 mb-2">
        {label}
      </p>

      <p className="text-lg font-bold text-white">
        {value}
      </p>

    </div>
  );
}
