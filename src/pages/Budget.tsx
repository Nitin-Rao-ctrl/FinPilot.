import { useEffect, useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { Reveal } from '@/lib/animations';
import { supabase } from '@/lib/supabase';

type Category = {
  category: string;
  total: number;
  percentage: number;
  expenseType: 'fixed' | 'variable';
};

export function BudgetPage() {
  const [budget, setBudget] = useState('');
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spent, setSpent] = useState(0);

  /*
   * ==============================
   * LOAD USER-SPECIFIC BUDGET
   * ==============================
   */
  useEffect(() => {
    loadBudget();
  }, []);

  async function loadBudget() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Agar user login nahi hai
      if (!user) {
        setBudget('');
        return;
      }

      // Har user ki alag key
      const key = `smartspend_budget_${user.id}`;

      const savedBudget =
        localStorage.getItem(key);

      if (!savedBudget) {
        setBudget('');
        return;
      }

      try {
        const parsed = JSON.parse(savedBudget);

        if (
          parsed &&
          typeof parsed.totalBudget === 'number'
        ) {
          setBudget(
            String(parsed.totalBudget)
          );
        } else {
          setBudget('');
        }
      } catch (error) {
        console.error(
          'Failed to parse saved budget:',
          error
        );

        setBudget('');
      }
    } catch (error) {
      console.error(
        'Failed to load saved budget:',
        error
      );

      setBudget('');
    }
  }

  /*
   * ==============================
   * FETCH TRANSACTIONS
   * ==============================
   */
  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Login nahi hai to koi data nahi
      if (!user) {
        setSpent(0);
        setCategories([]);
        return;
      }

      const API_URL =
  'https://finpilot-backend-23iz.onrender.com';

const res = await fetch(
  `${API_URL}/api/transactions?userId=${encodeURIComponent(user.id)}`
);

if (!res.ok) {
  const errorText = await res.text();

  throw new Error(
    `Failed to fetch transactions: ${res.status} ${errorText}`
  );
}

const data = await res.json();

const transactions = Array.isArray(data)
  ? data
  : Array.isArray(data?.transactions)
    ? data.transactions
    : [];

const expenses = transactions.filter(
  (t: any) =>
    String(t.type || '').toLowerCase() === 'expense' ||
    String(t.type || '').toLowerCase() === 'debit' ||
    String(t.type || '').toLowerCase() === 'spent'
);
      const totalSpent = expenses.reduce(
        (sum: number, t: any) =>
          sum + Number(t.amount || 0),
        0
      );

      setSpent(totalSpent);

      const categoryMap: Record<string, {
        total: number;
        expenseType: 'fixed' | 'variable';
      }> = {};

      expenses.forEach((t: any) => {
        const category =
          t.category || 'Other';

        const expenseType =
          String(t.expenseType || '').toLowerCase() === 'fixed'
            ? 'fixed'
            : 'variable';

        const key = `${category}__${expenseType}`;

        if (!categoryMap[key]) {
          categoryMap[key] = {
            total: 0,
            expenseType,
          };
        }

        categoryMap[key].total +=
          Number(t.amount || 0);
      });

      const breakdown = Object.entries(
        categoryMap
      ).map(([key, value]) => {
        const separatorIndex = key.lastIndexOf('__');
        const category = key.slice(0, separatorIndex);

        return {
          category,
          total: value.total,
          expenseType: value.expenseType,
          percentage:
            totalSpent > 0
              ? Math.round(
                  (value.total / totalSpent) * 100
                )
              : 0,
        };
      });

      breakdown.sort((a, b) => b.total - a.total);

      setCategories(breakdown);
    } catch (error) {
      console.error(
        'Failed to fetch transactions:',
        error
      );
    }
  }

  /*
   * ==============================
   * SAVE USER-SPECIFIC BUDGET
   * ==============================
   */
  async function handleSaveBudget() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Login nahi hai to save mat karo
      if (!user) {
        console.error(
          'No logged-in user found'
        );
        return;
      }

      // IMPORTANT:
      // Har user ki separate budget key
      const key =
        `smartspend_budget_${user.id}`;

      localStorage.setItem(
        key,
        JSON.stringify({
          totalBudget:
            Number(budget) || 0,
          updatedAt:
            new Date().toISOString(),
        })
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Failed to save budget:',
        error
      );
    }
  }

  /*
   * ==============================
   * BUDGET CALCULATIONS
   * ==============================
   */

  const budgetNum =
    parseFloat(budget) || 0;

  const remaining = Math.max(
    0,
    budgetNum - spent
  );

  const utilization =
    budgetNum > 0
      ? (spent / budgetNum) * 100
      : 0;

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

  /*
   * ==============================
   * UI
   * ==============================
   */

  return (
    <div className="space-y-6">

      {/* Header */}
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Budget
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Set and monitor your monthly spending limit
          </p>
        </div>
      </Reveal>

      {/* Monthly Budget */}
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
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  setSaved(false);
                }}
                className="w-full pl-8 pr-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-lg font-semibold text-white focus:outline-none focus:border-emerald-400/30"
                placeholder="Enter monthly budget"
              />

            </div>

            <button
              onClick={handleSaveBudget}
              className="px-5 py-3 bg-emerald-400 text-[#050505] text-sm font-semibold rounded-lg hover:bg-emerald-300 transition-all glow-emerald"
            >
              {saved ? (
                <Check className="w-4 h-4 inline" />
              ) : (
                'Save'
              )}
            </button>

          </div>

        </div>
      </Reveal>

      {/* Budget Status */}
      <Reveal delay={100}>
        <div className="glass-card p-5">

          <div className="flex items-center justify-between mb-5">

            <span className="metric-label">
              Budget Status
            </span>

            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.color}`}
            >
              {status.label}
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
                width: `${Math.min(
                  100,
                  utilization
                )}%`,
              }}
            />

          </div>

          {/* Numbers */}
          <div className="grid grid-cols-3 gap-4 text-center">

            {/* Spent */}
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

            {/* Remaining */}
            <div>
              <p className="metric-label">
                Remaining
              </p>

              <p className="text-lg font-bold text-white mt-1">
                ₹
                {remaining.toLocaleString(
                  'en-IN'
                )}
              </p>
            </div>

            {/* Utilization */}
            <div>
              <p className="metric-label">
                Utilization
              </p>

              <p className="text-lg font-bold text-white mt-1">
                {utilization.toFixed(1)}%
              </p>
            </div>

          </div>

          {/* Warning */}
          {utilization >= 90 && (
            <div className="mt-4 flex items-start gap-2 bg-amber-400/[0.05] border border-amber-400/15 rounded-xl p-3">

              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />

              <p className="text-sm text-amber-300">

                {utilization >= 100
                  ? `You have exceeded your budget by ₹${(
                      spent - budgetNum
                    ).toLocaleString(
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

      {/* Category Breakdown */}
      <Reveal delay={150}>
        <div className="glass-card p-5">

          <span className="metric-label">
            Category Breakdown vs Budget
          </span>

          <p className="text-xs text-gray-600 mt-1">
            Fixed commitments count toward your real budget, but are clearly separated from variable spending.
          </p>

          <div className="space-y-3 mt-4">

            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No expense data available yet.
              </p>
            ) : (
              categories.map((cat) => {

                const budgetPercentage =
                  budgetNum > 0
                    ? (cat.total /
                        budgetNum) *
                      100
                    : 0;

                return (
                  <div
                    key={cat.category}
                  >

                    <div className="flex items-center justify-between mb-1">

                      <span className="text-sm text-gray-200">
                        {cat.category}
                      </span>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          cat.expenseType === 'fixed'
                            ? 'bg-amber-400/10 text-amber-400'
                            : 'bg-emerald-400/10 text-emerald-400'
                        }`}
                      >
                        {cat.expenseType === 'fixed'
                          ? 'Fixed'
                          : 'Variable'}
                      </span>

                      <span className="text-xs text-gray-500">
                        ₹
                        {cat.total.toLocaleString(
                          'en-IN'
                        )}{' '}
                        · {cat.percentage}%
                      </span>

                    </div>

                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">

                      <div
                        className={`h-full rounded-full ${
                          budgetPercentage >
                          40
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            budgetPercentage
                          )}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              })
            )}

          </div>

        </div>
      </Reveal>

    </div>
  );
}