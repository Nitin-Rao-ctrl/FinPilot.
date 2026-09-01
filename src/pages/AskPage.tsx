import {
  useEffect,
  useState,
} from 'react';

import {
  HelpCircle,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
} from 'lucide-react';

import { Reveal } from '@/lib/animations';
import { supabase } from '@/lib/supabase';
import {
  MonthSelector,
  type SelectedPeriod,
} from '@/components/MonthSelector';

type Category =
  | 'Food'
  | 'Shopping'
  | 'Travel'
  | 'Entertainment'
  | 'Bills'
  | 'Health'
  | 'Education'
  | 'Rent'
  | 'Subscription'
  | 'Personal'
  | 'Other';

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

type Analysis = {
  currentBalance: number;
  afterPurchase: number;
  dailyLimit: number;
  proposed: number;
  budgetUtilization: number;
  categoryPercentage: number;
  budgetRemaining: number;
  currentMonthSpent: number;
  goalImpact: 'LOW' | 'MODERATE' | 'HIGH';
  status:
    | 'GOOD'
    | 'CAUTION'
    | 'NOT RECOMMENDED';
  message: string;
  warnings: string[];
};

const API_URL = 'https://finpilot-backend-23iz.onrender.com';

const CATEGORIES: Category[] = [
  'Food',
  'Shopping',
  'Travel',
  'Entertainment',
  'Bills',
  'Health',
  'Education',
  'Rent',
  'Subscription',
  'Personal',
  'Other',
];


function getCurrentBalance(
  transactions: Transaction[]
) {
  return transactions.reduce(
    (balance, transaction) => {
      const amount = Number(
        transaction.amount || 0
      );

      if (!Number.isFinite(amount)) {
        return balance;
      }

      if (
        transaction.type ===
        'income'
      ) {
        return balance + amount;
      }

      return balance - amount;
    },
    0
  );
}

function getPeriodTransactions(
  transactions: Transaction[],
  period: SelectedPeriod
) {
  if (period.type === 'all') {
    return transactions;
  }

  return transactions.filter((transaction) => {
    if (!transaction.date) return false;

    const date = new Date(transaction.date);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    if (period.type !== 'month') {
      return false;
    }

    return (
      date.getFullYear() === period.year &&
      date.getMonth() === period.month
    );
  });
}

function getPeriodSpent(
  transactions: Transaction[]
) {
  return transactions.reduce(
    (total, transaction) => {
      if (transaction.type !== 'expense') {
        return total;
      }

      const amount = Number(
        transaction.amount || 0
      );

      return (
        total +
        (Number.isFinite(amount) ? amount : 0)
      );
    },
    0
  );
}

function getCategorySpent(
  transactions: Transaction[],
  category: Category
) {
  return transactions.reduce(
    (total, transaction) => {
      if (
        transaction.type !== 'expense' ||
        (transaction.category || 'Other') !== category
      ) {
        return total;
      }

      const amount = Number(
        transaction.amount || 0
      );

      return (
        total +
        (Number.isFinite(amount) ? amount : 0)
      );
    },
    0
  );
}

export function AskPage() {
  const [amount, setAmount] =
    useState('');

  const [category, setCategory] =
    useState<Category>('Food');

  const [description, setDescription] =
    useState('');

  const [analysis, setAnalysis] =
    useState<Analysis | null>(
      null
    );

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

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


  const [loadingData, setLoadingData] =
    useState(true);

  const [dataError, setDataError] =
    useState('');

  async function loadFinancialData() {
    try {
      setLoadingData(true);
      setDataError('');

      const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
  throw new Error('User is not logged in');
}

const response = await fetch(
  `${API_URL}/api/transactions?userId=${encodeURIComponent(
    user.id
  )}`
);

      if (!response.ok) {
        throw new Error(
          'Failed to load transactions'
        );
      }

      const data =
        await response.json();

      setTransactions(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        'Failed to load financial data:',
        error
      );

      setDataError(
        'Could not load financial data. Make sure the backend is running on port 5000.'
      );

      setTransactions([]);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadFinancialData();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'finpilot_selected_period',
      JSON.stringify(selectedPeriod)
    );
  }, [selectedPeriod]);

  function handleAnalyze() {
    const purchaseAmount =
      Number(amount);

    if (
      !purchaseAmount ||
      purchaseAmount <= 0
    ) {
      setAnalysis(null);
      return;
    }

    const periodTransactions =
      getPeriodTransactions(
        transactions,
        selectedPeriod
      );

    const currentBalance =
      getCurrentBalance(
        periodTransactions
      );

    const currentPeriodSpent =
      getPeriodSpent(
        periodTransactions
      );

    const categorySpent =
      getCategorySpent(
        periodTransactions,
        category
      );

    const periodIncome =
      periodTransactions
        .filter(
          (transaction) =>
            transaction.type === 'income'
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount || 0
            ),
          0
        );

    const afterPurchase =
      currentBalance -
      purchaseAmount;

    const daysInPeriod =
      selectedPeriod.type === 'month'
        ? new Date(
            selectedPeriod.year,
            selectedPeriod.month + 1,
            0
          ).getDate()
        : 30;

    const dailyAvailable =
      periodIncome > 0
        ? Math.max(
            0,
            (periodIncome -
              currentPeriodSpent) /
              Math.max(1, daysInPeriod)
          )
        : 0;

    const savingsAfterPurchase =
      periodIncome -
      currentPeriodSpent -
      purchaseAmount;

    const incomeUsed =
      periodIncome > 0
        ? Math.min(
            100,
            ((currentPeriodSpent +
              purchaseAmount) /
              periodIncome) *
              100
          )
        : 0;

    const categoryPercentage =
      periodIncome > 0
        ? Math.min(
            100,
            ((categorySpent +
              purchaseAmount) /
              periodIncome) *
              100
          )
        : 0;

    const warnings: string[] = [];

    if (
      dailyAvailable > 0 &&
      purchaseAmount > dailyAvailable
    ) {
      warnings.push(
        `This purchase is ₹${Math.round(
          purchaseAmount -
            dailyAvailable
        ).toLocaleString(
          'en-IN'
        )} above the amount currently available per day based on this period's income and spending.`
      );
    }

    if (
      periodIncome > 0 &&
      savingsAfterPurchase < 0
    ) {
      warnings.push(
        `This purchase would push this period's spending above its recorded income by ₹${Math.abs(
          savingsAfterPurchase
        ).toLocaleString(
          'en-IN'
        )}.`
      );
    } else if (
      periodIncome > 0 &&
      savingsAfterPurchase <
        periodIncome * 0.1
    ) {
      warnings.push(
        `Only ₹${Math.max(
          0,
          savingsAfterPurchase
        ).toLocaleString(
          'en-IN'
        )} would remain as savings after this purchase.`
      );
    }

    if (
      periodIncome > 0 &&
      categoryPercentage > 40
    ) {
      warnings.push(
        `${category} would represent approximately ${Math.round(
          categoryPercentage
        )}% of this period's recorded income after this purchase.`
      );
    }

    if (currentBalance <= 0) {
      warnings.push(
        'Your selected period balance is not positive.'
      );
    } else if (
      purchaseAmount >
      currentBalance
    ) {
      warnings.push(
        'You do not currently have enough available balance for this purchase.'
      );
    }

    let status: Analysis['status'] =
      'GOOD';

    let goalImpact:
      | Analysis['goalImpact'] =
      'LOW';

    if (
      currentBalance <= 0 &&
      periodIncome <= 0
    ) {
      status = 'CAUTION';
      goalImpact = 'MODERATE';
    } else if (
      purchaseAmount >
      currentBalance
    ) {
      status =
        'NOT RECOMMENDED';
      goalImpact = 'HIGH';
    } else if (
      periodIncome > 0 &&
      savingsAfterPurchase < 0
    ) {
      status =
        'NOT RECOMMENDED';
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

    if (
      currentBalance <= 0 &&
      periodIncome <= 0
    ) {
      message =
        `You are planning to spend ₹${purchaseAmount.toLocaleString(
          'en-IN'
        )} on ${category.toLowerCase()}, but there is not enough recorded financial data in the selected period to give a reliable recommendation yet. Add income and expense transactions first.`;
    } else if (
      purchaseAmount >
      currentBalance
    ) {
      message =
        `This ₹${purchaseAmount.toLocaleString(
          'en-IN'
        )} purchase is larger than your available balance of ₹${currentBalance.toLocaleString(
          'en-IN'
        )}. It is not recommended right now.`;
    } else if (
      periodIncome > 0 &&
      savingsAfterPurchase < 0
    ) {
      message =
        `This purchase would consume more than the remaining savings available from the selected period's recorded income.`;
    } else if (
      warnings.length > 0
    ) {
      message =
        `You can afford this ₹${purchaseAmount.toLocaleString(
          'en-IN'
        )} purchase, but it deserves some caution based on your selected period's spending pattern.`;
    } else {
      message =
        `This ₹${purchaseAmount.toLocaleString(
          'en-IN'
        )} purchase appears manageable based on your selected period's recorded income, spending and available balance.`;
    }

    setAnalysis({
      currentBalance,
      afterPurchase,
      dailyLimit: dailyAvailable,
      proposed: purchaseAmount,
      budgetUtilization: incomeUsed,
      categoryPercentage,
      budgetRemaining:
        Math.max(0, savingsAfterPurchase),
      currentMonthSpent:
        currentPeriodSpent,
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

      {/* ====================================================
          HEADER
      ==================================================== */}

      <Reveal>

        <div className="flex items-start justify-between gap-4">

          <div>

            <h1 className="text-2xl font-bold text-white">
              Should I Spend?
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Evaluate a planned expense using your actual financial data
            </p>

          </div>

          <div className="flex items-center gap-3">
            <MonthSelector
              value={selectedPeriod}
              onChange={(period) =>
                setSelectedPeriod(period)
              }
            />

            <button
              type="button"
              onClick={
                loadFinancialData
              }
            disabled={
              loadingData
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/[0.07] text-gray-400 text-xs hover:text-white hover:bg-white/[0.03] transition-all disabled:opacity-50"
          >

            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingData
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh
            </button>
          </div>

        </div>

      </Reveal>

      {/* ====================================================
          DATA ERROR
      ==================================================== */}

      {dataError && (

        <Reveal>

          <div className="rounded-xl border border-red-400/10 bg-red-400/[0.05] p-4">

            <p className="text-sm text-red-300">
              {dataError}
            </p>

          </div>

        </Reveal>
      )}

      {/* ====================================================
          FINANCIAL SUMMARY
      ==================================================== */}

      <Reveal delay={30}>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          <SummaryCard
            label="Available Balance"
            value={`₹${getCurrentBalance(
              getPeriodTransactions(
                transactions,
                selectedPeriod
              )
            ).toLocaleString(
              'en-IN'
            )}`}
          />

          <SummaryCard
            label="Period Spent"
            value={`₹${getPeriodSpent(
              getPeriodTransactions(
                transactions,
                selectedPeriod
              )
            ).toLocaleString(
              'en-IN'
            )}`}
          />

          <SummaryCard
            label="Period Income"
            value={`₹${getPeriodTransactions(
              transactions,
              selectedPeriod
            )
              .filter(
                (transaction) =>
                  transaction.type === 'income'
              )
              .reduce(
                (sum, transaction) =>
                  sum +
                  Number(
                    transaction.amount || 0
                  ),
                0
              )
              .toLocaleString(
                'en-IN'
              )}`}
          />

          <SummaryCard
            label="Period Savings"
            value={`₹${(
              getPeriodTransactions(
                transactions,
                selectedPeriod
              )
                .filter(
                  (transaction) =>
                    transaction.type === 'income'
                )
                .reduce(
                  (sum, transaction) =>
                    sum +
                    Number(
                      transaction.amount || 0
                    ),
                  0
                ) -
              getPeriodSpent(
                getPeriodTransactions(
                  transactions,
                  selectedPeriod
                )
              )
            ).toLocaleString(
              'en-IN'
            )}`}
          />

        </div>

      </Reveal>

      {/* ====================================================
          MAIN ANALYSIS CARD
      ==================================================== */}

      <Reveal delay={50}>

        <div className="glass-card overflow-hidden neon-border">

          <div className="grid lg:grid-cols-2">

            {/* =================================================
                LEFT
            ================================================= */}

            <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/[0.05]">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">

                  <HelpCircle className="w-5 h-5 text-emerald-400" />

                </div>

                <div>

                  <h2 className="text-sm font-semibold text-white">
                    Planned Expense
                  </h2>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Tell FinPilot what you are planning to buy
                  </p>

                </div>

              </div>

              {/* Amount */}

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
                      setAmount(
                        e.target.value
                      );
                      setAnalysis(
                        null
                      );
                    }}
                    placeholder="Enter amount"
                    className="form-input pl-10 w-full"
                  />

                </div>

              </div>

              {/* Category */}

              <div className="mb-5">

                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(
                      e.target
                        .value as Category
                    );

                    setAnalysis(
                      null
                    );
                  }}
                  className="form-select w-full"
                >

                  {CATEGORIES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* Description */}

              <div className="mb-5">

                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Description
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(
                      e.target
                        .value
                    );

                    setAnalysis(
                      null
                    );
                  }}
                  placeholder="What are you planning to buy?"
                  className="form-input w-full"
                />

              </div>

              {/* Buttons */}

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    handleAnalyze
                  }
                  disabled={
                    loadingData ||
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
                    onClick={
                      handleReset
                    }
                    className="px-5 py-3 rounded-xl border border-white/[0.08] text-gray-400 text-sm hover:text-white hover:bg-white/[0.03] transition-all"
                  >
                    Reset
                  </button>

                )}

              </div>

            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="p-6">

              {!analysis ? (
                <EmptyAnalysis
                  loading={
                    loadingData
                  }
                />
              ) : (
                <AnalysisResult
                  analysis={
                    analysis
                  }
                  description={
                    description
                  }
                  category={
                    category
                  }
                />
              )}

            </div>

          </div>

        </div>

      </Reveal>

      {/* ====================================================
          FINANCIAL IMPACT
      ==================================================== */}

      {analysis && (

        <Reveal delay={100}>

          <div className="glass-card p-6">

            <p className="metric-label mb-5">
              Financial Impact Breakdown
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              <MetricBox
                label="Income Used"
                value={`${analysis.budgetUtilization.toFixed(1)}%`}
                warning={
                  analysis.budgetUtilization >
                  80
                }
              />

              <MetricBox
                label="Category Share"
                value={`${Math.round(analysis.categoryPercentage)}%`}
                warning={
                  analysis.categoryPercentage >
                  40
                }
              />

              <MetricBox
                label="Savings After Purchase"
                value={`₹${analysis.budgetRemaining.toLocaleString('en-IN')}`}
                warning={analysis.budgetRemaining <= 0}
              />

              <MetricBox
                label="Goal Impact"
                value={
                  analysis.goalImpact
                }
                warning={
                  analysis.goalImpact !==
                  'LOW'
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
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card p-4">

      <p className="metric-label">
        {label}
      </p>

      <p className="text-lg font-bold text-white mt-2">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   EMPTY ANALYSIS
============================================================ */

function EmptyAnalysis({
  loading,
}: {
  loading: boolean;
}) {
  return (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center">

      <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mb-4">

        {loading ? (
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
        ) : (
          <Info className="w-5 h-5 text-gray-500" />
        )}

      </div>

      <h3 className="text-sm font-semibold text-gray-300">
        {loading
          ? 'Loading financial data...'
          : 'AI Analysis'}
      </h3>

      <p className="text-xs text-gray-500 max-w-sm mt-2 leading-relaxed">

        {loading
          ? 'Getting your transactions and budget.'
          : 'Enter an expense amount and click Analyze Expense to see its potential financial impact.'}

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
  const isGood =
    analysis.status ===
    'GOOD';

  const isCaution =
    analysis.status ===
    'CAUTION';

  return (
    <div>

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
            FinPilot Analysis
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

      <div className="grid grid-cols-2 gap-3 mb-4">

        <AnalysisStat
          label="Current Balance"
          value={`₹${analysis.currentBalance.toLocaleString(
            'en-IN'
          )}`}
        />

        <AnalysisStat
          label="After Purchase"
          value={`₹${Math.max(
            0,
            analysis.afterPurchase
          ).toLocaleString(
            'en-IN'
          )}`}
          highlight={
            analysis.afterPurchase <
            0
          }
        />

        <AnalysisStat
          label="Daily Limit"
          value={
            analysis.dailyLimit >
            0
              ? `₹${Math.round(
                  analysis.dailyLimit
                ).toLocaleString(
                  'en-IN'
                )}`
              : 'N/A'
          }
        />

        <AnalysisStat
          label="Proposed"
          value={`₹${analysis.proposed.toLocaleString(
            'en-IN'
          )}`}
          highlight={
            !isGood
          }
        />

      </div>

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
                Planned for:{' '}
                {description}
              </p>
            )}

          </div>

        </div>

      </div>

      {analysis.warnings
        .length > 0 && (

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

                <span>
                  {warning}
                </span>

              </div>

            )
          )}

        </div>

      )}

      <div className="mt-4 flex items-center justify-between text-xs text-gray-600">

        <span>
          Category:{' '}
          <span className="text-gray-400">
            {category}
          </span>
        </span>

        <span>
          Selected period:{' '}
          <span className="text-gray-400">
            ₹
            {analysis.currentMonthSpent.toLocaleString(
              'en-IN'
            )}
          </span>
        </span>

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

export default AskPage;   