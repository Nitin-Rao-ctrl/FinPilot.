import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
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
   NORMALIZE TRANSACTION
============================================================ */

function normalizeTransaction(transaction: any): Transaction {
  return {
    id: transaction?.id,
    _id: transaction?._id,
    userId: transaction?.userId,

    type:
      transaction?.type === "income"
        ? "income"
        : "expense",

    amount: Number(transaction?.amount || 0),

    category:
      transaction?.category || "Other",

    description:
      transaction?.description || "",

    merchant:
      transaction?.merchant || "",

    date:
      transaction?.date ||
      new Date().toISOString().split("T")[0],
  };
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
    useState<"all" | TransactionType>("all");

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
     FETCH TRANSACTIONS
  ========================================================== */

  useEffect(() => {
    let mounted = true;

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
          const errorText =
            await response.text();

          throw new Error(
            `Failed to fetch transactions: ${response.status} ${errorText}`,
          );
        }

        const data =
          await response.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.transactions)
            ? data.transactions
            : [];

        if (mounted) {
          setTransactions(
            list.map(normalizeTransaction),
          );
        }
      } catch (error) {
        console.error(
          "Error fetching transactions:",
          error,
        );

        if (mounted) {
          setTransactions([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTransactions();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     FILTER + SORT
  ========================================================== */

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search.trim()) {
      const q =
        search.toLowerCase().trim();

      result = result.filter(
        (transaction) => {
          const description =
            String(
              transaction.description || "",
            ).toLowerCase();

          const merchant =
            String(
              transaction.merchant || "",
            ).toLowerCase();

          const category =
            String(
              transaction.category || "",
            ).toLowerCase();

          return (
            description.includes(q) ||
            merchant.includes(q) ||
            category.includes(q)
          );
        },
      );
    }

    if (filterType !== "all") {
      result = result.filter(
        (transaction) =>
          transaction.type ===
          filterType,
      );
    }

    if (filterCategory !== "all") {
      result = result.filter(
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
     DELETE
  ========================================================== */

  async function handleDelete(
    transaction: Transaction,
  ) {
    const id =
      transaction._id ||
      transaction.id;

    if (!id) {
      alert(
        "Transaction ID is missing.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this transaction?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      const userId =
        await getUserId();

      const response =
        await fetch(
          `${API_BASE}/transactions/${encodeURIComponent(
            id,
          )}?userId=${encodeURIComponent(
            userId,
          )}`,
          {
            method: "DELETE",
          },
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `Backend error ${response.status}: ${errorText}`,
        );
      }

      setTransactions(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !== id &&
              item.id !== id,
          ),
      );
    } catch (error) {
      console.error(
        "Error deleting transaction:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete transaction",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* ==========================================================
     SAVE / ADD / UPDATE
  ========================================================== */

  async function handleSave(
    data: Transaction,
  ) {
    try {
      setActionLoading(true);

      const userId =
        await getUserId();

      const isEditing =
        Boolean(
          editing?._id ||
            editing?.id,
        );

      const transactionId =
        editing?._id ||
        editing?.id;

      let response: Response;

      if (
        isEditing &&
        transactionId
      ) {
        response =
          await fetch(
            `${API_BASE}/transactions/${encodeURIComponent(
              transactionId,
            )}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                ...data,
                userId,
              }),
            },
          );
      } else {
        response =
          await fetch(
            `${API_BASE}/transactions`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                ...data,
                userId,
              }),
            },
          );
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `Backend error ${response.status}: ${errorText}`,
        );
      }

      const saved =
        await response.json();

      const normalized =
        normalizeTransaction(
          saved,
        );

      if (
        isEditing &&
        transactionId
      ) {
        setTransactions(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                  transactionId ||
                item.id ===
                  transactionId
                  ? normalized
                  : item,
            ),
        );
      } else {
        setTransactions(
          (previous) => [
            normalized,
            ...previous,
          ],
        );
      }

      setShowForm(false);
      setEditing(null);
    } catch (error) {
      console.error(
        "Error saving transaction:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save transaction",
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
     ADD NEW
  ========================================================== */

  function handleAddNew() {
    setEditing(null);
    setShowForm(true);
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Transactions
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              {transactions.length}{" "}
              total transactions
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all glow-emerald"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </Reveal>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Reveal delay={50}>
          <div className="glass rounded-2xl p-4 neon-border">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Total Transactions
            </p>

            <p className="text-xl font-semibold text-white mt-2">
              {transactions.length}
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="glass rounded-2xl p-4 neon-border">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Income
            </p>

            <p className="text-xl font-semibold text-emerald-400 mt-2">
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
        </Reveal>

        <Reveal delay={150}>
          <div className="glass rounded-2xl p-4 neon-border">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Expenses
            </p>

            <p className="text-xl font-semibold text-red-400 mt-2">
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
        </Reveal>
      </div>

      {/* FORM */}

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

      {/* FILTERS */}

      <Reveal delay={200}>
        <div className="glass rounded-2xl p-4 neon-border">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* SEARCH */}

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search transactions..."
                className="form-input pl-10"
              />
            </div>

            {/* TYPE */}

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />

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
                className="form-input pl-10 min-w-[150px]"
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
            </div>

            {/* CATEGORY */}

            <select
              value={filterCategory}
              onChange={(event) =>
                setFilterCategory(
                  event.target.value,
                )
              }
              className="form-input min-w-[160px]"
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

            {/* SORT */}

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
              className="form-input min-w-[150px]"
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

      {/* TRANSACTION LIST */}

      <Reveal delay={250}>
        <div className="glass rounded-2xl overflow-hidden neon-border">
          {/* TABLE HEADER */}

          <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_120px] gap-4 px-5 py-3 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-gray-600 font-medium">
            <span>
              Description
            </span>

            <span>
              Category
            </span>

            <span>Date</span>

            <span>Amount</span>

            <span className="text-right">
              Actions
            </span>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />

              <span className="ml-2 text-sm text-gray-500">
                Loading transactions...
              </span>
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            filtered.length === 0 && (
              <div className="py-16 px-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 text-gray-600" />
                </div>

                <p className="text-sm font-medium text-gray-400">
                  {transactions.length ===
                  0
                    ? "No transactions yet"
                    : "No transactions match your filters"}
                </p>

                <p className="text-xs text-gray-600 mt-1">
                  {transactions.length ===
                  0
                    ? "Add your first transaction to get started."
                    : "Try changing your search or filters."}
                </p>

                {transactions.length ===
                  0 && (
                  <button
                    type="button"
                    onClick={
                      handleAddNew
                    }
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Transaction
                  </button>
                )}
              </div>
            )}

          {/* LIST */}

          {!loading &&
            filtered.length > 0 && (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map(
                  (
                    transaction,
                    index,
                  ) => {
                    const transactionId =
                      transaction._id ||
                      transaction.id ||
                      `transaction-${index}`;

                    const isIncome =
                      transaction.type ===
                      "income";

                    return (
                      <div
                        key={
                          transactionId
                        }
                        className="group px-5 py-4 hover:bg-white/[0.015] transition-colors"
                      >
                        <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr_120px] gap-3 md:gap-4 items-center">
                          {/* DESCRIPTION */}

                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isIncome
                                  ? "bg-emerald-400/10"
                                  : "bg-red-400/10"
                              }`}
                            >
                              {isIncome ? (
                                <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ArrowDownCircle className="w-4 h-4 text-red-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-200 truncate">
                                {transaction.description ||
                                  "Untitled transaction"}
                              </p>

                              {transaction.merchant && (
                                <p className="text-xs text-gray-600 mt-0.5 truncate">
                                  {
                                    transaction.merchant
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          {/* CATEGORY */}

                          <div>
                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.05] text-xs text-gray-400">
                              {
                                transaction.category
                              }
                            </span>
                          </div>

                          {/* DATE */}

                          <div className="text-xs text-gray-500">
                            {formatDate(
                              transaction.date,
                            )}
                          </div>

                          {/* AMOUNT */}

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

                          {/* ACTIONS */}

                          <div className="flex justify-end gap-1">
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
                              className="p-2 rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.05] transition-colors"
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
                              className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/[0.05] transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
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
  saving,
}: {
  editing: Transaction | null;
  onClose: () => void;
  onSave: (data: Transaction) => void;
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

  /*
   * IMPORTANT:
   * Category is now MANUAL ONLY.
   * There is no automatic prediction.
   */

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
      alert(
        "Please enter a valid amount.",
      );
      return;
    }

    if (!description.trim()) {
      alert(
        "Please enter a description.",
      );
      return;
    }

    if (!date) {
      alert(
        "Please select a date.",
      );
      return;
    }

    onSave({
      id: editing?.id,
      _id: editing?._id,
      type,
      amount: parsedAmount,

      /*
       * Income gets Other.
       * Expense uses exactly what user selected.
       */
      category:
        type === "income"
          ? "Other"
          : category,

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
    <Reveal>
      <div className="glass rounded-2xl overflow-hidden neon-border">
        {/* HEADER */}

        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {editing
                ? "Edit Transaction"
                : "Add Transaction"}
            </h3>

            <p className="text-xs text-gray-600 mt-1">
              Select the category manually
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4"
        >
          {/* TYPE */}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setType("expense")
              }
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                type === "expense"
                  ? "bg-red-400/10 border-red-400/30 text-red-400"
                  : "border-white/[0.06] text-gray-500 hover:text-gray-300"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 inline mr-1.5" />
              Expense
            </button>

            <button
              type="button"
              onClick={() =>
                setType("income")
              }
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                type === "income"
                  ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400"
                  : "border-white/[0.06] text-gray-500 hover:text-gray-300"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 inline mr-1.5" />
              Income
            </button>
          </div>

          {/* AMOUNT */}

          <FormField label="Amount">
            <input
              type="number"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value,
                )
              }
              placeholder="0"
              required
              step="0.01"
              min="0.01"
              className="form-input"
            />
          </FormField>

          {/* DESCRIPTION */}

          <FormField label="Description">
            <input
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="e.g. chocolate, electricity bill, Zomato order"
              className="form-input"
              required
            />
          </FormField>

          {/* CATEGORY */}

          <FormField label="Category">
            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value,
                )
              }
              disabled={
                type === "income"
              }
              className="form-input disabled:opacity-50"
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
          </FormField>

          {/* MERCHANT */}

          <FormField label="Merchant (optional)">
            <input
              value={merchant}
              onChange={(event) =>
                setMerchant(
                  event.target.value,
                )
              }
              placeholder="e.g. Amazon, Zomato, Jio"
              className="form-input"
            />
          </FormField>

          {/* DATE */}

          <FormField label="Date">
            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value,
                )
              }
              required
              className="form-input"
            />
          </FormField>

          {/* BUTTONS */}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 glass text-gray-300 text-sm font-medium rounded-lg hover:text-white transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-400 text-[#050505] text-sm font-semibold rounded-lg hover:bg-emerald-300 transition-all disabled:opacity-60"
            >
              {saving && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}

              {editing
                ? "Update"
                : "Add Transaction"}
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
  children: ReactNode;
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

/* ============================================================
   DATE FORMATTER
============================================================ */

function formatDate(
  value: string,
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default TransactionsPage;