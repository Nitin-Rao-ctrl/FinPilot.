import {
  useState,
  useMemo,
  useEffect,
} from 'react';

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  Sparkles,
  Filter,
  Loader2,
} from 'lucide-react';

import { Reveal } from '@/lib/animations';

const CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Entertainment',
  'Education',
  'Health',
  'Rent',
  'Subscription',
  'Personal',
  'Other',
];

const CATEGORY_RULES: Record<
  string,
  string[]
> = {
  Food: [
    'zomato',
    'swiggy',
    'food',
    'restaurant',
    'cafe',
    'café',
    'pizza',
    'burger',
    'domino',
    'mcdonald',
    'kfc',
    'starbucks',
    'bakery',
    'grocery',
    'groceries',
    'blinkit',
    'zepto',
    'instamart',
    'eat',
    'lunch',
    'dinner',
    'breakfast',
  ],

  Travel: [
    'uber',
    'ola',
    'rapido',
    'metro',
    'bus',
    'train',
    'flight',
    'airline',
    'airport',
    'cab',
    'taxi',
    'travel',
    'petrol',
    'fuel',
    'diesel',
    'irctc',
    'makemytrip',
    'booking.com',
  ],

  Shopping: [
    'amazon',
    'flipkart',
    'myntra',
    'ajio',
    'meesho',
    'shopping',
    'mall',
    'clothes',
    'shirt',
    'shoes',
    'electronics',
    'phone',
    'mobile',
    'laptop',
    'headphones',
    'watch',
  ],

  Bills: [
    'electricity',
    'electric',
    'power bill',
    'water bill',
    'water',
    'gas bill',
    'gas',
    'internet',
    'wifi',
    'broadband',
    'jio',
    'airtel',
    'vi',
    'vodafone',
    'recharge',
    'mobile bill',
    'utility',
    'utilities',
  ],

 Entertainment: [
  'movie',
  'movies',
  'cinema',
  'netflix',
  'prime video',
  'hotstar',
  'spotify',
  'youtube premium',
  'gaming',
  'game',
  'concert',
  'theatre',
  'theater',
  'entertainment',
  'bookmyshow',
],
  Education: [
    'school',
    'college',
    'university',
    'tuition',
    'course',
    'courses',
    'education',
    'exam',
    'coaching',
    'udemy',
    'coursera',
    'books',
    'book store',
    'fee',
    'fees',
  ],

  Health: [
    'doctor',
    'hospital',
    'clinic',
    'medicine',
    'medical',
    'pharmacy',
    'chemist',
    'health',
    'dental',
    'dentist',
    'lab',
    'diagnostic',
    'apollo',
    'practo',
  ],

  Rent: [
    'rent',
    'house rent',
    'room rent',
    'flat rent',
    'landlord',
    'housing',
  ],

  Subscription: [
    'subscription',
    'membership',
    'netflix',
    'spotify',
    'prime',
    'hotstar',
    'icloud',
    'google one',
    'chatgpt',
    'openai',
    'gym membership',
  ],

  Personal: [
    'salon',
    'barber',
    'spa',
    'personal',
    'gift',
    'birthday',
    'self care',
    'beauty',
    'cosmetics',
  ],
};

function predictCategory(
  description: string,
  merchant: string
) {
  const text = `${description} ${merchant}`
    .trim()
    .toLowerCase();

  if (!text) {
    return null;
  }

  /*
   * Check specific categories first.
   */
  const priority = [
    'Bills',
    'Rent',
    'Health',
    'Education',
    'Travel',
    'Shopping',
    'Subscription',
    'Food',
    'Entertainment',
    'Personal',
  ];

  for (const category of priority) {
    const keywords =
      CATEGORY_RULES[category] || [];

    const matched =
      keywords.some((keyword) =>
        text.includes(keyword)
      );

    if (matched) {
      return category;
    }
  }

  /*
   * Default fallback.
   */
  return 'Other';
}

export function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions =
      async () => {
        try {
          const response =
            await fetch(
              'https://finpilot-backend-23iz.onrender.com/api/transactions'
            );

          if (!response.ok) {
            throw new Error(
              'Failed to fetch transactions'
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
            'Error fetching transactions:',
            error
          );
        }
      };

    fetchTransactions();
  }, []);

  const [search, setSearch] =
    useState('');

  const [filterType, setFilterType] =
    useState('all');

  const [filterCategory, setFilterCategory] =
    useState('all');

  const [sortBy, setSortBy] =
    useState<'date' | 'amount'>(
      'date'
    );

  const [showForm, setShowForm] =
    useState(false);

  const [editing, setEditing] =
    useState<any | null>(null);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search) {
      const q =
        search.toLowerCase();

      result =
        result.filter((t) =>
          String(
            t.description || ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            t.merchant || ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            t.category || ''
          )
            .toLowerCase()
            .includes(q)
        );
    }

    if (
      filterType !==
      'all'
    ) {
      result =
        result.filter(
          (t) =>
            t.type ===
            filterType
        );
    }

    if (
      filterCategory !==
      'all'
    ) {
      result =
        result.filter(
          (t) =>
            t.category ===
            filterCategory
        );
    }

    result.sort((a, b) =>
      sortBy === 'amount'
        ? Number(b.amount || 0) -
          Number(a.amount || 0)
        : new Date(
            b.date
          ).getTime() -
          new Date(
            a.date
          ).getTime()
    );

    return result;
  }, [
    transactions,
    search,
    filterType,
    filterCategory,
    sortBy,
  ]);

  async function handleDelete(
    id: string
  ) {
    try {
      const response =
        await fetch(
          `https://finpilot-backend-23iz.onrender.com/api/transactions/${id}`,
          {
            method: 'DELETE',
          }
        );

      if (!response.ok) {
        throw new Error(
          'Failed to delete transaction'
        );
      }

      setTransactions(
        (prev) =>
          prev.filter(
            (t) =>
              t._id !== id &&
              t.id !== id
          )
      );
    } catch (error) {
      console.error(
        'Error deleting transaction:',
        error
      );

      alert(
        'Failed to delete transaction'
      );
    }
  }

  async function handleAdd(
    data: any
  ) {
    try {
      const response =
        await fetch(
          'https://finpilot-backend-23iz.onrender.com/api/transactions',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              data
            ),
          }
        );

      if (!response.ok) {
        throw new Error(
          'Failed to save transaction'
        );
      }

      const savedTransaction =
        await response.json();

      setTransactions((prev) => [
        savedTransaction,
        ...prev,
      ]);

      setShowForm(false);
      setEditing(null);
    } catch (error) {
      console.error(
        'Error saving transaction:',
        error
      );

      alert(
        'Failed to save transaction'
      );
    }
  }

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Reveal>

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-white">
              Transactions
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              {transactions.length}{' '}
              total transactions
            </p>

          </div>

          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all glow-emerald"
          >
            <Plus className="w-4 h-4" />

            Add Transaction
          </button>

        </div>

      </Reveal>

      {/* ======================================================
          FORM
      ====================================================== */}

      {showForm && (
        <TransactionForm
          editing={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleAdd}
        />
      )}

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <Reveal delay={50}>

        <div className="glass-card p-4">

          <div className="grid md:grid-cols-4 gap-3">

            {/* SEARCH */}

            <div className="relative">

              <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search transactions..."
                className="form-input pl-9"
              />

            </div>

            {/* TYPE */}

            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(
                  e.target.value
                )
              }
              className="form-select"
            >
              <option value="all">
                All types
              </option>

              <option value="income">
                Income
              </option>

              <option value="expense">
                Expense
              </option>
            </select>

            {/* CATEGORY */}

            <select
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(
                  e.target.value
                )
              }
              className="form-select"
            >
              <option value="all">
                All categories
              </option>

              {CATEGORIES.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}

            </select>

            {/* SORT */}

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | 'date'
                    | 'amount'
                )
              }
              className="form-select"
            >
              <option value="date">
                Sort by date
              </option>

              <option value="amount">
                Sort by amount
              </option>
            </select>

          </div>

        </div>

      </Reveal>

      {/* ======================================================
          LIST
      ====================================================== */}

      <Reveal delay={100}>

        <div className="glass-card overflow-hidden">

          <div className="hidden md:grid grid-cols-5 gap-4 px-5 py-3 border-b border-white/[0.04]">

            <span className="metric-label">
              Date
            </span>

            <span className="metric-label">
              Description
            </span>

            <span className="metric-label">
              Category
            </span>

            <span className="metric-label text-right">
              Amount
            </span>

            <span className="metric-label text-right">
              Actions
            </span>

          </div>

          <div className="divide-y divide-white/[0.03]">

            {filtered.length === 0 ? (

              <div className="py-12 text-center">

                <Filter className="w-6 h-6 text-gray-700 mx-auto mb-3" />

                <p className="text-sm text-gray-500">
                  No transactions match your filters
                </p>

              </div>

            ) : (

              filtered.map((t) => (

                <div
                  key={
                    t._id ||
                    t.id
                  }
                  className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors items-center"
                >

                  {/* DATE */}

                  <span className="text-xs text-gray-500">

                    {new Date(
                      t.date
                    ).toLocaleDateString(
                      'en-IN',
                      {
                        day: 'numeric',
                        month: 'short',
                      }
                    )}

                  </span>

                  {/* DESCRIPTION */}

                  <div className="flex items-center gap-2 min-w-0">

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        t.type ===
                        'income'
                          ? 'bg-emerald-400/10'
                          : 'bg-red-400/10'
                      }`}
                    >

                      {t.type ===
                      'income' ? (
                        <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4 text-red-400" />
                      )}

                    </div>

                    <span className="text-sm text-gray-200 truncate">

                      {t.description ||
                        'No description'}

                    </span>

                  </div>

                  {/* CATEGORY */}

                  <span className="text-xs text-gray-500 hidden md:block">
                    {t.category ||
                      'Other'}
                  </span>

                  {/* AMOUNT */}

                  <span
                    className={`text-sm font-semibold text-right ${
                      t.type ===
                      'income'
                        ? 'text-emerald-400'
                        : 'text-gray-200'
                    }`}
                  >

                    {t.type ===
                    'income'
                      ? '+'
                      : '-'}

                    ₹
                    {Number(
                      t.amount || 0
                    ).toLocaleString(
                      'en-IN'
                    )}

                  </span>

                  {/* ACTIONS */}

                  <div className="flex gap-1 justify-end">

                    <button
                      onClick={() => {
                        setEditing(
                          t
                        );
                        setShowForm(
                          true
                        );
                      }}
                      className="p-1.5 text-gray-600 hover:text-emerald-400 hover:bg-emerald-400/5 rounded-lg transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          t._id ||
                            t.id
                        )
                      }
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </Reveal>

    </div>
  );
}

/* ============================================================
   TRANSACTION FORM
============================================================ */

function TransactionForm({
  editing,
  onClose,
  onSave,
}: {
  editing: any | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [type, setType] =
    useState<'income' | 'expense'>(
      editing?.type ||
        'expense'
    );

  const [amount, setAmount] =
    useState(
      editing
        ? String(
            editing.amount
          )
        : ''
    );

  const [category, setCategory] =
    useState(
      editing?.category ||
        'Other'
    );

  const [description, setDescription] =
    useState(
      editing?.description ||
        ''
    );

  const [merchant, setMerchant] =
    useState(
      editing?.merchant ||
        ''
    );

  const [date, setDate] =
    useState(
      editing?.date ||
        new Date()
          .toISOString()
          .split('T')[0]
    );

  const [isPredicting, setIsPredicting] =
    useState(false);

  const [predictionSource, setPredictionSource] =
    useState<
      'automatic' | 'manual' | 'initial'
    >(
      editing
        ? 'initial'
        : 'automatic'
    );

  const [hasPrediction, setHasPrediction] =
    useState(
      Boolean(
        editing?.category
      )
    );

  /* ==========================================================
     AUTOMATIC CATEGORY PREDICTION
  ========================================================== */

  useEffect(() => {
    if (
      type !== 'expense'
    ) {
      return;
    }

    const text =
      `${description} ${merchant}`.trim();

    if (text.length < 3) {
      return;
    }

    /*
     * Small debounce so typing doesn't
     * continuously update the field.
     */
    const timer =
      window.setTimeout(
        () => {
          setIsPredicting(
            true
          );

          /*
           * Simulated "ML-style"
           * prediction using the local
           * category model/rules.
           */
          const predicted =
            predictCategory(
              description,
              merchant
            );

          if (predicted) {
            setCategory(
              predicted
            );

            setPredictionSource(
              'automatic'
            );

            setHasPrediction(
              true
            );
          }

          setIsPredicting(
            false
          );
        },
        350
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    description,
    merchant,
    type,
  ]);

  function handleManualCategoryChange(
    value: string
  ) {
    setCategory(value);

    setPredictionSource(
      'manual'
    );

    setHasPrediction(
      true
    );
  }

  function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const amt =
      parseFloat(amount);

    if (
      !amt ||
      amt <= 0
    ) {
      alert(
        'Please enter a valid amount.'
      );
      return;
    }

    if (
      !description.trim()
    ) {
      alert(
        'Please enter a description.'
      );
      return;
    }

    onSave({
      id:
        editing?.id ||
        String(
          Date.now()
        ),

      _id:
        editing?._id,

      type,

      amount: amt,

      category,

      description:
        description.trim(),

      merchant:
        merchant.trim(),

      date,
    });
  }

  return (
    <Reveal>

      <div className="glass rounded-2xl overflow-hidden neon-border">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">

          <div>

            <h3 className="text-sm font-semibold text-white">
              {editing
                ? 'Edit Transaction'
                : 'Add Transaction'}
            </h3>

            <p className="text-xs text-gray-600 mt-1">
              Category will be predicted automatically
            </p>

          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="p-5 space-y-4"
        >

          {/* ==================================================
              TYPE
          ================================================== */}

          <div className="flex gap-2">

            <button
              type="button"
              onClick={() =>
                setType(
                  'expense'
                )
              }
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                type ===
                'expense'
                  ? 'bg-red-400/10 border-red-400/30 text-red-400'
                  : 'border-white/[0.06] text-gray-500'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 inline mr-1.5" />
              Expense
            </button>

            <button
              type="button"
              onClick={() =>
                setType(
                  'income'
                )
              }
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                type ===
                'income'
                  ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                  : 'border-white/[0.06] text-gray-500'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 inline mr-1.5" />
              Income
            </button>

          </div>

          {/* ==================================================
              AMOUNT
          ================================================== */}

          <FormField label="Amount">

            <input
              type="number"
              value={
                amount
              }
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              placeholder="0"
              required
              step="0.01"
              min="0"
              className="form-input"
            />

          </FormField>

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <FormField label="Description">

            <input
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="e.g. electricity bill, Zomato order"
              className="form-input"
            />

          </FormField>

          {/* ==================================================
              MERCHANT
          ================================================== */}

          <FormField label="Merchant (optional)">

            <input
              value={
                merchant
              }
              onChange={(e) =>
                setMerchant(
                  e.target.value
                )
              }
              placeholder="e.g. Amazon, Zomato, Jio"
              className="form-input"
            />

          </FormField>

          {/* ==================================================
              AI PREDICTION
          ================================================== */}

          {type ===
            'expense' &&
            (hasPrediction ||
              isPredicting) && (

              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                  predictionSource ===
                  'manual'
                    ? 'bg-amber-400/[0.05] border-amber-400/15'
                    : 'bg-emerald-400/[0.05] border-emerald-400/15'
                }`}
              >

                {isPredicting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />

                    <span className="text-xs text-emerald-400">
                      Predicting category...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles
                      className={`w-3.5 h-3.5 ${
                        predictionSource ===
                        'manual'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    />

                    <span
                      className={`text-xs ${
                        predictionSource ===
                        'manual'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {predictionSource ===
                      'manual'
                        ? 'Category manually selected:'
                        : 'AI-style prediction:'}{' '}
                      <strong>
                        {category}
                      </strong>
                    </span>
                  </>
                )}

              </div>
            )}

          {/* ==================================================
              CATEGORY
          ================================================== */}

          <FormField label="Category">

            <select
              value={
                category
              }
              onChange={(e) =>
                handleManualCategoryChange(
                  e.target.value
                )
              }
              className="form-select"
            >

              {CATEGORIES.map(
                (c) => (
                  <option
                    key={c}
                    value={c}
                  >
                    {c}
                  </option>
                )
              )}

            </select>

            <p className="text-[10px] text-gray-600 mt-1.5">
              Automatic prediction can be corrected manually.
            </p>

          </FormField>

          {/* ==================================================
              DATE
          ================================================== */}

          <FormField label="Date">

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(
                  e.target.value
                )
              }
              required
              className="form-input"
            />

          </FormField>

          {/* ==================================================
              BUTTONS
          ================================================== */}

          <div className="flex gap-3 pt-2">

            <button
              type="button"
              onClick={
                onClose
              }
              className="px-4 py-2.5 glass text-gray-300 text-sm font-medium rounded-lg hover:text-white transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-emerald-400 text-[#050505] text-sm font-semibold rounded-lg hover:bg-emerald-300 transition-all"
            >
              {editing
                ? 'Update'
                : 'Add Transaction'}
            </button>

          </div>

        </form>

      </div>

    </Reveal>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
        {label}
      </label>

      {children}

    </div>
  );
}
