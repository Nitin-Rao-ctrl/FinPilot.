import { useState } from 'react';
import {
  HelpCircle,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Reveal } from '@/lib/animations';

type Category =
  | 'Food'
  | 'Shopping'
  | 'Transport'
  | 'Entertainment'
  | 'Bills'
  | 'Health'
  | 'Other';

type Analysis = {
  currentBalance: number;
  afterPurchase: number;
  dailyLimit: number;
  proposed: number;
  budgetUtilization: number;
  categoryPercentage: number;
  budgetRemaining: number;
  goalImpact: 'LOW' | 'MODERATE' | 'HIGH';
  status: 'GOOD' | 'CAUTION' | 'NOT RECOMMENDED';
  message: string;
  warnings: string[];
};

export function AskPage() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  function handleAnalyze() {
    const purchaseAmount = Number(amount);

    if (!purchaseAmount || purchaseAmount <= 0) {
      setAnalysis(null);
      return;
    }

    /*
      IMPORTANT:
      No fake/mock expense is loaded here.

      If your app later has real balance/budget data,
      these values can be connected to that data.
    */

    const currentBalance = getCurrentBalance();
    const monthlyBudget = getMonthlyBudget();
    const categorySpent = getCategorySpent(category);

    const afterPurchase = Math.max(
      0,
      currentBalance - purchaseAmount
    );

    const dailyLimit =
      monthlyBudget > 0
        ? Math.max(0, monthlyBudget / 30)
        : 0;

    const budgetRemaining = Math.max(
      0,
      monthlyBudget - purchaseAmount
    );

    const budgetUtilization =
      monthlyBudget > 0
        ? Math.min(
            100,
            (purchaseAmount / monthlyBudget) * 100
          )
        : 0;

    const previousCategorySpent = categorySpent;

    const categoryPercentage =
      monthlyBudget > 0
        ? Math.min(
            100,
            ((previousCategorySpent + purchaseAmount) /
              monthlyBudget) *
              100
          )
        : 0;

    const warnings: string[] = [];

    if (
      dailyLimit > 0 &&
      purchaseAmount > dailyLimit
    ) {
      warnings.push(
        `Expense exceeds your recommended daily limit by ₹${Math.round(
          purchaseAmount - dailyLimit
        ).toLocaleString('en-IN')}`
      );
    }

    if (
      categoryPercentage > 40
    ) {
      warnings.push(
        `${category} spending would be relatively high compared with your budget`
      );
    }

    if (
      monthlyBudget > 0 &&
      purchaseAmount > monthlyBudget * 0.5
    ) {
      warnings.push(
        'This purchase would use a significant portion of your available budget'
      );
    }

    if (
      currentBalance > 0 &&
      purchaseAmount > currentBalance
    ) {
      warnings.push(
        'You do not currently have enough available balance for this purchase'
      );
    }

    let status: Analysis['status'] = 'GOOD';
    let goalImpact: Analysis['goalImpact'] = 'LOW';

    if (
      currentBalance === 0 &&
      monthlyBudget === 0
    ) {
      status = 'CAUTION';
      goalImpact = 'MODERATE';
    } else if (
      currentBalance > 0 &&
      purchaseAmount > currentBalance
    ) {
      status = 'NOT RECOMMENDED';
      goalImpact = 'HIGH';
    } else if (
      warnings.length >= 2
    ) {
      status = 'CAUTION';
      goalImpact = 'MODERATE';
    } else if (
      warnings.length === 1
    ) {
      status = 'CAUTION';
      goalImpact = 'LOW';
    }

    let message = '';

    if (currentBalance === 0 && monthlyBudget === 0) {
      message =
        `You are planning to spend ₹${purchaseAmount.toLocaleString(
          'en-IN'
        )} on ${category.toLowerCase()}. ` +
        `There is not enough financial data available yet to give a strong recommendation. ` +
        `Add your income, budget, and transactions to get a more accurate analysis.`;
    } else if (
      currentBalance > 0 &&
      purchaseAmount > currentBalance
    ) {
      message =
        `This purchase is larger than your current available balance. ` +
        `Spending ₹${purchaseAmount.toLocaleString(
          'en-IN'
        )} would not be recommended right now.`;
    } else if (warnings.length > 0) {
      message =
        `You currently have ₹${currentBalance.toLocaleString(
          'en-IN'
        )} available. ` +
        `This ₹${purchaseAmount.toLocaleString(
          'en-IN'
        )} purchase needs some caution based on your current spending pattern.`;
    } else {
      message =
        `You currently have ₹${currentBalance.toLocaleString(
          'en-IN'
        )} available. ` +
        `This ₹${purchaseAmount.toLocaleString(
          'en-IN'
        )} purchase appears manageable based on the available information.`;
    }

    setAnalysis({
      currentBalance,
      afterPurchase,
      dailyLimit,
      proposed: purchaseAmount,
      budgetUtilization,
      categoryPercentage,
      budgetRemaining,
      goalImpact,
      status,
      message,
      warnings,
    });
  }

  function handleReset() {
    setAmount('');
    setCategory('Food');
    setDescription('');
    setAnalysis(null);
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Should I Spend?
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Evaluate a planned expense before you spend
          </p>
        </div>
      </Reveal>

      {/* MAIN ANALYSIS CARD */}
      <Reveal delay={50}>
        <div className="glass-card overflow-hidden neon-border">

          <div className="grid lg:grid-cols-2">

            {/* LEFT SIDE */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/[0.05]">

              {/* TITLE */}
              <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Planned Expense
                  </h2>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Tell us what you're planning to buy
                  </p>
                </div>

              </div>

              {/* AMOUNT */}
              <div className="mb-5">

                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Amount
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setAnalysis(null);
                    }}
                    placeholder="Enter amount"
                    className="form-input pl-10 w-full"
                  />

                </div>

              </div>

              {/* CATEGORY */}
              <div className="mb-5">

                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(
                      e.target.value as Category
                    );
                    setAnalysis(null);
                  }}
                  className="form-input w-full"
                >
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transport">
                    Transport
                  </option>
                  <option value="Entertainment">
                    Entertainment
                  </option>
                  <option value="Bills">Bills</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>

              </div>

              {/* DESCRIPTION */}
              <div className="mb-5">

                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Description (Optional)
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setAnalysis(null);
                  }}
                  placeholder="What are you planning to buy?"
                  className="form-input w-full"
                />

              </div>

              {/* BUTTONS */}
              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={
                    !amount ||
                    Number(amount) <= 0
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-emerald"
                >
                  ANALYZE EXPENSE
                  <ArrowRight className="w-4 h-4" />
                </button>

                {analysis && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-3 rounded-xl border border-white/[0.08] text-gray-400 text-sm hover:text-white hover:bg-white/[0.03] transition-all"
                  >
                    Reset
                  </button>
                )}

              </div>

            </div>

            {/* RIGHT SIDE */}
            <div className="p-6">

              {!analysis ? (
                <EmptyAnalysis />
              ) : (
                <AnalysisResult
                  analysis={analysis}
                  description={description}
                  category={category}
                />
              )}

            </div>

          </div>

        </div>
      </Reveal>

      {/* FINANCIAL IMPACT */}
      {analysis && (
        <Reveal delay={100}>

          <div className="glass-card p-6">

            <p className="metric-label mb-5">
              Financial Impact Breakdown
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              <MetricBox
                label="Budget Utilization"
                value={
                  analysis.budgetUtilization > 0
                    ? `${analysis.budgetUtilization.toFixed(
                        1
                      )}%`
                    : 'N/A'
                }
                warning={
                  analysis.budgetUtilization > 80
                }
              />

              <MetricBox
                label="Category %"
                value={
                  analysis.categoryPercentage > 0
                    ? `${Math.round(
                        analysis.categoryPercentage
                      )}%`
                    : 'N/A'
                }
                warning={
                  analysis.categoryPercentage > 40
                }
              />

              <MetricBox
                label="Budget Remaining"
                value={
                  analysis.budgetRemaining > 0
                    ? `₹${analysis.budgetRemaining.toLocaleString(
                        'en-IN'
                      )}`
                    : 'N/A'
                }
                warning={
                  analysis.budgetRemaining === 0
                }
              />

              <MetricBox
                label="Goal Impact"
                value={analysis.goalImpact}
                warning={
                  analysis.goalImpact !== 'LOW'
                }
              />

            </div>

          </div>

        </Reveal>
      )}

    </div>
  );
}

/* ============================================================
   EMPTY ANALYSIS
============================================================ */

function EmptyAnalysis() {
  return (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center">

      <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mb-4">
        <Info className="w-5 h-5 text-gray-500" />
      </div>

      <h3 className="text-sm font-semibold text-gray-300">
        AI Analysis
      </h3>

      <p className="text-xs text-gray-500 max-w-sm mt-2 leading-relaxed">
        Enter an expense amount and click
        <span className="text-gray-300">
          {' '}Analyze Expense{' '}
        </span>
        to see its potential financial impact.
      </p>

    </div>
  );
}

/* ============================================================
   ANALYSIS RESULT
============================================================ */

function AnalysisResult({
  analysis,
  description,
  category,
}: {
  analysis: Analysis;
  description: string;
  category: Category;
}) {
  const isGood = analysis.status === 'GOOD';
  const isCaution = analysis.status === 'CAUTION';

  return (
    <div>

      {/* ANALYSIS HEADER */}
      <div className="flex items-center justify-between mb-5">

        <div className="flex items-center gap-2">

          <span
            className={`w-2 h-2 rounded-full ${
              isGood
                ? 'bg-emerald-400'
                : isCaution
                ? 'bg-amber-400'
                : 'bg-red-400'
            }`}
          />

          <span className="text-xs uppercase tracking-[0.15em] font-semibold text-emerald-400">
            AI Analysis
          </span>

        </div>

        <span
          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
            isGood
              ? 'bg-emerald-400/10 text-emerald-400'
              : isCaution
              ? 'bg-amber-400/10 text-amber-400'
              : 'bg-red-400/10 text-red-400'
          }`}
        >
          {analysis.status}
        </span>

      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mb-4">

        <AnalysisStat
          label="Current Balance"
          value={
            analysis.currentBalance > 0
              ? `₹${analysis.currentBalance.toLocaleString(
                  'en-IN'
                )}`
              : '₹0'
          }
        />

        <AnalysisStat
          label="After Purchase"
          value={`₹${analysis.afterPurchase.toLocaleString(
            'en-IN'
          )}`}
          highlight={!isGood}
        />

        <AnalysisStat
          label="Daily Limit"
          value={
            analysis.dailyLimit > 0
              ? `₹${Math.round(
                  analysis.dailyLimit
                ).toLocaleString('en-IN')}`
              : 'N/A'
          }
        />

        <AnalysisStat
          label="Proposed"
          value={`₹${analysis.proposed.toLocaleString(
            'en-IN'
          )}`}
          highlight={!isGood}
        />

      </div>

      {/* MESSAGE */}
      <div
        className={`rounded-xl p-4 border ${
          isGood
            ? 'bg-emerald-400/[0.03] border-emerald-400/10'
            : isCaution
            ? 'bg-amber-400/[0.03] border-amber-400/10'
            : 'bg-red-400/[0.03] border-red-400/10'
        }`}
      >

        <div className="flex items-start gap-3">

          {isGood ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                isCaution
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            />
          )}

          <div>

            <p className="text-sm text-gray-300 leading-relaxed">
              {analysis.message}
            </p>

            {description && (
              <p className="text-xs text-gray-600 mt-3">
                Planned for: {description}
              </p>
            )}

          </div>

        </div>

      </div>

      {/* WARNINGS */}
      {analysis.warnings.length > 0 && (
        <div className="mt-4 space-y-2">

          {analysis.warnings.map(
            (warning, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-xs text-gray-400"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    isCaution
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                />

                <span>{warning}</span>
              </div>
            )
          )}

        </div>
      )}

      {/* CATEGORY */}
      <div className="mt-4 text-xs text-gray-600">
        Category: {category}
      </div>

    </div>
  );
}

/* ============================================================
   ANALYSIS STAT
============================================================ */

function AnalysisStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white/[0.025] rounded-xl p-4">

      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 mb-2">
        {label}
      </p>

      <p
        className={`text-lg font-bold ${
          highlight
            ? 'text-amber-400'
            : 'text-white'
        }`}
      >
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   METRIC BOX
============================================================ */

function MetricBox({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="bg-white/[0.025] rounded-xl p-4">

      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 mb-2">
        {label}
      </p>

      <p
        className={`text-lg font-bold ${
          warning
            ? 'text-amber-400'
            : 'text-white'
        }`}
      >
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   DATA HELPERS
============================================================ */

/*
  These functions deliberately return empty/zero values
  instead of using mock data.

  This prevents fake information such as:
  ₹3,160 balance
  ₹350 daily limit
  Food 41%
  etc.
*/

function getCurrentBalance(): number {
  try {
    const stored =
      localStorage.getItem('smartspend_balance');

    if (!stored) {
      return 0;
    }

    const value = Number(stored);

    return Number.isFinite(value)
      ? value
      : 0;
  } catch {
    return 0;
  }
}

function getMonthlyBudget(): number {
  try {
    const stored =
      localStorage.getItem('smartspend_budget');

    if (!stored) {
      return 0;
    }

    const parsed = JSON.parse(stored);

    if (typeof parsed === 'number') {
      return parsed;
    }

    if (
      parsed &&
      typeof parsed.totalBudget === 'number'
    ) {
      return parsed.totalBudget;
    }

    if (
      parsed &&
      typeof parsed.amount === 'number'
    ) {
      return parsed.amount;
    }

    return 0;
  } catch {
    return 0;
  }
}

function getCategorySpent(
  category: Category
): number {
  try {
    const stored =
      localStorage.getItem(
        'smartspend_transactions'
      );

    if (!stored) {
      return 0;
    }

    const transactions = JSON.parse(stored);

    if (!Array.isArray(transactions)) {
      return 0;
    }

    return transactions.reduce(
      (total: number, transaction: any) => {
        const transactionCategory =
          transaction.category;

        const transactionAmount =
          Number(transaction.amount);

        if (
          transactionCategory === category &&
          Number.isFinite(transactionAmount)
        ) {
          return total + transactionAmount;
        }

        return total;
      },
      0
    );
  } catch {
    return 0;
  }
}