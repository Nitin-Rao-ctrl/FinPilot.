import { useEffect, useState } from 'react';
import {
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
} from 'lucide-react';
import { Reveal } from '@/lib/animations';

/* ============================================================
   LOAN TYPE
============================================================ */

type Loan = {
  id: string;
  person: string;
  amount: number;
  type: 'lent' | 'borrowed';
  date: string;
  dueDate: string | null;
  status: 'pending' | 'partially_paid' | 'paid';
};

const STORAGE_KEY = 'smartspend_loans';

/* ============================================================
   LOANS PAGE
============================================================ */

export function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  /* ============================================================
     LOAD LOANS FROM LOCAL STORAGE
  ============================================================ */

  useEffect(() => {
    try {
      const savedLoans = localStorage.getItem(STORAGE_KEY);

      if (savedLoans) {
        const parsedLoans = JSON.parse(savedLoans);

        if (Array.isArray(parsedLoans)) {
          setLoans(parsedLoans);
        } else {
          setLoans([]);
        }
      } else {
        setLoans([]);
      }
    } catch (error) {
      console.error('Failed to load loans:', error);
      setLoans([]);
    }

    setLoaded(true);
  }, []);

  /* ============================================================
     SAVE LOANS TO LOCAL STORAGE
  ============================================================ */

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(loans)
    );
  }, [loans, loaded]);

  /* ============================================================
     TOTAL LENT
  ============================================================ */

  const totalLent = loans
    .filter(
      (loan) =>
        loan.type === 'lent' &&
        loan.status !== 'paid'
    )
    .reduce(
      (sum, loan) => sum + loan.amount,
      0
    );

  /* ============================================================
     TOTAL BORROWED
  ============================================================ */

  const totalBorrowed = loans
    .filter(
      (loan) =>
        loan.type === 'borrowed' &&
        loan.status !== 'paid'
    )
    .reduce(
      (sum, loan) => sum + loan.amount,
      0
    );

  /* ============================================================
     NET OUTSTANDING
  ============================================================ */

  const outstanding = totalLent - totalBorrowed;

  /* ============================================================
     DELETE LOAN
  ============================================================ */

  function handleDelete(id: string) {
    setLoans((previousLoans) =>
      previousLoans.filter(
        (loan) => loan.id !== id
      )
    );
  }

  /* ============================================================
     SAVE NEW LOAN
  ============================================================ */

  function handleSave(loan: Loan) {
    setLoans((previousLoans) => [
      loan,
      ...previousLoans,
    ]);

    setShowForm(false);
  }

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Reveal>
        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold text-white">
              Loans
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Track money lent and borrowed
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all glow-emerald"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>

        </div>
      </Reveal>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <Reveal delay={50}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* TOTAL LENT */}

          <div className="glass-card p-4 text-center">

            <p className="metric-label">
              Total Lent
            </p>

            <p className="text-xl font-bold text-emerald-400 mt-1">
              ₹{totalLent.toLocaleString('en-IN')}
            </p>

          </div>

          {/* TOTAL BORROWED */}

          <div className="glass-card p-4 text-center">

            <p className="metric-label">
              Total Borrowed
            </p>

            <p className="text-xl font-bold text-red-400 mt-1">
              ₹{totalBorrowed.toLocaleString('en-IN')}
            </p>

          </div>

          {/* NET OUTSTANDING */}

          <div className="glass-card p-4 text-center">

            <p className="metric-label">
              Net Outstanding
            </p>

            <p
              className={`text-xl font-bold mt-1 ${
                outstanding >= 0
                  ? 'text-white'
                  : 'text-red-400'
              }`}
            >
              ₹{outstanding.toLocaleString('en-IN')}
            </p>

          </div>

        </div>
      </Reveal>

      {/* ======================================================
          ADD FORM
      ====================================================== */}

      {showForm && (
        <LoanForm
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {/* ======================================================
          LOAN LIST
      ====================================================== */}

      <Reveal delay={100}>
        <div className="glass-card overflow-hidden">

          {loans.length === 0 ? (

            /* ==================================================
               EMPTY STATE
            ================================================== */

            <div className="p-12 text-center">

              <div className="w-12 h-12 mx-auto rounded-full bg-white/[0.03] flex items-center justify-center mb-4">

                <ArrowUpRight className="w-5 h-5 text-gray-600" />

              </div>

              <p className="text-sm text-gray-400">
                No loans added yet
              </p>

              <p className="text-xs text-gray-600 mt-1">
                Click "Add" to add your first loan
              </p>

            </div>

          ) : (

            /* ==================================================
               LOANS
            ================================================== */

            <div className="divide-y divide-white/[0.03]">

              {loans.map((loan) => (

                <div
                  key={loan.id}
                  className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
                >

                  {/* ==================================================
                     TYPE ICON
                  ================================================== */}

                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      loan.type === 'lent'
                        ? 'bg-emerald-400/10'
                        : 'bg-red-400/10'
                    }`}
                  >

                    {loan.type === 'lent' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}

                  </div>

                  {/* ==================================================
                     PERSON + DATE
                  ================================================== */}

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-medium text-white">
                      {loan.person}
                    </p>

                    <p className="text-xs text-gray-500">

                      {loan.type === 'lent'
                        ? 'Lent'
                        : 'Borrowed'}

                      {' · '}

                      {new Date(
                        loan.date
                      ).toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                        }
                      )}

                      {loan.dueDate &&
                        ` · Due: ${new Date(
                          loan.dueDate
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                          }
                        )}`}

                    </p>

                  </div>

                  {/* ==================================================
                     AMOUNT
                  ================================================== */}

                  <span className="text-sm font-semibold text-white">
                    ₹{loan.amount.toLocaleString('en-IN')}
                  </span>

                  {/* ==================================================
                     STATUS
                  ================================================== */}

                  <span
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                      loan.status === 'paid'
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : loan.status === 'partially_paid'
                        ? 'bg-amber-400/10 text-amber-400'
                        : 'bg-white/[0.03] text-gray-400'
                    }`}
                  >
                    {loan.status
                      .replace('_', ' ')
                      .toUpperCase()}
                  </span>

                  {/* ==================================================
                     DELETE
                  ================================================== */}

                  <button
                    onClick={() =>
                      handleDelete(loan.id)
                    }
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                    title="Delete loan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>
      </Reveal>

    </div>
  );
}


/* ============================================================
   LOAN FORM
============================================================ */

function LoanForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (loan: Loan) => void;
}) {

  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');

  const [type, setType] =
    useState<'lent' | 'borrowed'>('lent');

  const [date, setDate] = useState(
    new Date()
      .toISOString()
      .split('T')[0]
  );

  const [dueDate, setDueDate] =
    useState('');

  /* ============================================================
     SUBMIT
  ============================================================ */

  function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    const trimmedPerson = person.trim();
    const amt = parseFloat(amount);

    if (!trimmedPerson) {
      return;
    }

    if (!amt || amt <= 0) {
      return;
    }

    const newLoan: Loan = {
      id: String(Date.now()),
      person: trimmedPerson,
      amount: amt,
      type,
      date,
      dueDate: dueDate || null,
      status: 'pending',
    };

    onSave(newLoan);
  }

  /* ============================================================
     FORM UI
  ============================================================ */

  return (
    <Reveal>

      <div className="glass rounded-2xl overflow-hidden neon-border">

        {/* ======================================================
            FORM HEADER
        ====================================================== */}

        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">

          <h3 className="text-sm font-semibold text-white">
            Add Loan
          </h3>

          <button
            onClick={onClose}
            type="button"
            className="p-1 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        {/* ======================================================
            FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4"
        >

          {/* PERSON NAME */}

          <div>

            <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
              Person Name
            </label>

            <input
              type="text"
              value={person}
              onChange={(e) =>
                setPerson(e.target.value)
              }
              placeholder="e.g. Rahul"
              required
              className="form-input"
            />

          </div>

          {/* AMOUNT */}

          <div>

            <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
              Amount
            </label>

            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="e.g. 2000"
              required
              min="0"
              step="0.01"
              className="form-input"
            />

          </div>

          {/* LOAN TYPE */}

          <div>

            <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
              Loan Type
            </label>

            <div className="flex gap-2">

              {/* LENT */}

              <button
                type="button"
                onClick={() =>
                  setType('lent')
                }
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  type === 'lent'
                    ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                    : 'border-white/[0.06] text-gray-500 hover:text-gray-300'
                }`}
              >
                Money Lent
              </button>

              {/* BORROWED */}

              <button
                type="button"
                onClick={() =>
                  setType('borrowed')
                }
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  type === 'borrowed'
                    ? 'bg-red-400/10 border-red-400/30 text-red-400'
                    : 'border-white/[0.06] text-gray-500 hover:text-gray-300'
                }`}
              >
                Money Borrowed
              </button>

            </div>

          </div>

          {/* DATE */}

          <div>

            <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              required
              className="form-input"
            />

          </div>

          {/* DUE DATE */}

          <div>

            <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
              Due Date
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(e) =>
                setDueDate(e.target.value)
              }
              className="form-input"
            />

          </div>

          {/* BUTTONS */}

          <div className="flex gap-3 pt-2">

            {/* CANCEL */}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 glass text-gray-300 text-sm font-medium rounded-lg hover:text-white"
            >
              Cancel
            </button>

            {/* ADD */}

            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-emerald-400 text-[#050505] text-sm font-semibold rounded-lg hover:bg-emerald-300 transition-all"
            >
              Add Loan
            </button>

          </div>

        </form>

      </div>

    </Reveal>
  );
}