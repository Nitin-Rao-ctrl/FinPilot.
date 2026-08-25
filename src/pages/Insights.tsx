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

  useEffect(() => {
    fetch('http://localhost:5000/api/transactions')
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) =>
        console.error('Failed to fetch transactions:', err)
      );
  }, []);

  // -----------------------------
  // TRANSACTIONS
  // -----------------------------

  const expenses = transactions.filter(
    (t) => t.type === 'expense'
  );

  const incomes = transactions.filter(
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

  const moneyLeaks = categoryBreakdown
    .filter((cat) => cat.total > 0)
    .slice(0, 3)
    .map((cat) => {
      const categoryTransactions =
        expenses.filter(
          (t) =>
            (t.category || 'Other') ===
            cat.category
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
        potentialSavings: Math.round(
          cat.total * 0.2
        ),
      };
    });

  // -----------------------------
  // SAVING SUGGESTIONS
  // -----------------------------

  const savingSuggestions =
    categoryBreakdown
      .slice(0, 3)
      .map((cat) => ({
        category: cat.category,
        potentialSavings: Math.round(
          cat.total * 0.2
        ),
        advice: `Reducing ${cat.category} spending by 20% could save approximately ₹${Math.round(
          cat.total * 0.2
        )} per month.`,
      }));

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
          detail: `You have logged ${transactions.length} transactions.`,
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
    totalExpense > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              100 -
                (totalExpense /
                  Math.max(
                    totalIncome,
                    totalExpense
                  )) *
                  100
            )
          )
        )
      : 0;

  const spendingBehavior =
    expenses.length > 0 ? 75 : 0;

  const healthScore = Math.round(
    (savingsRate +
      budgetControl +
      spendingBehavior) /
      3
  );

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Insights
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Deep analysis of your spending behavior
          </p>
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
              label="This Month"
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

      {/* Category Analysis */}
      <Reveal delay={150}>
        <div className="grid md:grid-cols-2 gap-4">

          <div className="glass-card p-5">

            <span className="metric-label">
              Category Analysis
            </span>

            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <PieChart>

                <Pie
                  data={categoryBreakdown}
                  dataKey="percentage"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categoryBreakdown.map(
                    (_, i) => (
                      <Cell
                        key={i}
                        fill={
                          PIE_COLORS[
                            i %
                              PIE_COLORS.length
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

          </div>

          <div className="glass-card p-5">

            <span className="metric-label">
              Breakdown by Amount
            </span>

            <div className="space-y-3 mt-3">

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
          </div>

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
                    : 'MODERATE'
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
                        Reduce by 20% to save ₹
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
                      Save ₹
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