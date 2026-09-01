import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Droplet,
  Activity,
  AlertTriangle,
} from 'lucide-react';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';

import { useEffect, useState } from 'react';
import { Reveal, CountUp } from '@/lib/animations';
import { supabase } from '@/lib/supabase';
import {
  MonthSelector,
  type SelectedPeriod,
} from '@/components/MonthSelector';

const PIE_COLORS = [
  '#00FF88',
  '#00D97E',
  '#10B981',
  '#059669',
  '#047857',
  '#065F46',
];

export function InsightsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showCategoryAnalysis, setShowCategoryAnalysis] =
    useState(false);

  const [selectedPeriod, setSelectedPeriod] =
    useState<SelectedPeriod>(() => {
      try {
        const saved = localStorage.getItem(
          'finpilot_selected_period'
        );

        if (saved) {
          const parsed = JSON.parse(saved);

          if (parsed?.type === 'all') {
            return { type: 'all' };
          }

          if (
            parsed?.type === 'month' &&
            typeof parsed.year === 'number' &&
            typeof parsed.month === 'number'
          ) {
            return {
              type: 'month',
              year: parsed.year,
              month: parsed.month,
            };
          }
        }
      } catch {
        // Ignore invalid saved period
      }

      const now = new Date();

      return {
        type: 'month',
        year: now.getFullYear(),
        month: now.getMonth(),
      };
    });

  useEffect(() => {
    localStorage.setItem(
      'finpilot_selected_period',
      JSON.stringify(selectedPeriod)
    );
  }, [selectedPeriod]);

  useEffect(() => {
  async function loadTransactions() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User is not logged in');
      }

      const response = await fetch(
        `https://finpilot-backend-23iz.onrender.com/api/transactions?userId=${encodeURIComponent(
          user.id
        )}`
      );

      if (!response.ok) {
        throw new Error(
          `Transaction API returned ${response.status}`
        );
      }

      const data = await response.json();

      setTransactions(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        'Error loading insights transactions:',
        error
      );

      setTransactions([]);
    }
  }

  loadTransactions();
}, []);

  // -----------------------------
  // SELECTED PERIOD
  // -----------------------------

  const periodTransactions =
    selectedPeriod.type === 'all'
      ? transactions
      : transactions.filter((t) => {
          if (!t.date) return false;

          const date = new Date(t.date);

          if (Number.isNaN(date.getTime())) {
            return false;
          }

          if (selectedPeriod.type !== 'month') {
            return false;
          }

          return (
            date.getFullYear() === selectedPeriod.year &&
            date.getMonth() === selectedPeriod.month
          );
        });

  // -----------------------------
  // TRANSACTIONS
  // -----------------------------

  const expenses = periodTransactions.filter(
    (t) => t.type === 'expense'
  );

  const incomes = periodTransactions.filter(
    (t) => t.type === 'income'
  );

  const totalExpense = expenses.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const totalIncome = incomes.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  // -----------------------------
  // CATEGORY BREAKDOWN
  // -----------------------------

  const categoryMap: Record<string, number> = {};

  expenses.forEach((t) => {
    const category = t.category || 'Other';

    categoryMap[category] =
      (categoryMap[category] || 0) +
      Number(t.amount || 0);
  });

  const categoryBreakdown = Object.entries(categoryMap).map(
    ([category, total]) => ({
      category,
      total,
      percentage:
        totalExpense > 0
          ? Math.round((total / totalExpense) * 100)
          : 0,
    })
  );

  const topCategory =
    categoryBreakdown.length > 0
      ? categoryBreakdown.reduce((a, b) =>
          b.total > a.total ? b : a
        )
      : null;

  // -----------------------------
  // DAILY SPENDING
  // -----------------------------

  const dailyMap: Record<string, number> = {};

  expenses.forEach((t) => {
    const day = new Date(t.date)
      .getDate()
      .toString();

    dailyMap[day] =
      (dailyMap[day] || 0) +
      Number(t.amount || 0);
  });

  const dailySpendingTrend = Object.entries(
    dailyMap
  ).map(([day, amount]) => ({
    day,
    amount,
  }));

  // -----------------------------
  // MONTHLY COMPARISON
  // -----------------------------

  const monthlyMap: Record<
    string,
    {
      income: number;
      expense: number;
    }
  > = {};

  transactions.forEach((t) => {
    const month = new Date(t.date).toLocaleString(
      'en-IN',
      {
        month: 'short',
      }
    );

    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        income: 0,
        expense: 0,
      };
    }

    if (t.type === 'income') {
      monthlyMap[month].income +=
        Number(t.amount || 0);
    } else {
      monthlyMap[month].expense +=
        Number(t.amount || 0);
    }
  });

  const monthlyComparison = Object.entries(
    monthlyMap
  ).map(([month, data]) => ({
    month,
    ...data,
  }));

  // -----------------------------
  // AVERAGE PER DAY
  // -----------------------------

  const avgPerDay =
    expenses.length > 0
      ? Math.round(
          totalExpense /
            Math.max(
              1,
              dailySpendingTrend.length
            )
        )
      : 0;
      

  // -----------------------------
  // MONEY LEAKS
  // -----------------------------
 // -----------------------------
// SMART REDUCTION ANALYSIS
// -----------------------------

const fixedCategories = [
  'Rent',
  'EMI',
  'Loan',
  'Insurance',
];

function getRecommendedReduction(
  category: string,
  total: number,
  transactionCount: number,
  totalExpense: number
) {
  if (
    total <= 0 ||
    totalExpense <= 0 ||
    fixedCategories.includes(category)
  ) {
    return 0;
  }

  const spendingShare =
    total / totalExpense;

  // Higher share = higher opportunity
  const shareScore =
    spendingShare * 100;

  // More transactions = stronger repeated-spending signal
  const frequencyScore =
    Math.min(transactionCount * 2, 20);

  // Combine spending share + frequency
  const analysisScore =
    shareScore + frequencyScore;

  // Convert analysis into a practical
  // reduction recommendation
  if (analysisScore >= 50) {
    return 25;
  }

  if (analysisScore >= 35) {
    return 20;
  }

  if (analysisScore >= 20) {
    return 15;
  }

  if (analysisScore >= 10) {
    return 10;
  }

  return 5;
}
 const moneyLeaks = categoryBreakdown
  .filter(
    (cat) =>
      cat.total > 0 &&
      !fixedCategories.includes(cat.category)
  )
  .slice(0, 3)
  .map((cat) => {
    const categoryTransactions =
      expenses.filter(
        (t) =>
          (t.category || 'Other') ===
          cat.category
      );

    const recommendedReduction =
      getRecommendedReduction(
        cat.category,
        cat.total,
        categoryTransactions.length,
        totalExpense
      );

    return {
      count: categoryTransactions.length,
      category: cat.category,
      merchant: cat.category,
      total: cat.total,
      average: Math.round(
        cat.total /
          Math.max(
            1,
            categoryTransactions.length
          )
      ),
      reductionPercent: recommendedReduction,
      potentialSavings: Math.round(
        cat.total *
          recommendedReduction /
          100
      ),
    };
  });

  // -----------------------------
  // SAVING SUGGESTIONS
  // -----------------------------

 const savingSuggestions =
  categoryBreakdown
    .filter(
      (cat) =>
        cat.total > 0 &&
        !fixedCategories.includes(cat.category)
    )
    .slice(0, 3)
    .map((cat) => {
      const categoryTransactions =
        expenses.filter(
          (t) =>
            (t.category || 'Other') ===
            cat.category
        );

      const reductionPercent =
        getRecommendedReduction(
          cat.category,
          cat.total,
          categoryTransactions.length,
          totalExpense
        );

      const potentialSavings =
        Math.round(
          cat.total *
            reductionPercent /
            100
        );

      return {
        category: cat.category,
        reductionPercent,
        potentialSavings,
        advice: `Based on your spending pattern, reducing ${cat.category} spending by ${reductionPercent}% could save approximately ₹${potentialSavings} per month.`,
      };
    });

  // -----------------------------
  // INSIGHTS
  // -----------------------------

  const insights = topCategory
    ? [
        {
          type: 'warning',
          title: `${topCategory.category} is your top spending category`,
          detail: `${topCategory.category} accounts for ${topCategory.percentage}% of your expenses.`,
        },
        {
          type: 'positive',
          title: 'Keep tracking your expenses',
          detail: `You have logged ${periodTransactions.length} transactions.`,
        },
      ]
    : [];

   // -----------------------------
  // FINANCIAL HEALTH
  // -----------------------------

  const savingsRate =
    totalIncome > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((totalIncome - totalExpense) /
                totalIncome) *
                100
            )
          )
        )
      : 0;

  const budgetControl =
    totalIncome > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (1 -
                totalExpense /
                  totalIncome) *
                100
            )
          )
        )
      : 0;

  /* ============================================================
     SPENDING BEHAVIOR ANALYSIS
     Based on the selected period's actual transactions.

     1. Consistency (40%)
        Measures how stable daily spending is.
     2. Trend (35%)
        Compares earlier spending with more recent spending.
        Lower recent spending = better behavior.
     3. Large spending (25%)
        Detects unusually large individual transactions.
  ============================================================ */

  const behaviorTransactions =
    periodTransactions.filter(
      (transaction) =>
        transaction.type === 'expense' &&
        Number(transaction.amount || 0) > 0 &&
        transaction.date
    );

  let spendingBehavior = 0;

  if (behaviorTransactions.length > 0) {
    /* ------------------------------------------------------------
       1. SPENDING CONSISTENCY
    ------------------------------------------------------------ */

    const dailySpending: Record<string, number> = {};

    behaviorTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const dayKey = date.toISOString().split('T')[0];

      dailySpending[dayKey] =
        (dailySpending[dayKey] || 0) +
        Number(transaction.amount || 0);
    });

    const dailyAmounts =
      Object.values(dailySpending);

    let consistencyScore = 50;

    if (dailyAmounts.length >= 2) {
      const average =
        dailyAmounts.reduce(
          (sum, value) => sum + value,
          0
        ) / dailyAmounts.length;

      const variance =
        dailyAmounts.reduce(
          (sum, value) =>
            sum +
            Math.pow(value - average, 2),
          0
        ) / dailyAmounts.length;

      const standardDeviation =
        Math.sqrt(variance);

      const coefficient =
        average > 0
          ? standardDeviation / average
          : 0;

      consistencyScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            100 - coefficient * 50
          )
        )
      );
    }

    /* ------------------------------------------------------------
       2. SPENDING TREND
    ------------------------------------------------------------ */

    const sortedExpenses = [
      ...behaviorTransactions,
    ].sort((a, b) => {
      const dateA =
        a.date
          ? new Date(a.date).getTime()
          : 0;

      const dateB =
        b.date
          ? new Date(b.date).getTime()
          : 0;

      return dateA - dateB;
    });

    let trendScore = 50;

    if (sortedExpenses.length >= 4) {
      const midpoint =
        Math.floor(
          sortedExpenses.length / 2
        );

      const earlierExpenses =
        sortedExpenses.slice(
          0,
          midpoint
        );

      const recentExpenses =
        sortedExpenses.slice(midpoint);

      const earlierTotal =
        earlierExpenses.reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount || 0
            ),
          0
        );

      const recentTotal =
        recentExpenses.reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount || 0
            ),
          0
        );

      const earlierAverage =
        earlierTotal /
        Math.max(
          1,
          earlierExpenses.length
        );

      const recentAverage =
        recentTotal /
        Math.max(
          1,
          recentExpenses.length
        );

      if (earlierAverage > 0) {
        const change =
          ((recentAverage -
            earlierAverage) /
            earlierAverage) *
          100;

        trendScore = Math.max(
          0,
          Math.min(
            100,
            Math.round(
              70 - change * 0.5
            )
          )
        );
      }
    }

    /* ------------------------------------------------------------
       3. LARGE-SPENDING BEHAVIOR
    ------------------------------------------------------------ */

    const amounts =
      behaviorTransactions
        .map((transaction) =>
          Number(
            transaction.amount || 0
          )
        )
        .sort((a, b) => a - b);

    const median =
      amounts.length % 2 === 0
        ? (
            amounts[
              amounts.length / 2 - 1
            ] +
            amounts[
              amounts.length / 2
            ]
          ) / 2
        : amounts[
            Math.floor(
              amounts.length / 2
            )
          ];

    const largeTransactions =
      median > 0
        ? amounts.filter(
            (amount) =>
              amount > median * 3
          ).length
        : 0;

    const largeTransactionRatio =
      largeTransactions /
      Math.max(
        1,
        amounts.length
      );

    const largeSpendingScore =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            100 -
              largeTransactionRatio *
                100
          )
        )
      );

    /* ------------------------------------------------------------
       FINAL BEHAVIOR SCORE
    ------------------------------------------------------------ */

    spendingBehavior =
      Math.round(
        consistencyScore * 0.4 +
        trendScore * 0.35 +
        largeSpendingScore * 0.25
      );

    spendingBehavior = Math.max(
      0,
      Math.min(
        100,
        spendingBehavior
      )
    );
  }

  const healthScore = Math.round(
    (Math.max(0, savingsRate) +
      Math.max(0, budgetControl) +
      spendingBehavior) /
      3
  );
  return (
    <div className="space-y-6">

      {/* Greeting */}
      <Reveal>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Insights
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Deep analysis of your spending behavior
            </p>
          </div>

          <MonthSelector
            value={selectedPeriod}
            onChange={(period) => setSelectedPeriod(period)}
          />
        </div>
      </Reveal>

      {/* Spending Overview */}
      <Reveal delay={50}>
        <div className="glass-card p-5">
          <span className="metric-label">
            Spending Overview
          </span>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">

            <StatBox
              label={
                selectedPeriod.type === 'all'
                  ? 'All Time Expense'
                  : 'Selected Month'
              }
              value={`₹${totalExpense.toLocaleString(
                'en-IN'
              )}`}
            />

            <StatBox
              label="Income"
              value={`₹${totalIncome.toLocaleString(
                'en-IN'
              )}`}
            />

            <StatBox
              label="Avg / Day"
              value={`₹${avgPerDay.toLocaleString(
                'en-IN'
              )}`}
            />

            <StatBox
              label="Top Category"
              value={
                topCategory?.category || 'N/A'
              }
              change={
                topCategory
                  ? `${topCategory.percentage}%`
                  : ''
              }
              trend="up"
            />

          </div>
        </div>
      </Reveal>

      {/* Monthly Comparison */}
      <Reveal delay={100}>
        <div className="glass-card p-5">

          <span className="metric-label">
            Monthly Comparison
          </span>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <BarChart
              data={monthlyComparison}
              barGap={8}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#111412"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 12,
                  fill: '#4B5563',
                }}
              />

              <YAxis
                tick={{
                  fontSize: 12,
                  fill: '#4B5563',
                }}
              />

              <Tooltip
                contentStyle={{
                  background: '#0C0F0D',
                  border:
                    '1px solid #1a1f1c',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />

              <Bar
                dataKey="income"
                fill="#00FF88"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                opacity={0.4}
              />

              <Bar
                dataKey="expense"
                fill="#00D97E"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>

        </div>
      </Reveal>

      {/* Category Analysis / Breakdown */}
<Reveal delay={150}>
  <div className="glass-card p-5">

    <div className="flex items-center justify-between mb-4">
      <span className="metric-label">
        {showCategoryAnalysis
          ? 'Category Analysis'
          : 'Breakdown by Amount'}
      </span>

      <button
        type="button"
        onClick={() =>
          setShowCategoryAnalysis(
            !showCategoryAnalysis
          )
        }
        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        {showCategoryAnalysis
          ? 'View Breakdown'
          : 'View Category Analysis'}
      </button>
    </div>

    {showCategoryAnalysis ? (
      /* ============================
         CATEGORY ANALYSIS
      ============================ */
      <ResponsiveContainer
        width="100%"
        height={260}
      >
        <PieChart>

          <Pie
            data={categoryBreakdown}
            dataKey="percentage"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
          >
            {categoryBreakdown.map(
              (_, i) => (
                <Cell
                  key={i}
                  fill={
                    PIE_COLORS[
                      i % PIE_COLORS.length
                    ]
                  }
                />
              )
            )}
          </Pie>

          <Tooltip
            contentStyle={{
              background: '#0C0F0D',
              border:
                '1px solid #1a1f1c',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />

        </PieChart>
      </ResponsiveContainer>
    ) : (
      /* ============================
         BREAKDOWN BY AMOUNT
      ============================ */
      <div className="space-y-3">

        {categoryBreakdown.map(
          (cat, i) => (
            <div key={cat.category}>

              <div className="flex items-center justify-between mb-1">

                <div className="flex items-center gap-2">

                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background:
                        PIE_COLORS[
                          i %
                            PIE_COLORS.length
                        ],
                    }}
                  />

                  <span className="text-sm text-gray-200">
                    {cat.category}
                  </span>

                  {cat.percentage >
                    40 && (
                    <span className="text-[10px] text-amber-400 font-medium">
                      High concentration
                    </span>
                  )}

                </div>

                <span className="text-xs text-gray-400">
                  ₹
                  {cat.total.toLocaleString(
                    'en-IN'
                  )}{' '}
                  · {cat.percentage}%
                </span>

              </div>

              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">

                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${cat.percentage}%`,
                    background:
                      PIE_COLORS[
                        i %
                          PIE_COLORS.length
                      ],
                  }}
                />

              </div>

            </div>
          )
        )}

      </div>
    )}

  </div>
</Reveal>
      {/* Behavior Trend */}
      <Reveal delay={200}>
        <div className="glass-card p-5">

          <span className="metric-label">
            Behavior Trends (30 days)
          </span>

          <ResponsiveContainer
            width="100%"
            height={200}
          >
            <AreaChart
              data={dailySpendingTrend}
            >

              <defs>
                <linearGradient
                  id="insightTrend"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#00FF88"
                    stopOpacity={0.3}
                  />

                  <stop
                    offset="100%"
                    stopColor="#00FF88"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#111412"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                tick={{
                  fontSize: 10,
                  fill: '#4B5563',
                }}
              />

              <YAxis
                tick={{
                  fontSize: 10,
                  fill: '#4B5563',
                }}
              />

              <Tooltip
                contentStyle={{
                  background: '#0C0F0D',
                  border:
                    '1px solid #1a1f1c',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />

              <Area
                type="monotone"
                dataKey="amount"
                stroke="#00FF88"
                strokeWidth={2}
                fill="url(#insightTrend)"
              />

            </AreaChart>
          </ResponsiveContainer>

        </div>
      </Reveal>

      {/* Financial Health */}
      <Reveal delay={250}>
        <div className="glass-card p-5">

          <div className="flex items-center justify-between mb-4">

            <span className="metric-label">
              Financial Health Score
            </span>

            <Activity className="w-4 h-4 text-emerald-400/50" />

          </div>

          <div className="flex items-center gap-6">

            <div className="relative">

              <ResponsiveContainer
                width={120}
                height={120}
              >
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={[
                    {
                      value: healthScore,
                      fill: '#00FF88',
                    },
                  ]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background={{
                      fill: '#111412',
                    }}
                    dataKey="value"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center">

                <span className="text-2xl font-bold text-white">
                  {healthScore}
                </span>

                <span className="text-[10px] text-gray-500">
                  / 100
                </span>

              </div>

            </div>

            <div className="flex-1 space-y-3">

              <HealthRow
                label="Savings Rate"
                value={savingsRate}
                status={
                  savingsRate >= 50
                    ? 'GOOD'
                    : savingsRate >= 20
                    ? 'MODERATE'
                    : 'LOW'
                }
              />

              <HealthRow
                label="Budget Control"
                value={budgetControl}
                status={
                  budgetControl >= 60
                    ? 'GOOD'
                    : 'MODERATE'
                }
              />

              <HealthRow
                label="Spending Behavior"
                value={spendingBehavior}
                status={
                  spendingBehavior >= 70
                    ? 'GOOD'
                    : spendingBehavior >= 40
                    ? 'MODERATE'
                    : 'LOW'
                }
              />

            </div>

          </div>

        </div>
      </Reveal>

      {/* Money Leaks */}
      <Reveal delay={300}>
        <div className="glass-card p-5">

          <div className="flex items-center justify-between mb-4">

            <span className="metric-label">
              Money Leaks
            </span>

            <Droplet className="w-4 h-4 text-emerald-400/50" />

          </div>

          <div className="space-y-3">

            {moneyLeaks.map(
              (leak, i) => (
                <div
                  key={i}
                  className="bg-emerald-400/[0.04] border border-emerald-400/10 rounded-xl p-4"
                >

                  <div className="flex items-start gap-3">

                    <Droplet className="w-4 h-4 text-emerald-400 mt-0.5" />

                    <div className="flex-1">

                      <p className="text-sm text-gray-100">
                        {leak.count} small{' '}
                        {leak.category}{' '}
                        purchases from{' '}
                        {leak.merchant}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Total: ₹
                        {leak.total.toLocaleString(
                          'en-IN'
                        )}{' '}
                        · Average: ₹
                        {leak.average.toLocaleString(
                          'en-IN'
                        )}{' '}
                        per transaction
                      </p>

                      <p className="text-xs text-emerald-400 mt-1.5">
                        Reduce by {leak.reductionPercent}% to save ₹
                        {leak.potentialSavings.toLocaleString(
                          'en-IN'
                        )}
                      </p>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </div>
      </Reveal>

      {/* Saving Suggestions */}
      <Reveal delay={350}>
        <div className="glass-card p-5">

          <div className="flex items-center justify-between mb-4">

            <span className="metric-label">
              Smart Saving Suggestions
            </span>

            <Lightbulb className="w-4 h-4 text-amber-400/50" />

          </div>

          <div className="space-y-3">

            {savingSuggestions.map(
              (s) => (
                <div
                  key={s.category}
                  className="border border-white/[0.06] rounded-xl p-4"
                >

                  <div className="flex items-center justify-between mb-2">

                    <span className="text-sm font-medium text-white">
                      {s.category}
                    </span>

                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      Save Up To  
                      {s.potentialSavings.toLocaleString(
                        'en-IN'
                      )}
                      /mo
                    </span>

                  </div>

                  <p className="text-xs text-gray-400">
                    {s.advice}
                  </p>

                </div>
              )
            )}

          </div>

        </div>
      </Reveal>

      {/* All Insights */}
      <Reveal delay={400}>
        <div className="glass-card p-5">

          <span className="metric-label">
            All Insights
          </span>

          <div className="space-y-3 mt-3">

            {insights.map(
              (insight, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3 border ${
                    insight.type === 'positive'
                      ? 'bg-emerald-400/[0.04] border-emerald-400/10'
                      : insight.type === 'warning'
                      ? 'bg-amber-400/[0.04] border-amber-400/10'
                      : insight.type === 'danger'
                      ? 'bg-red-400/[0.04] border-red-400/10'
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >

                  <div className="flex items-start gap-2">

                    {insight.type ===
                    'danger' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                    ) : insight.type ===
                      'positive' ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5" />
                    )}

                    <div>

                      <p className="text-sm font-medium text-gray-100">
                        {insight.title}
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {insight.detail}
                      </p>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </div>
      </Reveal>

    </div>
  );
}

// -----------------------------
// STAT BOX
// -----------------------------

function StatBox({
  label,
  value,
  change,
  trend,
}: {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-3">

      <p className="metric-label">
        {label}
      </p>

      <p className="text-lg font-bold text-white mt-1">
        {value}
      </p>

      {change && (
        <p
          className={`text-xs mt-0.5 flex items-center gap-1 ${
            trend === 'up'
              ? 'text-red-400'
              : 'text-emerald-400'
          }`}
        >
          {trend === 'up' ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}

          {change}
        </p>
      )}

    </div>
  );
}

// -----------------------------
// HEALTH ROW
// -----------------------------

function HealthRow({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: string;
}) {
  return (
    <div>

      <div className="flex items-center justify-between mb-1">

        <span className="text-sm text-gray-300">
          {label}
        </span>

        <span
          className={`text-[10px] font-semibold ${
            status === 'GOOD'
              ? 'text-emerald-400'
              : status === 'MODERATE'
              ? 'text-amber-400'
              : 'text-red-400'
          }`}
        >
          {status}
        </span>

      </div>

      <div className="h-2 bg-white/5 rounded-full overflow-hidden">

        <div
          className={`h-full rounded-full ${
            status === 'GOOD'
              ? 'bg-emerald-400'
              : status === 'MODERATE'
              ? 'bg-amber-400'
              : 'bg-red-400'
          }`}
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}
