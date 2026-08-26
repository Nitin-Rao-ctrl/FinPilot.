import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  Target,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Reveal } from '@/lib/animations';
import { supabase } from '@/lib/supabase';

const API_URL =
  'https://finpilot-backend-23iz.onrender.com/api/transactions';

type Transaction = {
  _id?: string;
  id?: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  description?: string;
  date: string;
  userId?: string;
};

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  requiredMonthly: number;
  progress: number;
  status: 'on-track' | 'challenging' | 'completed';
};

function normalizeTransaction(transaction: any): Transaction {
  return {
    ...transaction,
    id: transaction.id || transaction._id,
    amount: Number(transaction.amount || 0),
    type:
      transaction.type === 'income'
        ? 'income'
        : 'expense',
    category: transaction.category || 'Other',
    description: transaction.description || '',
    date: transaction.date || new Date().toISOString(),
  };
}

function normalizeGoal(goal: any): Goal {
  const targetAmount = Number(goal.targetAmount || 0);
  const savedAmount = Number(goal.savedAmount || 0);

  return {
    id: String(goal.id),
    name: String(goal.name || 'Unnamed Goal'),
    targetAmount,
    savedAmount,
    deadline: goal.deadline || '',
    requiredMonthly: Number(goal.requiredMonthly || 0),
    progress:
      targetAmount > 0
        ? Math.min(
            100,
            Math.round(
              (savedAmount / targetAmount) * 100
            )
          )
        : 0,
    status:
      goal.status ||
      (savedAmount >= targetAmount
        ? 'completed'
        : 'challenging'),
  };
}

export function WhatIfPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [goals, setGoals] = useState<Goal[]>([]);

  const [loading, setLoading] = useState(true);

  const [monthlySavings, setMonthlySavings] =
    useState('');

  const [months, setMonths] = useState('6');

  const [extraAmount, setExtraAmount] =
    useState('');

  /*
   * ============================================================
   * GET CURRENT LOGGED-IN USER
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    async function getCurrentUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user?.id) {
          setUserId(null);
          setGoals([]);
          setTransactions([]);
          setLoading(false);
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error(
          'Failed to get current user:',
          error
        );

        if (mounted) {
          setUserId(null);
          setGoals([]);
          setTransactions([]);
          setLoading(false);
        }
      }
    }

    getCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ============================================================
   * LOAD DATA WHEN USER CHANGES
   * ============================================================
   */

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      loadTransactions(userId),
      loadGoals(userId),
    ]).finally(() => {
      setLoading(false);
    });
  }, [userId]);

  /*
   * ============================================================
   * LOAD TRANSACTIONS
   * ============================================================
   */

  async function loadTransactions(currentUserId: string) {
    try {
      const response = await fetch(
        `${API_URL}?userId=${encodeURIComponent(
          currentUserId
        )}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch transactions: ${response.status}`
        );
      }

      const data = await response.json();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.transactions)
        ? data.transactions
        : [];

      setTransactions(
        list.map(normalizeTransaction)
      );
    } catch (error) {
      console.error(
        'Failed to load transactions:',
        error
      );

      /*
       * IMPORTANT:
       * Do NOT use global mock/local transaction data.
       * A new user must start empty.
       */
      setTransactions([]);
    }
  }

  /*
   * ============================================================
   * LOAD USER-SPECIFIC GOALS
   * ============================================================
   */

  function loadGoals(currentUserId: string) {
    try {
      /*
       * IMPORTANT:
       *
       * Every Google account gets a different localStorage key.
       *
       * Account A:
       * smartspend_goals_A
       *
       * Account B:
       * smartspend_goals_B
       */

      const key =
        `smartspend_goals_${currentUserId}`;

      const stored =
        localStorage.getItem(key);

      if (!stored) {
        setGoals([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setGoals([]);
        return;
      }

      setGoals(
        parsed.map(normalizeGoal)
      );
    } catch (error) {
      console.error(
        'Failed to load user goals:',
        error
      );

      setGoals([]);
    }
  }

  /*
   * ============================================================
   * CURRENT MONTH
   * ============================================================
   */

  const currentMonthTransactions =
    useMemo(() => {
      const now = new Date();

      return transactions.filter(
        (transaction) => {
          const date = new Date(
            transaction.date
          );

          return (
            date.getMonth() ===
              now.getMonth() &&
            date.getFullYear() ===
              now.getFullYear()
          );
        }
      );
    }, [transactions]);

  /*
   * ============================================================
   * INCOME / EXPENSE
   * ============================================================
   */

  const monthlyIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === 'income'
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );
  }, [currentMonthTransactions]);

  const monthlyExpenses = useMemo(() => {
    return currentMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === 'expense'
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );
  }, [currentMonthTransactions]);

  const currentSavings =
    monthlyIncome - monthlyExpenses;

  /*
   * ============================================================
   * ACTIVE GOALS
   * ============================================================
   */

  const activeGoals = useMemo(() => {
    return goals.filter(
      (goal) =>
        goal.status !== 'completed' &&
        goal.savedAmount <
          goal.targetAmount
    );
  }, [goals]);

  /*
   * ============================================================
   * SELECT MOST URGENT GOAL
   * ============================================================
   */

  const primaryGoal = useMemo(() => {
    if (!activeGoals.length) {
      return null;
    }

    return [...activeGoals].sort(
      (a, b) => {
        const aRemaining =
          a.targetAmount -
          a.savedAmount;

        const bRemaining =
          b.targetAmount -
          b.savedAmount;

        return (
          bRemaining - aRemaining
        );
      }
    )[0];
  }, [activeGoals]);

  /*
   * ============================================================
   * WHAT-IF CALCULATIONS
   * ============================================================
   */

  const savingsInput =
    Number(monthlySavings) || 0;

  const monthsInput =
    Math.max(1, Number(months) || 1);

  const extraInput =
    Number(extraAmount) || 0;

  const projectedSavings =
    savingsInput * monthsInput +
    extraInput;

  const goalRemaining =
    primaryGoal
      ? Math.max(
          0,
          primaryGoal.targetAmount -
            primaryGoal.savedAmount
        )
      : 0;

  const projectedGoalProgress =
    primaryGoal &&
    primaryGoal.targetAmount > 0
      ? Math.min(
          100,
          ((primaryGoal.savedAmount +
            projectedSavings) /
            primaryGoal.targetAmount) *
            100
        )
      : 0;

  const goalWillComplete =
    primaryGoal
      ? projectedSavings >=
        goalRemaining
      : false;

  const monthsToGoal =
    primaryGoal &&
    savingsInput > 0
      ? Math.ceil(
          goalRemaining /
            savingsInput
        )
      : null;

  /*
   * ============================================================
   * DEFAULT SAVINGS
   * ============================================================
   */

  useEffect(() => {
    if (
      monthlySavings === '' &&
      currentSavings > 0
    ) {
      setMonthlySavings(
        String(Math.round(currentSavings))
      );
    }
  }, [
    currentSavings,
    monthlySavings,
  ]);

  /*
   * ============================================================
   * NO USER
   * ============================================================
   */

  if (!userId) {
    return (
      <div className="space-y-6">
        <Reveal>
          <div>
            <h1 className="text-2xl font-bold text-white">
              What If?
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Sign in to see your personalized
              financial scenarios.
            </p>
          </div>
        </Reveal>

        <div className="glass-card p-8 text-center">
          <Target className="w-10 h-10 text-gray-500 mx-auto mb-4" />

          <h2 className="text-lg font-semibold text-white">
            Login required
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Your What-If scenarios are linked
            to your Google account.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="space-y-6">
        <Reveal>
          <div>
            <h1 className="text-2xl font-bold text-white">
              What If?
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Loading your financial data...
            </p>
          </div>
        </Reveal>

        <div className="glass-card p-8 text-center">
          <div className="animate-pulse text-gray-500">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MAIN UI
   * ============================================================
   */

  return (
    <div className="space-y-6 pb-8">

      {/* HEADER */}
      <Reveal>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />

            <h1 className="text-2xl font-bold text-white">
              What If?
            </h1>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Explore how different saving decisions
            could affect your financial goals.
          </p>
        </div>
      </Reveal>

      {/* CURRENT FINANCIAL SNAPSHOT */}
      <Reveal delay={50}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />

              <span className="metric-label">
                Monthly Income
              </span>
            </div>

            <p className="text-2xl font-bold text-white">
              ₹
              {monthlyIncome.toLocaleString(
                'en-IN'
              )}
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-red-400" />

              <span className="metric-label">
                Monthly Expenses
              </span>
            </div>

            <p className="text-2xl font-bold text-white">
              ₹
              {monthlyExpenses.toLocaleString(
                'en-IN'
              )}
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-blue-400" />

              <span className="metric-label">
                Current Savings
              </span>
            </div>

            <p className="text-2xl font-bold text-white">
              ₹
              {currentSavings.toLocaleString(
                'en-IN'
              )}
            </p>
          </div>

        </div>
      </Reveal>

      {/* NO GOALS */}
      {activeGoals.length === 0 && (
        <Reveal delay={100}>
          <div className="glass-card p-8 text-center">

            <Target className="w-10 h-10 text-gray-500 mx-auto mb-4" />

            <h2 className="text-lg font-semibold text-white">
              No active goals yet
            </h2>

            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Create a goal first and then come
              back here to see how different
              saving scenarios can help you reach it.
            </p>

          </div>
        </Reveal>
      )}

      {/* WHAT IF FORM */}
      {primaryGoal && (
        <>
          <Reveal delay={100}>
            <div className="glass-card p-5">

              <div className="flex items-center justify-between mb-5">

                <div>
                  <span className="metric-label">
                    What If Scenario
                  </span>

                  <h2 className="text-lg font-semibold text-white mt-1">
                    {primaryGoal.name}
                  </h2>
                </div>

                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* MONTHLY SAVINGS */}
                <div>
                  <label className="metric-label">
                    Monthly Savings
                  </label>

                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={monthlySavings}
                      onChange={(e) =>
                        setMonthlySavings(
                          e.target.value
                        )
                      }
                      placeholder="10000"
                      className="w-full pl-8 pr-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-emerald-400/30"
                    />
                  </div>
                </div>

                {/* MONTHS */}
                <div>
                  <label className="metric-label">
                    Time Period
                  </label>

                  <div className="relative mt-2">
                    <input
                      type="number"
                      min="1"
                      value={months}
                      onChange={(e) =>
                        setMonths(
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-emerald-400/30"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      months
                    </span>
                  </div>
                </div>

                {/* EXTRA */}
                <div>
                  <label className="metric-label">
                    Extra One-Time Amount
                  </label>

                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={extraAmount}
                      onChange={(e) =>
                        setExtraAmount(
                          e.target.value
                        )
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-emerald-400/30"
                    />
                  </div>
                </div>

              </div>
            </div>
          </Reveal>

          {/* GOAL STATUS */}
          <Reveal delay={150}>
            <div className="glass-card p-5">

              <span className="metric-label">
                Goal Projection
              </span>

              <div className="mt-5">

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">
                    {primaryGoal.name}
                  </span>

                  <span className="text-sm font-semibold text-white">
                    {projectedGoalProgress.toFixed(
                      1
                    )}
                    %
                  </span>
                </div>

                <div className="h-3 bg-white/5 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        projectedGoalProgress
                      )}%`,
                    }}
                  />

                </div>

                <div className="grid grid-cols-2 gap-4 mt-5">

                  <div>
                    <p className="metric-label">
                      Current Saved
                    </p>

                    <p className="text-lg font-bold text-white mt-1">
                      ₹
                      {primaryGoal.savedAmount.toLocaleString(
                        'en-IN'
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="metric-label">
                      Target
                    </p>

                    <p className="text-lg font-bold text-white mt-1">
                      ₹
                      {primaryGoal.targetAmount.toLocaleString(
                        'en-IN'
                      )}
                    </p>
                  </div>

                </div>

              </div>
            </div>
          </Reveal>

          {/* RESULT */}
          <Reveal delay={200}>
            <div
              className={`glass-card p-5 border ${
                goalWillComplete
                  ? 'border-emerald-400/20'
                  : 'border-amber-400/20'
              }`}
            >

              <div className="flex items-start gap-3">

                {goalWillComplete ? (
                  <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                )}

                <div>
                  <p
                    className={`font-semibold ${
                      goalWillComplete
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {goalWillComplete
                      ? 'You can reach this goal!'
                      : 'You are getting closer to your goal'}
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    Over {monthsInput}{' '}
                    {monthsInput === 1
                      ? 'month'
                      : 'months'}, you could
                    save ₹
                    {projectedSavings.toLocaleString(
                      'en-IN'
                    )}{' '}
                    with this plan.
                  </p>

                  {goalWillComplete ? (
                    <p className="text-sm text-gray-300 mt-2">
                      Your projected savings are enough
                      to cover the remaining ₹
                      {goalRemaining.toLocaleString(
                        'en-IN'
                      )}{' '}
                      needed for this goal.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-300 mt-2">
                      You would still need ₹
                      {Math.max(
                        0,
                        goalRemaining -
                          projectedSavings
                      ).toLocaleString(
                        'en-IN'
                      )}{' '}
                      after this scenario.
                    </p>
                  )}
                </div>

              </div>
            </div>
          </Reveal>

          {/* TIME ESTIMATE */}
          <Reveal delay={250}>
            <div className="glass-card p-5">

              <span className="metric-label">
                Estimated Timeline
              </span>

              <div className="flex items-center gap-4 mt-4">

                <div className="w-11 h-11 rounded-xl bg-blue-400/10 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-blue-400" />
                </div>

                <div>
                  {monthsToGoal !== null ? (
                    <>
                      <p className="text-xl font-bold text-white">
                        {monthsToGoal}{' '}
                        {monthsToGoal === 1
                          ? 'month'
                          : 'months'}
                      </p>

                      <p className="text-sm text-gray-500 mt-0.5">
                        estimated time to reach{' '}
                        {primaryGoal.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-white">
                        Add monthly savings
                      </p>

                      <p className="text-sm text-gray-500 mt-0.5">
                        Enter an amount above to
                        calculate your timeline.
                      </p>
                    </>
                  )}
                </div>

              </div>
            </div>
          </Reveal>
        </>
      )}

      {/* DATA NOTICE */}
      <Reveal delay={300}>
        <div className="text-center">

          <p className="text-xs text-gray-600">
            What-If calculations use your current
            account's transactions and goals only.
          </p>

        </div>
      </Reveal>

    </div>
  );
}

export default WhatIfPage;