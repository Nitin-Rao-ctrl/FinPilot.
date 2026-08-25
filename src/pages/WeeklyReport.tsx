import { useEffect, useState } from 'react';
import {
  FileText,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { Reveal } from '@/lib/animations';

export function WeeklyReportPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [generated, setGenerated] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/transactions')
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) =>
        console.error('Failed to fetch transactions:', err)
      );
  }, []);

  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const weekTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= weekStart && date <= now;
  });

  const expenses = weekTransactions.filter(
    (t) => t.type === 'expense'
  );

  const incomes = weekTransactions.filter(
    (t) => t.type === 'income'
  );

  const spending = expenses.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const income = incomes.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const savings = income - spending;

  // -----------------------------
  // CATEGORY ANALYSIS
  // -----------------------------

  const categoryMap: Record<string, number> = {};

  expenses.forEach((t) => {
    const category = t.category || 'Other';

    categoryMap[category] =
      (categoryMap[category] || 0) +
      Number(t.amount || 0);
  });

  const categories = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const biggestCategory =
    categories.length > 0
      ? categories[0].category
      : 'No spending';

  const biggestCategoryAmount =
    categories.length > 0
      ? categories[0].amount
      : 0;

  const biggestCategoryPercentage =
    spending > 0
      ? Math.round(
          (biggestCategoryAmount / spending) * 100
        )
      : 0;

  // -----------------------------
  // WEEK DATES
  // -----------------------------

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  // -----------------------------
  // INSIGHT
  // -----------------------------

  let aiInsight =
    'Add more transactions to generate a personalized financial insight.';

  if (transactions.length > 0 && spending === 0) {
    aiInsight =
      'You have no recorded expenses for this week. Keep tracking your spending to maintain accurate financial insights.';
  } else if (spending > income && income > 0) {
    aiInsight =
      'Your spending is currently higher than your income for this week. Consider reducing discretionary expenses.';
  } else if (biggestCategory !== 'No spending') {
    aiInsight = `${biggestCategory} is your biggest spending category this week, accounting for approximately ${biggestCategoryPercentage}% of your recorded expenses.`;
  }

  // -----------------------------
  // SECTIONS
  // -----------------------------

  const sections = [
    {
      heading: 'Spending Overview',
      body:
        spending > 0
          ? `You spent ₹${spending.toLocaleString(
              'en-IN'
            )} across ${expenses.length} expense transaction${
              expenses.length === 1 ? '' : 's'
            } this week.`
          : 'No expense transactions were recorded this week.',
    },

    {
      heading: 'Income & Savings',
      body:
        income > 0
          ? `You recorded ₹${income.toLocaleString(
              'en-IN'
            )} in income. Your calculated savings for this period are ₹${savings.toLocaleString(
              'en-IN'
            )}.`
          : 'No income transactions were recorded this week.',
    },

    {
      heading: 'Top Spending Category',
      body:
        biggestCategory !== 'No spending'
          ? `${biggestCategory} was your highest spending category with ₹${biggestCategoryAmount.toLocaleString(
              'en-IN'
            )} spent.`
          : 'There is not enough spending data to identify a top category.',
    },

    {
      heading: 'Recommendation',
      body:
        spending > income && income > 0
          ? 'Try keeping weekly expenses below your recorded income and review your highest spending category.'
          : biggestCategory !== 'No spending'
          ? `Review your ${biggestCategory} expenses and look for opportunities to reduce unnecessary spending.`
          : 'Continue recording income and expenses to receive more useful recommendations.',
    },
  ];

  function handleGenerate() {
    setGenerating(true);

    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1000);
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <Reveal>
        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold text-white">
              Weekly Report
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              {formatDate(weekStart)} — {formatDate(now)}
            </p>
          </div>

          {!generated && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          )}

        </div>
      </Reveal>

      {!generated ? (
        <Reveal delay={50}>

          <div className="glass-card p-12 text-center">

            <FileText className="w-8 h-8 text-gray-700 mx-auto mb-4" />

            <h3 className="text-sm font-semibold text-white mb-2">
              No report this week yet
            </h3>

            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              Generate your weekly financial report using
              your recorded transactions.
            </p>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>

          </div>

        </Reveal>
      ) : (
        <>

          {/* Report Header */}
          <Reveal delay={50}>

            <div className="glass rounded-2xl p-6 neon-border">

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.04]">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">

                    <FileText className="w-5 h-5 text-emerald-400" />

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-white">
                      Weekly Financial Intelligence
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatDate(weekStart)} — {formatDate(now)}
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-2">

                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />

                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                    Live Data
                  </span>

                </div>

              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">

                <div className="bg-white/[0.02] rounded-xl p-4">

                  <p className="metric-label">
                    Spending
                  </p>

                  <p className="text-2xl font-bold text-white mt-1">
                    ₹{spending.toLocaleString('en-IN')}
                  </p>

                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">

                    <TrendingDown className="w-3 h-3 text-red-400" />

                    {expenses.length} transactions

                  </p>

                </div>

                <div className="bg-white/[0.02] rounded-xl p-4">

                  <p className="metric-label">
                    Savings
                  </p>

                  <p
                    className={`text-2xl font-bold mt-1 ${
                      savings >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    ₹{savings.toLocaleString('en-IN')}
                  </p>

                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">

                    {savings >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}

                    Income minus spending

                  </p>

                </div>

                <div className="bg-white/[0.02] rounded-xl p-4">

                  <p className="metric-label">
                    Biggest Category
                  </p>

                  <p className="text-2xl font-bold text-white mt-1 truncate">
                    {biggestCategory}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {biggestCategoryAmount > 0
                      ? `₹${biggestCategoryAmount.toLocaleString(
                          'en-IN'
                        )}`
                      : 'No data'}
                  </p>

                </div>

              </div>

              {/* AI Insight */}
              <div className="bg-emerald-400/[0.03] border border-emerald-400/15 rounded-xl p-5">

                <div className="flex items-center gap-2 mb-3">

                  <Sparkles className="w-4 h-4 text-emerald-400" />

                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                    Financial Insight
                  </span>

                </div>

                <p className="text-sm text-gray-300 leading-relaxed">
                  {aiInsight}
                </p>

              </div>

            </div>

          </Reveal>

          {/* Detailed Breakdown */}
          <Reveal delay={100}>

            <div className="glass rounded-2xl p-6">

              <span className="metric-label">
                Detailed Breakdown
              </span>

              <div className="space-y-5 mt-4">

                {sections.map(
                  (section, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-emerald-400/20 pl-4"
                    >

                      <h4 className="text-sm font-semibold text-white mb-1">
                        {section.heading}
                      </h4>

                      <p className="text-sm text-gray-400 leading-relaxed">
                        {section.body}
                      </p>

                    </div>
                  )
                )}

              </div>

            </div>

          </Reveal>

          {/* Category Breakdown */}
          <Reveal delay={150}>

            <div className="glass rounded-2xl p-6">

              <div className="flex items-center justify-between">

                <span className="metric-label">
                  Category Breakdown
                </span>

                <span className="text-xs text-gray-500">
                  This week
                </span>

              </div>

              <div className="space-y-3 mt-4">

                {categories.length > 0 ? (
                  categories.map((cat) => {

                    const percentage =
                      spending > 0
                        ? Math.round(
                            (cat.amount /
                              spending) *
                              100
                          )
                        : 0;

                    return (
                      <div key={cat.category}>

                        <div className="flex justify-between text-xs mb-1">

                          <span className="text-gray-400">
                            {cat.category}
                          </span>

                          <span className="text-gray-300">
                            ₹
                            {cat.amount.toLocaleString(
                              'en-IN'
                            )}{' '}
                            ({percentage}%)
                          </span>

                        </div>

                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">

                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">
                    No expense data available for
                    this week.
                  </p>
                )}

              </div>

            </div>

          </Reveal>

        </>
      )}

    </div>
  );
}