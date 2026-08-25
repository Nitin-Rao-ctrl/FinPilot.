import { useEffect, useMemo, useState } from 'react';
import {
  Lightbulb,
  TrendingDown,
  TrendingUp,
  Target,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { Reveal } from '@/lib/animations';

type Transaction = {
  id?: string | number;
  amount?: number | string;
  type?: string;
  category?: string;
  date?: string;
};

type Goal = {
  id?: string;
  name?: string;
  targetAmount?: number;
  savedAmount?: number;
  progress?: number;
  status?: string;
};

const API_URL = 'http://localhost:5000/api/transactions';

const GOAL_STORAGE_KEY = 'smartspend_goals';

const CATEGORIES = [
  'Food',
  'Shopping',
  'Transport',
  'Entertainment',
  'Bills',
  'Health',
  'Education',
  'Travel',
  'Other',
];

function formatMoney(value: number) {
  return `₹${Math.max(0, Math.round(value)).toLocaleString(
    'en-IN'
  )}`;
}

function isExpense(transaction: Transaction) {
  return String(transaction.type).toLowerCase() === 'expense';
}

function isIncome(transaction: Transaction) {
  return String(transaction.type).toLowerCase() === 'income';
}

function isCurrentMonth(date?: string) {
  if (!date) return true;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return true;
  }

  const now = new Date();

  return (
    parsed.getMonth() === now.getMonth() &&
    parsed.getFullYear() === now.getFullYear()
  );
}

export function WhatIfPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [category, setCategory] = useState('Food');

  const [changePercent, setChangePercent] =
    useState(20);

  const [mode, setMode] = useState<'reduce' | 'increase'>(
    'reduce'
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    await Promise.all([
      loadTransactions(),
      loadGoals(),
    ]);

    setLoading(false);
  }

  async function loadTransactions() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.transactions)
        ? data.transactions
        : [];

      setTransactions(list);
    } catch (error) {
      console.error(
        'Failed to load transactions:',
        error
      );

      /*
       * Local fallback
       */
      try {
        const stored = localStorage.getItem(
          'smartspend_transactions'
        );

        if (stored) {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            setTransactions(parsed);
          }
        }
      } catch {
        setTransactions([]);
      }
    }
  }

  function loadGoals() {
    try {
      const stored = localStorage.getItem(
        GOAL_STORAGE_KEY
      );

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setGoals(parsed);
          return;
        }
      }
    } catch (error) {
      console.error(
        'Failed to load goals:',
        error
      );
    }

    /*
     * Try mock goals as fallback
     */
    import('@/lib/mockData')
      .then((module) => {
        if (Array.isArray(module.mockGoals)) {
          setGoals(module.mockGoals as Goal[]);
        }
      })
      .catch(() => {
        setGoals([]);
      });
  }

  /*
   * ============================================================
   * CURRENT MONTH TRANSACTIONS
   * ============================================================
   */

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      isCurrentMonth(transaction.date)
    );
  }, [transactions]);

  /*
   * ============================================================
   * CURRENT CATEGORY SPENDING
   * ============================================================
   */

  const categorySpent = useMemo(() => {
    return currentMonthTransactions
      .filter(isExpense)
      .filter(
        (transaction) =>
          String(
            transaction.category || 'Other'
          ).toLowerCase() ===
          category.toLowerCase()
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );
  }, [
    currentMonthTransactions,
    category,
  ]);

  /*
   * ============================================================
   * TOTAL CURRENT MONTH INCOME
   * ============================================================
   */

  const totalIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(isIncome)
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );
  }, [currentMonthTransactions]);

  /*
   * ============================================================
   * TOTAL CURRENT MONTH EXPENSE
   * ============================================================
   */

  const totalExpense = useMemo(() => {
    return currentMonthTransactions
      .filter(isExpense)
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );
  }, [currentMonthTransactions]);

  /*
   * ============================================================
   * CURRENT SAVINGS
   * ============================================================
   */

  const currentSavings =
    totalIncome - totalExpense;

  /*
   * ============================================================
   * WHAT-IF CALCULATION
   * ============================================================
   */

  const percent = Math.min(
    100,
    Math.max(0, Number(changePercent) || 0)
  );

  const changeAmount =
    categorySpent * (percent / 100);

  const simulatedCategorySpend =
    mode === 'reduce'
      ? Math.max(
          0,
          categorySpent - changeAmount
        )
      : categorySpent + changeAmount;

  const simulatedTotalExpense =
    mode === 'reduce'
      ? Math.max(
          0,
          totalExpense - changeAmount
        )
      : totalExpense + changeAmount;

  const simulatedSavings =
    totalIncome - simulatedTotalExpense;

  const monthlyImpact =
    simulatedSavings - currentSavings;

  /*
   * ============================================================
   * GOAL IMPACT
   * ============================================================
   */

  const goalImpact = useMemo(() => {
    const activeGoals = goals.filter(
      (goal) => goal.status !== 'completed'
    );

    if (!activeGoals.length) {
      return {
        goal: null as Goal | null,
        monthsSaved: 0,
        monthsDelayed: 0,
        message:
          'Create a savings goal to see how this scenario affects your goal timeline.',
      };
    }

    const goal = [...activeGoals].sort(
      (a, b) =>
        Number(a.progress || 0) -
        Number(b.progress || 0)
    )[0];

    const target = Number(
      goal.targetAmount || 0
    );

    const saved = Number(
      goal.savedAmount || 0
    );

    const remaining = Math.max(
      0,
      target - saved
    );

    /*
     * We use the current monthly savings
     * as the baseline.
     */
    const baselineMonthlySavings =
      Math.max(0, currentSavings);

    const simulatedMonthlySavings =
      Math.max(0, simulatedSavings);

    if (
      baselineMonthlySavings <= 0 ||
      remaining <= 0
    ) {
      return {
        goal,
        monthsSaved: 0,
        monthsDelayed: 0,
        message:
          remaining <= 0
            ? `${goal.name || 'Your goal'} is already fully funded.`
            : `Increase your monthly savings to improve your ${goal.name || 'goal'} timeline.`,
      };
    }

    const baselineMonths =
      remaining /
      baselineMonthlySavings;

    const simulatedMonths =
      remaining /
      Math.max(1, simulatedMonthlySavings);

    const difference =
      baselineMonths - simulatedMonths;

    if (difference > 0.25) {
      return {
        goal,
        monthsSaved: Math.max(
          0,
          Math.round(difference)
        ),
        monthsDelayed: 0,
        message: `This change could help you reach ${goal.name || 'your goal'} faster.`,
      };
    }

    if (difference < -0.25) {
      return {
        goal,
        monthsSaved: 0,
        monthsDelayed: Math.max(
          0,
          Math.round(Math.abs(difference))
        ),
        message: `This change could delay ${goal.name || 'your goal'}.`,
      };
    }

    return {
      goal,
      monthsSaved: 0,
      monthsDelayed: 0,
      message: `This scenario has a relatively small impact on ${goal.name || 'your goal'}.`,
    };
  }, [
    goals,
    currentSavings,
    simulatedSavings,
  ]);

  /*
   * ============================================================
   * SCENARIO STATUS
   * ============================================================
   */

  const scenarioStatus =
    mode === 'reduce'
      ? monthlyImpact > 0
        ? 'positive'
        : 'neutral'
      : monthlyImpact < 0
      ? 'warning'
      : 'neutral';

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Reveal>
        <div>

          <h1 className="text-2xl font-bold text-white">
            What-If Simulator
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            See how changing your spending could affect your
            savings and goals.
          </p>

        </div>
      </Reveal>

      {/* ======================================================
          MAIN SIMULATOR
      ====================================================== */}

      <Reveal delay={50}>

        <div className="glass rounded-2xl p-6 neon-border">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">

              <Lightbulb className="w-5 h-5 text-emerald-400" />

            </div>

            <div>

              <h2 className="text-sm font-semibold text-white">
                Spending Scenario
              </h2>

              <p className="text-xs text-gray-500 mt-0.5">
                Change a category and see the financial impact.
              </p>

            </div>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* ==================================================
                CONTROLS
            ================================================== */}

            <div className="space-y-5">

              {/* CATEGORY */}

              <div>

                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  className="form-input"
                >

                  {CATEGORIES.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}

                </select>

              </div>

              {/* REDUCE / INCREASE */}

              <div>

                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Scenario
                </label>

                <div className="grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setMode('reduce')
                    }
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                      mode === 'reduce'
                        ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                        : 'border-white/[0.06] text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 inline mr-2" />
                    Reduce Spending
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMode('increase')
                    }
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                      mode === 'increase'
                        ? 'bg-red-400/10 border-red-400/30 text-red-400'
                        : 'border-white/[0.06] text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Increase Spending
                  </button>

                </div>

              </div>

              {/* PERCENTAGE */}

              <div>

                <div className="flex items-center justify-between mb-2">

                  <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Percentage
                  </label>

                  <span className="text-sm font-semibold text-white">
                    {percent}%
                  </span>

                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={percent}
                  onChange={(event) =>
                    setChangePercent(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="w-full accent-emerald-400"
                />

                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>

              </div>

            </div>

            {/* ==================================================
                CURRENT VS SIMULATED
            ================================================== */}

            <div className="grid grid-cols-2 gap-3">

              <InfoCard
                label="Current Category Spend"
                value={formatMoney(
                  categorySpent
                )}
              />

              <InfoCard
                label="Simulated Spend"
                value={formatMoney(
                  simulatedCategorySpend
                )}
                highlight={
                  mode === 'increase'
                }
              />

              <InfoCard
                label="Current Monthly Savings"
                value={formatMoney(
                  currentSavings
                )}
              />

              <InfoCard
                label="Simulated Savings"
                value={formatMoney(
                  simulatedSavings
                )}
                positive={
                  simulatedSavings >
                  currentSavings
                }
              />

            </div>

          </div>

        </div>

      </Reveal>

      {/* ======================================================
          IMPACT
      ====================================================== */}

      <Reveal delay={100}>

        <div className="grid md:grid-cols-3 gap-4">

          <ImpactCard
            icon={Wallet}
            label="Monthly Impact"
            value={formatMoney(
              Math.abs(monthlyImpact)
            )}
            subtitle={
              monthlyImpact > 0
                ? 'additional monthly savings'
                : monthlyImpact < 0
                ? 'additional monthly spending'
                : 'no change'
            }
            status={
              monthlyImpact > 0
                ? 'positive'
                : monthlyImpact < 0
                ? 'warning'
                : 'neutral'
            }
          />

          <ImpactCard
            icon={Target}
            label="Goal Impact"
            value={
              goalImpact.goal
                ? goalImpact.goal.name ||
                  'Goal'
                : 'No Goal'
            }
            subtitle={
              goalImpact.message
            }
            status={
              goalImpact.monthsSaved > 0
                ? 'positive'
                : goalImpact.monthsDelayed > 0
                ? 'warning'
                : 'neutral'
            }
          />

          <ImpactCard
            icon={ArrowRight}
            label="Scenario Result"
            value={
              scenarioStatus ===
              'positive'
                ? 'Better'
                : scenarioStatus ===
                  'warning'
                ? 'More Risk'
                : 'Similar'
            }
            subtitle={
              mode === 'reduce'
                ? `Reducing ${category} spending by ${percent}%`
                : `Increasing ${category} spending by ${percent}%`
            }
            status={scenarioStatus}
          />

        </div>

      </Reveal>

      {/* ======================================================
          GOAL DETAILS
      ====================================================== */}

      {goalImpact.goal && (

        <Reveal delay={150}>

          <div className="glass-card p-6">

            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-2">

                <Target className="w-4 h-4 text-emerald-400" />

                <span className="metric-label">
                  Goal Timeline Impact
                </span>

              </div>

              <span className="text-xs text-gray-500">
                {goalImpact.goal.name}
              </span>

            </div>

            <div className="grid md:grid-cols-3 gap-4">

              <div className="bg-white/[0.02] rounded-xl p-4">

                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  Target
                </p>

                <p className="text-lg font-bold text-white mt-1">
                  {formatMoney(
                    Number(
                      goalImpact.goal
                        .targetAmount || 0
                    )
                  )}
                </p>

              </div>

              <div className="bg-white/[0.02] rounded-xl p-4">

                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  Saved
                </p>

                <p className="text-lg font-bold text-white mt-1">
                  {formatMoney(
                    Number(
                      goalImpact.goal
                        .savedAmount || 0
                    )
                  )}
                </p>

              </div>

              <div className="bg-white/[0.02] rounded-xl p-4">

                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  Timeline Change
                </p>

                <p
                  className={`text-lg font-bold mt-1 ${
                    goalImpact.monthsSaved >
                    0
                      ? 'text-emerald-400'
                      : goalImpact.monthsDelayed >
                        0
                      ? 'text-red-400'
                      : 'text-white'
                  }`}
                >

                  {goalImpact.monthsSaved >
                  0
                    ? `~${goalImpact.monthsSaved} month faster`
                    : goalImpact.monthsDelayed >
                      0
                    ? `~${goalImpact.monthsDelayed} month slower`
                    : 'Minimal change'}

                </p>

              </div>

            </div>

            <div className="mt-4 bg-emerald-400/[0.03] border border-emerald-400/10 rounded-xl p-4">

              <p className="text-sm text-gray-300 leading-relaxed">
                {goalImpact.message}
              </p>

            </div>

          </div>

        </Reveal>
      )}

      {/* ======================================================
          EMPTY DATA WARNING
      ====================================================== */}

      {!loading &&
        transactions.length === 0 && (

          <Reveal delay={200}>

            <div className="glass-card p-8 text-center">

              <Wallet className="w-7 h-7 text-gray-600 mx-auto mb-3" />

              <h3 className="text-sm font-semibold text-white">
                No transaction data yet
              </h3>

              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Add income and expense transactions first.
                The What-If Simulator will then use your real
                spending history.
              </p>

            </div>

          </Reveal>

        )}

    </div>
  );
}

/* ============================================================
   INFO CARD
============================================================ */

function InfoCard({
  label,
  value,
  highlight = false,
  positive = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-4">

      <p className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p
        className={`text-xl font-bold mt-1 ${
          positive
            ? 'text-emerald-400'
            : highlight
            ? 'text-red-400'
            : 'text-white'
        }`}
      >
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   IMPACT CARD
============================================================ */

function ImpactCard({
  icon: Icon,
  label,
  value,
  subtitle,
  status,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  subtitle: string;
  status:
    | 'positive'
    | 'warning'
    | 'neutral';
}) {
  return (
    <div className="glass-card p-5">

      <div className="flex items-center gap-2 mb-4">

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            status === 'positive'
              ? 'bg-emerald-400/10'
              : status === 'warning'
              ? 'bg-amber-400/10'
              : 'bg-white/[0.03]'
          }`}
        >

          <Icon
            className={`w-4 h-4 ${
              status === 'positive'
                ? 'text-emerald-400'
                : status === 'warning'
                ? 'text-amber-400'
                : 'text-gray-400'
            }`}
          />

        </div>

        <span className="metric-label">
          {label}
        </span>

      </div>

      <p className="text-xl font-bold text-white">
        {value}
      </p>

      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
        {subtitle}
      </p>

    </div>
  );
}

export default WhatIfPage;