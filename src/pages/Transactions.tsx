import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  Filter,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Reveal } from "@/lib/animations";
import { supabase } from "@/lib/supabase";

/* ============================================================
   API
============================================================ */

const API_BASE =
  "https://finpilot-backend-23iz.onrender.com/api";

/* ============================================================
   TYPES
============================================================ */

type TransactionType = "income" | "expense";

type Transaction = {
  id?: string;
  _id?: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  merchant?: string;
  date: string;
};

/* ============================================================
   AUTH
============================================================ */

async function getUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User is not logged in");
  }

  return user.id;
}

/* ============================================================
   CATEGORIES
============================================================ */

const CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Education",
  "Health",
  "Rent",
  "Subscription",
  "Personal",
  "Other",
];

/* ============================================================
   CATEGORY RULES
============================================================ */

const CATEGORY_RULES: Record<string, string[]> = {
  Food: [
    "zomato",
    "swiggy",
    "food",
    "restaurant",
    "cafe",
    "café",
    "pizza",
    "burger",
    "domino",
    "dominos",
    "mcdonald",
    "mcdonalds",
    "kfc",
    "starbucks",
    "bakery",
    "grocery",
    "groceries",
    "blinkit",
    "zepto",
    "instamart",
    "eat",
    "eating",
    "lunch",
    "dinner",
    "breakfast",
    "chocolate",
    "chocolates",
    "snack",
    "snacks",
    "dessert",
    "desserts",
    "cake",
    "cakes",
    "ice cream",
    "icecream",
    "sweet",
    "sweets",
    "mithai",
    "juice",
    "coffee",
    "tea",
    "coke",
    "pepsi",
    "drink",
    "drinks",
    "food court",
    "dhaba",
    "hotel food",
  ],

  Travel: [
    "uber",
    "ola",
    "rapido",
    "metro",
    "bus",
    "train",
    "flight",
    "airline",
    "airport",
    "cab",
    "taxi",
    "travel",
    "trip",
    "tour",
    "petrol",
    "fuel",
    "diesel",
    "irctc",
    "makemytrip",
    "make my trip",
    "booking.com",
    "booking",
    "hotel booking",
    "toll",
    "parking",
    "redbus",
    "indigo",
    "spicejet",
    "air india",
  ],

  Shopping: [
    "amazon",
    "flipkart",
    "myntra",
    "ajio",
    "meesho",
    "shopping",
    "mall",
    "clothes",
    "shirt",
    "shirts",
    "shoes",
    "shoe",
    "electronics",
    "phone",
    "mobile",
    "laptop",
    "headphones",
    "watch",
    "dress",
    "jeans",
    "jacket",
    "fashion",
    "purchase",
  ],

  Bills: [
    "electricity",
    "electric",
    "water bill",
    "water",
    "gas bill",
    "gas",
    "internet",
    "wifi",
    "broadband",
    "jio",
    "airtel",
    "vodafone",
    "vi",
    "recharge",
    "bill",
    "utility",
    "phone bill",
    "mobile bill",
  ],

  Entertainment: [
    "netflix",
    "prime video",
    "amazon prime",
    "hotstar",
    "disney",
    "spotify",
    "youtube",
    "youtube premium",
    "movie",
    "movies",
    "cinema",
    "pvr",
    "inox",
    "game",
    "games",
    "gaming",
    "concert",
    "theatre",
    "theater",
  ],

  Education: [
    "school",
    "college",
    "university",
    "course",
    "udemy",
    "coursera",
    "education",
    "book",
    "books",
    "tuition",
    "fees",
    "exam",
    "class",
    "coaching",
    "study",
  ],

  Health: [
    "hospital",
    "doctor",
    "medical",
    "medicine",
    "pharmacy",
    "apollo",
    "clinic",
    "health",
    "dentist",
    "dental",
    "lab",
    "diagnostic",
    "healthcare",
  ],

  Rent: [
    "rent",
    "house rent",
    "room rent",
    "flat rent",
    "landlord",
    "housing",
  ],

  Subscription: [
    "subscription",
    "membership",
    "prime",
    "netflix",
    "spotify",
    "youtube premium",
    "icloud",
    "google one",
    "dropbox",
    "monthly plan",
    "annual plan",
  ],

  Personal: [
    "salon",
    "barber",
    "gym",
    "fitness",
    "clothing",
    "gift",
    "personal care",
    "spa",
  ],
};

/* ============================================================
   NORMALIZE TEXT
============================================================ */

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   KEYWORD MATCH
============================================================ */

function keywordMatches(
  text: string,
  keyword: string,
): boolean {
  const normalizedKeyword =
    normalizeText(keyword);

  if (!normalizedKeyword) {
    return false;
  }

  if (normalizedKeyword.includes(" ")) {
    return text.includes(normalizedKeyword);
  }

  const words = text.split(" ");

  return words.some(
    (word) => word === normalizedKeyword,
  );
}

/* ============================================================
   CATEGORY PREDICTOR
============================================================ */

function predictCategory(
  description: string,
  merchant: string,
): string {
  const text = normalizeText(
    `${description} ${merchant}`,
  );

  if (!text) {
    return "Other";
  }

  const priority = [
    "Food",
    "Bills",
    "Travel",
    "Shopping",
    "Entertainment",
    "Education",
    "Health",
    "Rent",
    "Subscription",
    "Personal",
  ];

  for (const category of priority) {
    const keywords =
      CATEGORY_RULES[category] || [];

    const matched = keywords.some(
      (keyword) =>
        keywordMatches(text, keyword),
    );

    if (matched) {
      return category;
    }
  }

  return "Other";
}

/* ============================================================
   NORMALIZE TRANSACTION
============================================================ */

function normalizeTransaction(
  transaction: any,
): Transaction {
  return {
    id: transaction?.id,
    _id: transaction?._id,
    userId: transaction?.userId,

    type:
      transaction?.type === "income"
        ? "income"
        : "expense",

    amount: Number(
      transaction?.amount || 0,
    ),

    category:
      transaction?.category || "Other",

    description:
      transaction?.description || "",

    merchant:
      transaction?.merchant || "",

    date:
      transaction?.date ||
      new Date()
        .toISOString()
        .split("T")[0],
  };
}

/* ============================================================
   DATE FORMAT
============================================================ */

function formatDate(date: string): string {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

/* ============================================================
   TRANSACTIONS PAGE
============================================================ */

export function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [search, setSearch] =
    useState("");

  const [filterType, setFilterType] =
    useState<
      "all" | TransactionType
    >("all");

  const [filterCategory, setFilterCategory] =
    useState("all");

  const [sortBy, setSortBy] =
    useState<"date" | "amount">("date");

  const [showForm, setShowForm] =
    useState(false);

  const [editing, setEditing] =
    useState<Transaction | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  /* ==========================================================
     CUSTOM DELETE MODAL
  ========================================================== */

  const [deleteTarget, setDeleteTarget] =
    useState<Transaction | null>(null);

  /* ==========================================================
     DELETE SUCCESS MODAL
  ========================================================== */

  const [deleteSuccess, setDeleteSuccess] =
    useState(false);

  /* ==========================================================
     ERROR MODAL
  ========================================================== */

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  /* ==========================================================
     FETCH
  ========================================================== */

  async function fetchTransactions() {
    try {
      setLoading(true);

      const userId = await getUserId();

      const response = await fetch(
        `${API_BASE}/transactions?userId=${encodeURIComponent(
          userId,
        )}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch transactions: ${response.status}`,
        );
      }

      const data =
        await response.json();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(
              data?.transactions,
            )
          ? data.transactions
          : [];

      setTransactions(
        list.map(normalizeTransaction),
      );
    } catch (error) {
      console.error(
        "Error fetching transactions:",
        error,
      );

      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  /* ==========================================================
     FILTER + SORT
  ========================================================== */

  const filtered = useMemo(() => {
    let result = [
      ...transactions,
    ];

    if (search.trim()) {
      const q =
        normalizeText(search);

      result = result.filter(
        (transaction) => {
          const description =
            normalizeText(
              transaction.description,
            );

          const merchant =
            normalizeText(
              transaction.merchant || "",
            );

          const category =
            normalizeText(
              transaction.category,
            );

          return (
            description.includes(q) ||
            merchant.includes(q) ||
            category.includes(q)
          );
        },
      );
    }

    if (filterType !== "all") {
      result =
        result.filter(
          (transaction) =>
            transaction.type ===
            filterType,
        );
    }

    if (filterCategory !== "all") {
      result =
        result.filter(
          (transaction) =>
            transaction.category ===
            filterCategory,
        );
    }

    result.sort((a, b) => {
      if (sortBy === "amount") {
        return (
          Number(b.amount || 0) -
          Number(a.amount || 0)
        );
      }

      return (
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
      );
    });

    return result;
  }, [
    transactions,
    search,
    filterType,
    filterCategory,
    sortBy,
  ]);

  /* ==========================================================
     TOTALS
  ========================================================== */

  const totalIncome = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "income",
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount || 0,
            ),
          0,
        ),
    [transactions],
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "expense",
        )
        .reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount || 0,
            ),
          0,
        ),
    [transactions],
  );

  /* ==========================================================
     CREATE / UPDATE
  ========================================================== */

  async function handleSave(
    data: Transaction,
  ) {
    try {
      setActionLoading(true);

      const userId =
        await getUserId();

      const payload = {
        ...data,
        userId,
        amount: Number(data.amount),
      };

      const transactionId =
        data.id || data._id;

      const response = await fetch(
        transactionId
          ? `${API_BASE}/transactions/${transactionId}`
          : `${API_BASE}/transactions`,
        {
          method: transactionId
            ? "PUT"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload,
          ),
        },
      );

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          `Failed to save transaction: ${response.status} ${text}`,
        );
      }

      setShowForm(false);
      setEditing(null);

      await fetchTransactions();
    } catch (error) {
      console.error(
        "Error saving transaction:",
        error,
      );

      setErrorMessage(
        "Could not save transaction.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* ==========================================================
     EDIT
  ========================================================== */

  function handleEdit(
    transaction: Transaction,
  ) {
    setEditing(transaction);
    setShowForm(true);
  }

  /* ==========================================================
     OPEN DELETE MODAL
  ========================================================== */

  function handleDelete(
    transaction: Transaction,
  ) {
    const id =
      transaction._id ||
      transaction.id;

    if (!id) {
      setErrorMessage(
        "Transaction ID is missing.",
      );
      return;
    }

    setDeleteTarget(transaction);
  }

  /* ==========================================================
     CONFIRM DELETE
  ========================================================== */

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    const id =
      deleteTarget._id ||
      deleteTarget.id;

    if (!id) {
      setDeleteTarget(null);
      setErrorMessage(
        "Transaction ID is missing.",
      );
      return;
    }

    try {
      setActionLoading(true);

      const userId =
        await getUserId();

      const url =
        `${API_BASE}/transactions/${encodeURIComponent(id)}` +
        `?userId=${encodeURIComponent(userId)}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          `Delete failed (${response.status}): ${
            responseText ||
            "Unknown backend error"
          }`,
        );
      }

      /* Remove from UI after backend confirms */
      setTransactions(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !== id &&
              item.id !== id,
          ),
      );

      /* Close confirmation */
      setDeleteTarget(null);

      /* Show custom success modal */
      setDeleteSuccess(true);
    } catch (error) {
      console.error(
        "Error deleting transaction:",
        error,
      );

      setDeleteTarget(null);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not delete transaction.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <>
      <div className="space-y-6">
        <Reveal>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Transactions
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Track and manage your income
                and expenses.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </Reveal>

        {/* ======================================================
            SUMMARY
        ====================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="w-5 h-5 text-emerald-400" />

              <span className="text-sm text-gray-400">
                Total Income
              </span>
            </div>

            <p className="text-2xl font-bold text-white mt-3">
              ₹
              {totalIncome.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <ArrowDownCircle className="w-5 h-5 text-red-400" />

              <span className="text-sm text-gray-400">
                Total Expense
              </span>
            </div>

            <p className="text-2xl font-bold text-white mt-3">
              ₹
              {totalExpense.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400" />

              <span className="text-sm text-gray-400">
                Balance
              </span>
            </div>

            <p className="text-2xl font-bold text-white mt-3">
              ₹
              {(
                totalIncome -
                totalExpense
              ).toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}
            </p>
          </div>
        </div>

        {/* ======================================================
            FILTERS
        ====================================================== */}

        <Reveal>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search transactions..."
                  className="w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
                />
              </div>

              <select
                value={filterType}
                onChange={(event) =>
                  setFilterType(
                    event.target
                      .value as
                      | "all"
                      | TransactionType,
                  )
                }
                className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="all">
                  All Types
                </option>

                <option value="income">
                  Income
                </option>

                <option value="expense">
                  Expense
                </option>
              </select>

              <select
                value={filterCategory}
                onChange={(event) =>
                  setFilterCategory(
                    event.target.value,
                  )
                }
                className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="all">
                  All Categories
                </option>

                {CATEGORIES.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ),
                )}
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target
                      .value as
                      | "date"
                      | "amount",
                  )
                }
                className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="date">
                  Sort by Date
                </option>

                <option value="amount">
                  Sort by Amount
                </option>
              </select>
            </div>
          </div>
        </Reveal>

        {/* ======================================================
            TRANSACTION LIST
        ====================================================== */}

        <Reveal>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <Filter className="w-8 h-8 text-gray-600 mx-auto mb-3" />

                <p className="text-gray-400">
                  No transactions found.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setShowForm(true);
                  }}
                  className="mt-4 text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Add your first transaction
                </button>
              </div>
            ) : (
              <div>
                {filtered.map(
                  (transaction) => {
                    const isIncome =
                      transaction.type ===
                      "income";

                    return (
                      <div
                        key={
                          transaction.id ||
                          transaction._id
                        }
                        className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.05] last:border-b-0"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isIncome
                              ? "bg-emerald-400/10"
                              : "bg-red-400/10"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {transaction.description ||
                              "Transaction"}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {transaction.merchant ||
                                "No merchant"}
                            </span>

                            <span className="text-gray-700">
                              •
                            </span>

                            <span className="text-xs text-emerald-400">
                              {transaction.category}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 hidden sm:block">
                          {formatDate(
                            transaction.date,
                          )}
                        </div>

                        <div
                          className={`text-sm font-semibold ${
                            isIncome
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {isIncome
                            ? "+"
                            : "-"}
                          ₹
                          {Number(
                            transaction.amount ||
                              0,
                          ).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>

                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                transaction,
                              )
                            }
                            disabled={
                              actionLoading
                            }
                            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05]"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                transaction,
                              )
                            }
                            disabled={
                              actionLoading
                            }
                            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/[0.05]"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </Reveal>

        {/* ======================================================
            FORM MODAL
        ====================================================== */}

        {showForm && (
          <TransactionForm
            editing={editing}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSave={handleSave}
            saving={actionLoading}
          />
        )}
      </div>

      {/* ========================================================
          DELETE CONFIRMATION MODAL
      ======================================================== */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => {
              if (!actionLoading) {
                setDeleteTarget(null);
              }
            }}
          />

          <div className="relative w-full max-w-md rounded-3xl border border-white/[0.10] bg-[#101313] shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.05] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-semibold text-white mt-5">
                Delete transaction?
              </h2>

              <p className="text-sm text-gray-400 mt-2 leading-6">
                Are you sure you want to delete
                this transaction? This action
                cannot be undone.
              </p>

              <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white truncate">
                  {deleteTarget.description ||
                    "Transaction"}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {deleteTarget.category}
                  </span>

                  <span
                    className={`text-sm font-semibold ${
                      deleteTarget.type ===
                      "income"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {deleteTarget.type ===
                    "income"
                      ? "+"
                      : "-"}
                    ₹
                    {Number(
                      deleteTarget.amount ||
                        0,
                    ).toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  className="flex-1 rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.05] transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={confirmDelete}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-400 transition disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE SUCCESS MODAL
      ======================================================== */}

      {deleteSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() =>
              setDeleteSuccess(false)
            }
          />

          <div className="relative w-full max-w-sm rounded-3xl border border-emerald-400/20 bg-[#101313] shadow-2xl p-7 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>

            <h2 className="text-xl font-semibold text-white mt-5">
              Transaction deleted
            </h2>

            <p className="text-sm text-gray-400 mt-2 leading-6">
              This transaction has been
              deleted successfully.
            </p>

            <button
              type="button"
              onClick={() =>
                setDeleteSuccess(false)
              }
              className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          ERROR MODAL
      ======================================================== */}

      {errorMessage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() =>
              setErrorMessage(null)
            }
          />

          <div className="relative w-full max-w-sm rounded-3xl border border-red-400/20 bg-[#101313] shadow-2xl p-7 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center">
              <AlertCircle className="w-9 h-9 text-red-400" />
            </div>

            <h2 className="text-xl font-semibold text-white mt-5">
              Something went wrong
            </h2>

            <p className="text-sm text-gray-400 mt-2 leading-6">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                setErrorMessage(null)
              }
              className="mt-6 w-full rounded-xl bg-white/[0.08] border border-white/[0.08] px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.12] transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   TRANSACTION FORM
============================================================ */

function TransactionForm({
  editing,
  onClose,
  onSave,
  saving,
}: {
  editing: Transaction | null;
  onClose: () => void;
  onSave: (
    data: Transaction,
  ) => void;
  saving: boolean;
}) {
  const [type, setType] =
    useState<TransactionType>(
      editing?.type || "expense",
    );

  const [amount, setAmount] =
    useState(
      editing
        ? String(editing.amount)
        : "",
    );

  const [category, setCategory] =
    useState(
      editing?.category || "Other",
    );

  const [description, setDescription] =
    useState(
      editing?.description || "",
    );

  const [merchant, setMerchant] =
    useState(
      editing?.merchant || "",
    );

  const [date, setDate] =
    useState(
      editing?.date ||
        new Date()
          .toISOString()
          .split("T")[0],
    );

  const [isPredicting, setIsPredicting] =
    useState(false);

  const [
    predictionSource,
    setPredictionSource,
  ] = useState<
    "automatic" | "manual" | "initial"
  >(
    editing
      ? "initial"
      : "automatic",
  );

  /* ==========================================================
     AUTOMATIC CATEGORY PREDICTION
  ========================================================== */

  useEffect(() => {
    if (type !== "expense") {
      return;
    }

    const text =
      `${description} ${merchant}`.trim();

    if (text.length < 2) {
      return;
    }

    setIsPredicting(true);

    const timer =
      window.setTimeout(() => {
        const predicted =
          predictCategory(
            description,
            merchant,
          );

        setCategory(predicted);

        setPredictionSource(
          "automatic",
        );

        setIsPredicting(false);
      }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    description,
    merchant,
    type,
  ]);

  /* ==========================================================
     MANUAL CATEGORY
  ========================================================== */

  function handleManualCategoryChange(
    value: string,
  ) {
    setCategory(value);

    setPredictionSource(
      "manual",
    );
  }

  /* ==========================================================
     SUBMIT
  ========================================================== */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedAmount =
      Number(amount);

    if (
      !Number.isFinite(
        parsedAmount,
      ) ||
      parsedAmount <= 0
    ) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    if (!date) {
      return;
    }

    onSave({
      id: editing?.id,
      _id: editing?._id,
      userId: editing?.userId,
      type,
      amount: parsedAmount,
      category,
      description:
        description.trim(),
      merchant:
        merchant.trim(),
      date,
    });
  }

  /* ==========================================================
     FORM UI
  ========================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#101313] shadow-2xl overflow-hidden">
        {/* HEADER */}

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {editing
                ? "Edit Transaction"
                : "Add Transaction"}
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              AI automatically predicts
              the category.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-5"
        >
          {/* TYPE */}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Type
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setType("expense")
                }
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  type === "expense"
                    ? "border-red-400/40 bg-red-400/10 text-red-400"
                    : "border-white/[0.08] text-gray-500"
                }`}
              >
                Expense
              </button>

              <button
                type="button"
                onClick={() =>
                  setType("income")
                }
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  type === "income"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                    : "border-white/[0.08] text-gray-500"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* AMOUNT */}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value,
                )
              }
              placeholder="0.00"
              className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
              required
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Description
            </label>

            <input
              type="text"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="e.g. Chocolate from supermarket"
              className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
              required
            />
          </div>

          {/* MERCHANT */}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Merchant
            </label>

            <input
              type="text"
              value={merchant}
              onChange={(event) =>
                setMerchant(
                  event.target.value,
                )
              }
              placeholder="e.g. Amazon, Uber, Zomato"
              className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
            />
          </div>

          {/* PREDICTION */}

          {type === "expense" &&
            (description.trim()
              .length >= 2 ||
              merchant.trim()
                .length >= 2) && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-3">
                {isPredicting ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                )}

                <div>
                  <p className="text-xs font-medium text-emerald-400">
                    {isPredicting
                      ? "Predicting category..."
                      : predictionSource ===
                          "manual"
                        ? `Category selected: ${category}`
                        : `ML predicted: ${category}`}
                  </p>

                  {!isPredicting && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Based on description
                      and merchant
                    </p>
                  )}
                </div>
              </div>
            )}

          {/* CATEGORY */}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Category
            </label>

            <select
              value={category}
              onChange={(event) =>
                handleManualCategoryChange(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
            >
              {CATEGORIES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* DATE */}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
              required
            />
          </div>

          {/* BUTTONS */}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.04]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}

              {editing
                ? "Update"
                : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}