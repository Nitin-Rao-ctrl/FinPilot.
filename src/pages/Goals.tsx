import { useEffect, useMemo, useState } from 'react';
import {
  Target,
  Plus,
  X,
  Check,
  AlertTriangle,
  Trash2,
  CalendarDays,
  Wallet,
  TrendingUp,
  History,
} from 'lucide-react';
import { Reveal } from '@/lib/animations';

type GoalStatus =
  | 'on-track'
  | 'challenging'
  | 'completed';

type SavingsEntry = {
  id: string;
  amount: number;
  date: string;
  note: string;
};

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  initialSavedAmount: number;
  savings: SavingsEntry[];
  savedAmount: number;
  progress: number;
  requiredMonthly: number;
  requiredWeekly: number;
  requiredDaily: number;
  deadline: string;
  status: GoalStatus;
};

const STORAGE_KEY = 'smartspend_goals_v2';

function formatMoney(value: number) {
  return `₹${Math.max(
    0,
    Math.round(value)
  ).toLocaleString('en-IN')}`;
}

function getDaysUntil(deadline: string) {
  const today = new Date();
  const target = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const difference =
    target.getTime() - today.getTime();

  return Math.max(
    0,
    Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    )
  );
}

function getMonthsUntil(deadline: string) {
  const today = new Date();
  const target = new Date(deadline);

  const months =
    (target.getFullYear() -
      today.getFullYear()) *
      12 +
    (target.getMonth() -
      today.getMonth());

  return Math.max(1, months);
}

function calculateProgress(
  targetAmount: number,
  savedAmount: number
) {
  if (targetAmount <= 0) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (savedAmount /
          targetAmount) *
          100
      )
    )
  );
}

function calculateRequiredMonthly(
  targetAmount: number,
  savedAmount: number,
  deadline: string
) {
  const remaining = Math.max(
    0,
    targetAmount - savedAmount
  );

  if (remaining <= 0) return 0;

  const months =
    getMonthsUntil(deadline);

  return Math.ceil(
    remaining / months
  );
}

function calculateRequiredWeekly(
  targetAmount: number,
  savedAmount: number,
  deadline: string
) {
  const remaining = Math.max(
    0,
    targetAmount - savedAmount
  );

  if (remaining <= 0) return 0;

  const days = Math.max(
    1,
    getDaysUntil(deadline)
  );

  return Math.ceil(
    remaining / (days / 7)
  );
}

function calculateRequiredDaily(
  targetAmount: number,
  savedAmount: number,
  deadline: string
) {
  const remaining = Math.max(
    0,
    targetAmount - savedAmount
  );

  if (remaining <= 0) return 0;

  const days = Math.max(
    1,
    getDaysUntil(deadline)
  );

  return Math.ceil(
    remaining / days
  );
}

function calculateStatus(
  targetAmount: number,
  savedAmount: number,
  deadline: string
): GoalStatus {
  if (savedAmount >= targetAmount) {
    return 'completed';
  }

  const remaining = Math.max(
    0,
    targetAmount - savedAmount
  );

  const days = getDaysUntil(deadline);

  if (days <= 0) {
    return 'challenging';
  }

  const requiredMonthly =
    remaining /
    Math.max(
      1,
      getMonthsUntil(deadline)
    );

  if (
    requiredMonthly <=
    targetAmount * 0.2
  ) {
    return 'on-track';
  }

  return 'challenging';
}

function normalizeGoal(
  goal: Partial<Goal>
): Goal {
  const initialSavedAmount =
    Number(
      goal.initialSavedAmount ??
        goal.savedAmount ??
        0
    );

  const savings = Array.isArray(
    goal.savings
  )
    ? goal.savings.map((entry) => ({
        id:
          String(
            entry.id ??
              `${Date.now()}-${Math.random()}`
          ),
        amount: Number(
          entry.amount ?? 0
        ),
        date:
          entry.date ??
          new Date()
            .toISOString()
            .split('T')[0],
        note: entry.note ?? '',
      }))
    : [];

  const totalSaved =
    initialSavedAmount +
    savings.reduce(
      (sum, entry) =>
        sum +
        Number(entry.amount || 0),
      0
    );

  const targetAmount = Number(
    goal.targetAmount ?? 0
  );

  const deadline =
    goal.deadline ??
    new Date(
      Date.now() +
        180 *
          24 *
          60 *
          60 *
          1000
    )
      .toISOString()
      .split('T')[0];

  return {
    id:
      goal.id ??
      `${Date.now()}-${Math.random()}`,

    name:
      goal.name ?? 'Untitled Goal',

    targetAmount,

    initialSavedAmount,

    savings,

    savedAmount: totalSaved,

    progress:
      calculateProgress(
        targetAmount,
        totalSaved
      ),

    requiredMonthly:
      calculateRequiredMonthly(
        targetAmount,
        totalSaved,
        deadline
      ),

    requiredWeekly:
      calculateRequiredWeekly(
        targetAmount,
        totalSaved,
        deadline
      ),

    requiredDaily:
      calculateRequiredDaily(
        targetAmount,
        totalSaved,
        deadline
      ),

    deadline,

    status:
      calculateStatus(
        targetAmount,
        totalSaved,
        deadline
      ),
  };
}

function refreshGoal(
  goal: Goal
): Goal {
  return normalizeGoal(goal);
}

export function GoalsPage() {
  const [goals, setGoals] =
    useState<Goal[]>([]);

  const [showCreate, setShowCreate] =
    useState(false);

  const [goalName, setGoalName] =
    useState('');

  const [targetAmount, setTargetAmount] =
    useState('');

  const [targetDate, setTargetDate] =
    useState('');

  const [savedAmount, setSavedAmount] =
    useState('');

  const [savingGoal, setSavingGoal] =
    useState<Goal | null>(null);

  const [savingAmount, setSavingAmount] =
    useState('');

  const [savingDate, setSavingDate] =
    useState(
      new Date()
        .toISOString()
        .split('T')[0]
    );

  const [savingNote, setSavingNote] =
    useState('');

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!stored) return;

      const parsed =
        JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        return;
      }

      setGoals(
        parsed.map((goal) =>
          normalizeGoal(goal)
        )
      );
    } catch (error) {
      console.error(
        'Failed to load goals:',
        error
      );
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(goals)
      );
    } catch (error) {
      console.error(
        'Failed to save goals:',
        error
      );
    }
  }, [goals]);

  function resetCreateForm() {
    setGoalName('');
    setTargetAmount('');
    setTargetDate('');
    setSavedAmount('');
  }

  function resetSavingsForm() {
    setSavingAmount('');
    setSavingDate(
      new Date()
        .toISOString()
        .split('T')[0]
    );
    setSavingNote('');
  }

  function handleCreateGoal() {
    const name =
      goalName.trim();

    const target =
      Number(targetAmount);

    const initialSaved =
      Number(savedAmount) || 0;

    if (!name) {
      alert(
        'Please enter a goal name.'
      );
      return;
    }

    if (!target || target <= 0) {
      alert(
        'Please enter a valid target amount.'
      );
      return;
    }

    if (
      initialSaved < 0
    ) {
      alert(
        'Saved amount cannot be negative.'
      );
      return;
    }

    if (
      initialSaved > target
    ) {
      alert(
        'Already saved cannot be greater than the target.'
      );
      return;
    }

    if (!targetDate) {
      alert(
        'Please select a target date.'
      );
      return;
    }

    const selectedDate =
      new Date(targetDate);

    const today =
      new Date();

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(
      0,
      0,
      0,
      0
    );

    if (selectedDate <= today) {
      alert(
        'Target date must be in the future.'
      );
      return;
    }

    const newGoal = normalizeGoal({
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,

      name,

      targetAmount:
        target,

      initialSavedAmount:
        initialSaved,

      savings: [],

      deadline:
        targetDate,
    });

    setGoals((current) => [
      newGoal,
      ...current,
    ]);

    resetCreateForm();
    setShowCreate(false);
  }

  function openAddSavings(
    goal: Goal
  ) {
    setSavingGoal(goal);
    resetSavingsForm();
  }

  function closeAddSavings() {
    setSavingGoal(null);
    resetSavingsForm();
  }

  function handleAddSavings() {
    if (!savingGoal) return;

    const amount =
      Number(savingAmount);

    if (!amount || amount <= 0) {
      alert(
        'Please enter a valid savings amount.'
      );
      return;
    }

    if (!savingDate) {
      alert(
        'Please select a date.'
      );
      return;
    }

    const remaining =
      Math.max(
        0,
        savingGoal.targetAmount -
          savingGoal.savedAmount
      );

    if (amount > remaining) {
      alert(
        `You can add maximum ${formatMoney(
          remaining
        )} to this goal.`
      );
      return;
    }

    const entry: SavingsEntry = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,

      amount,

      date: savingDate,

      note:
        savingNote.trim(),
    };

    setGoals((current) =>
      current.map((goal) => {
        if (
          goal.id !==
          savingGoal.id
        ) {
          return goal;
        }

        return refreshGoal({
          ...goal,
          savings: [
            ...(goal.savings || []),
            entry,
          ],
        });
      })
    );

    closeAddSavings();
  }

  function handleDeleteSavings(
    goalId: string,
    savingsId: string
  ) {
    const confirmed =
      window.confirm(
        'Delete this savings entry?'
      );

    if (!confirmed) return;

    setGoals((current) =>
      current.map((goal) => {
        if (
          goal.id !== goalId
        ) {
          return goal;
        }

        return refreshGoal({
          ...goal,
          savings:
            goal.savings.filter(
              (entry) =>
                entry.id !==
                savingsId
            ),
        });
      })
    );
  }

  function handleDeleteGoal(
    id: string
  ) {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this goal?'
      );

    if (!confirmed) return;

    setGoals((current) =>
      current.filter(
        (goal) =>
          goal.id !== id
      )
    );
  }

  const activeGoals =
    goals.filter(
      (goal) =>
        goal.status !==
        'completed'
    );

  const completedGoals =
    goals.filter(
      (goal) =>
        goal.status ===
        'completed'
    );

  const totalTarget =
    useMemo(
      () =>
        activeGoals.reduce(
          (sum, goal) =>
            sum +
            goal.targetAmount,
          0
        ),
      [activeGoals]
    );

  const totalSaved =
    useMemo(
      () =>
        activeGoals.reduce(
          (sum, goal) =>
            sum +
            goal.savedAmount,
          0
        ),
      [activeGoals]
    );

  const overallProgress =
    totalTarget > 0
      ? Math.round(
          (totalSaved /
            totalTarget) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Reveal>
        <div className="flex items-start justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold text-white">
              Goals
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Track goals, add savings and follow your automatic plan
            </p>
          </div>

          <button
            onClick={() => {
              resetCreateForm();
              setShowCreate(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-400 text-[#050505] rounded-xl text-sm font-semibold hover:bg-emerald-300 transition-all glow-emerald"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>

        </div>
      </Reveal>

      {/* ======================================================
          OVERVIEW
      ====================================================== */}

      <Reveal delay={40}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <OverviewCard
            icon={Target}
            label="Active Goals"
            value={String(
              activeGoals.length
            )}
          />

          <OverviewCard
            icon={Wallet}
            label="Total Target"
            value={formatMoney(
              totalTarget
            )}
          />

          <OverviewCard
            icon={TrendingUp}
            label="Total Saved"
            value={formatMoney(
              totalSaved
            )}
          />

          <OverviewCard
            icon={Target}
            label="Overall Progress"
            value={`${Math.min(
              100,
              overallProgress
            )}%`}
          />

        </div>
      </Reveal>

      {/* ======================================================
          CREATE GOAL
      ====================================================== */}

      {showCreate && (
        <Reveal delay={60}>
          <div className="glass-card border border-emerald-400/30 overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-white">
                    New Savings Goal
                  </h2>

                  <p className="text-xs text-gray-500 mt-0.5">
                    FinPilot will calculate your daily, weekly and monthly plan
                  </p>
                </div>

              </div>

              <button
                onClick={() => {
                  resetCreateForm();
                  setShowCreate(false);
                }}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/[0.05] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div className="p-6 space-y-5">

              <div>
                <label className="metric-label block mb-2">
                  GOAL NAME
                </label>

                <input
                  type="text"
                  value={goalName}
                  onChange={(e) =>
                    setGoalName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Camera, Laptop, Trip"
                  className="form-input"
                />
              </div>

              <div>
                <label className="metric-label block mb-2">
                  TARGET AMOUNT
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={targetAmount}
                    onChange={(e) =>
                      setTargetAmount(
                        e.target.value
                      )
                    }
                    placeholder="50000"
                    className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/[0.07] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/40"
                  />
                </div>
              </div>

              <div>
                <label className="metric-label block mb-2">
                  ALREADY SAVED
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={savedAmount}
                    onChange={(e) =>
                      setSavedAmount(
                        e.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/[0.07] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/40"
                  />
                </div>
              </div>

              <div>
                <label className="metric-label block mb-2">
                  TARGET DATE
                </label>

                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) =>
                    setTargetDate(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.07] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-400/40"
                />
              </div>

              {targetAmount &&
                targetDate && (
                  <GoalPlanPreview
                    targetAmount={
                      Number(
                        targetAmount
                      ) || 0
                    }
                    savedAmount={
                      Number(
                        savedAmount
                      ) || 0
                    }
                    deadline={
                      targetDate
                    }
                  />
                )}

              <div className="flex items-center justify-end gap-3 pt-2">

                <button
                  onClick={() => {
                    resetCreateForm();
                    setShowCreate(false);
                  }}
                  className="px-5 py-3 bg-white/[0.04] border border-white/[0.07] text-gray-300 text-sm font-semibold rounded-lg hover:bg-white/[0.07]"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleCreateGoal
                  }
                  className="px-6 py-3 bg-emerald-400 text-[#050505] text-sm font-semibold rounded-lg hover:bg-emerald-300"
                >
                  Create Goal
                </button>

              </div>

            </div>
          </div>
        </Reveal>
      )}

      {/* ======================================================
          ACTIVE GOALS
      ====================================================== */}

      <Reveal delay={100}>
        <div>

          <div className="flex items-center justify-between mb-4">
            <span className="metric-label text-emerald-400">
              ACTIVE GOALS
            </span>

            <span className="text-xs text-gray-600">
              {activeGoals.length}{' '}
              {activeGoals.length === 1
                ? 'goal'
                : 'goals'}
            </span>
          </div>

          {activeGoals.length === 0 ? (
            <div className="glass-card p-10 text-center">

              <div className="w-12 h-12 mx-auto rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-gray-600" />
              </div>

              <p className="text-sm text-gray-500">
                No active goals yet.
              </p>

              <p className="text-xs text-gray-600 mt-1">
                Create your first savings goal.
              </p>

              <button
                onClick={() => {
                  resetCreateForm();
                  setShowCreate(true);
                }}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-400/10 text-emerald-400 border border-emerald-400/15 rounded-lg text-sm font-medium hover:bg-emerald-400/15"
              >
                <Plus className="w-4 h-4" />
                Create Goal
              </button>

            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

              {activeGoals.map(
                (goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={
                      handleDeleteGoal
                    }
                    onAddSavings={
                      openAddSavings
                    }
                    onDeleteSavings={
                      handleDeleteSavings
                    }
                  />
                )
              )}

            </div>
          )}

        </div>
      </Reveal>

      {/* ======================================================
          COMPLETED GOALS
      ====================================================== */}

      {completedGoals.length > 0 && (
        <Reveal delay={150}>
          <div>

            <span className="metric-label text-emerald-400 block mb-4">
              COMPLETED GOALS
            </span>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

              {completedGoals.map(
                (goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={
                      handleDeleteGoal
                    }
                    onAddSavings={
                      openAddSavings
                    }
                    onDeleteSavings={
                      handleDeleteSavings
                    }
                  />
                )
              )}

            </div>

          </div>
        </Reveal>
      )}

      {/* ======================================================
          ADD SAVINGS PANEL
      ====================================================== */}

      {savingGoal && (
        <Reveal>
          <div className="glass-card border border-emerald-400/30 overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>

                <div>

                  <h2 className="text-base font-semibold text-white">
                    Add Savings
                  </h2>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Add savings to {savingGoal.name}
                  </p>

                </div>

              </div>

              <button
                onClick={
                  closeAddSavings
                }
                className="p-2 text-gray-500 hover:text-white hover:bg-white/[0.05] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div className="p-6">

              <div className="grid md:grid-cols-3 gap-3 mb-5">

                <div className="bg-white/[0.02] rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">
                    Target
                  </p>
                  <p className="text-lg font-bold text-white mt-1">
                    {formatMoney(
                      savingGoal.targetAmount
                    )}
                  </p>
                </div>

                <div className="bg-white/[0.02] rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">
                    Saved
                  </p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">
                    {formatMoney(
                      savingGoal.savedAmount
                    )}
                  </p>
                </div>

                <div className="bg-white/[0.02] rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">
                    Remaining
                  </p>
                  <p className="text-lg font-bold text-white mt-1">
                    {formatMoney(
                      Math.max(
                        0,
                        savingGoal.targetAmount -
                          savingGoal.savedAmount
                      )
                    )}
                  </p>
                </div>

              </div>

              <div className="grid md:grid-cols-2 gap-5">

                <div>

                  <label className="metric-label block mb-2">
                    SAVING AMOUNT
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={savingAmount}
                      onChange={(e) =>
                        setSavingAmount(
                          e.target.value
                        )
                      }
                      placeholder="3000"
                      className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/[0.07] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/40"
                    />

                  </div>

                </div>

                <div>

                  <label className="metric-label block mb-2">
                    DATE
                  </label>

                  <input
                    type="date"
                    value={savingDate}
                    onChange={(e) =>
                      setSavingDate(
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.07] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-400/40"
                  />

                </div>

                <div className="md:col-span-2">

                  <label className="metric-label block mb-2">
                    NOTE (OPTIONAL)
                  </label>

                  <input
                    type="text"
                    value={savingNote}
                    onChange={(e) =>
                      setSavingNote(
                        e.target.value
                      )
                    }
                    placeholder="e.g. August savings"
                    className="form-input"
                  />

                </div>

              </div>

              <div className="flex justify-end gap-3 mt-5">

                <button
                  onClick={
                    closeAddSavings
                  }
                  className="px-5 py-3 bg-white/[0.04] border border-white/[0.07] text-gray-300 text-sm font-semibold rounded-lg hover:bg-white/[0.07]"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleAddSavings
                  }
                  className="px-6 py-3 bg-emerald-400 text-[#050505] text-sm font-semibold rounded-lg hover:bg-emerald-300"
                >
                  Add Savings
                </button>

              </div>

            </div>

          </div>
        </Reveal>
      )}

    </div>
  );
}

/* ============================================================
   GOAL PLAN PREVIEW
============================================================ */

function GoalPlanPreview({
  targetAmount,
  savedAmount,
  deadline,
}: {
  targetAmount: number;
  savedAmount: number;
  deadline: string;
}) {
  const remaining =
    Math.max(
      0,
      targetAmount -
        savedAmount
    );

  const progress =
    calculateProgress(
      targetAmount,
      savedAmount
    );

  const monthly =
    calculateRequiredMonthly(
      targetAmount,
      savedAmount,
      deadline
    );

  const weekly =
    calculateRequiredWeekly(
      targetAmount,
      savedAmount,
      deadline
    );

  

  const status =
    calculateStatus(
      targetAmount,
      savedAmount,
      deadline
    );

  return (
    <div className="rounded-2xl bg-emerald-400/[0.03] border border-emerald-400/10 p-5">

      <div className="flex items-center justify-between mb-4">

        <div>
          <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
            AUTO PLAN
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Your required savings pace
          </p>
        </div>

        <StatusBadge
          status={status}
        />

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <PlanStat
          label="Remaining"
          value={formatMoney(
            remaining
          )}
        />

        <PlanStat
          label="Per Month"
          value={formatMoney(
            monthly
          )}
        />

        <PlanStat
          label="Per Week"
          value={formatMoney(
            weekly
          )}
        />

        

      </div>

      <div className="mt-4">

        <div className="flex items-center justify-between text-xs mb-2">

          <span className="text-gray-500">
            Current progress
          </span>

          <span className="text-gray-300">
            {progress}%
          </span>

        </div>

        <div className="h-2 bg-white/5 rounded-full overflow-hidden">

          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   GOAL CARD
============================================================ */

function GoalCard({
  goal,
  onDelete,
  onAddSavings,
  onDeleteSavings,
}: {
  goal: Goal;
  onDelete: (id: string) => void;
  onAddSavings: (goal: Goal) => void;
  onDeleteSavings: (
    goalId: string,
    savingsId: string
  ) => void;
}) {
  const isCompleted =
    goal.status === 'completed';

  const isOnTrack =
    goal.status === 'on-track';

  const progress =
    Math.min(
      100,
      Math.max(
        0,
        goal.progress
      )
    );

  const remaining =
    Math.max(
      0,
      goal.targetAmount -
        goal.savedAmount
    );

  const daysLeft =
    getDaysUntil(
      goal.deadline
    );

  const sortedSavings = [
    ...(goal.savings || []),
  ].sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  );

  return (
    <div className="glass-card p-5">

      {/* HEADER */}

      <div className="flex items-center justify-between mb-4">

        <span className="text-sm uppercase tracking-[0.15em] font-semibold text-white">
          {goal.name}
        </span>

        <StatusBadge
          status={goal.status}
        />

      </div>

      {/* TARGET */}

      <p className="text-3xl font-bold text-white">
        {formatMoney(
          goal.targetAmount
        )}
      </p>

      <p className="text-xs text-gray-500 mt-1">
        {formatMoney(
          remaining
        )}{' '}
        remaining
      </p>

      {/* PROGRESS */}

      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mt-4 mb-3">

        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCompleted
              ? 'bg-blue-400'
              : isOnTrack
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              : 'bg-gradient-to-r from-amber-500 to-amber-400'
          }`}
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

      <div className="flex justify-between text-xs">

        <span className="text-gray-500">
          Saved: {formatMoney(
            goal.savedAmount
          )}
        </span>

        <span className="text-gray-500">
          {progress}%
        </span>

      </div>

      {/* AUTO PLAN */}

      <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-2">

        <GoalDetail
          label="Required / Month"
          value={formatMoney(
            goal.requiredMonthly
          )}
        />

        <GoalDetail
          label="Required / Week"
          value={formatMoney(
            goal.requiredWeekly
          )}
        />

        <GoalDetail
          label="Required / Day"
          value={formatMoney(
            goal.requiredDaily
          )}
        />

        <GoalDetail
          label="Time Remaining"
          value={
            isCompleted
              ? 'Complete'
              : `${daysLeft} days`
          }
        />

      </div>

      {/* ADD SAVINGS */}

      {!isCompleted && (
        <button
          onClick={() =>
            onAddSavings(goal)
          }
          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/15 text-sm font-semibold hover:bg-emerald-400/15 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Savings
        </button>
      )}

      {/* SAVINGS HISTORY */}

      <div className="mt-4 pt-4 border-t border-white/[0.04]">

        <div className="flex items-center justify-between mb-3">

          <div className="flex items-center gap-2">

            <History className="w-3.5 h-3.5 text-gray-500" />

            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              Savings History
            </span>

          </div>

          <span className="text-[10px] text-gray-600">
            {sortedSavings.length}{' '}
            entries
          </span>

        </div>

        {sortedSavings.length === 0 ? (

          <p className="text-xs text-gray-600">
            No monthly savings added yet.
          </p>

        ) : (

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">

            {sortedSavings.map(
              (entry) => (

                <div
                  key={entry.id}
                  className="flex items-center gap-3 bg-white/[0.02] rounded-lg p-2.5"
                >

                  <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center justify-between gap-3">

                      <p className="text-sm font-semibold text-emerald-400">
                        +{formatMoney(
                          entry.amount
                        )}
                      </p>

                      <button
                        onClick={() =>
                          onDeleteSavings(
                            goal.id,
                            entry.id
                          )
                        }
                        className="text-[10px] text-gray-600 hover:text-red-400"
                      >
                        Delete
                      </button>

                    </div>

                    <p className="text-[10px] text-gray-500 mt-0.5">

                      {new Date(
                        entry.date
                      ).toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}

                      {entry.note
                        ? ` · ${entry.note}`
                        : ''}

                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* STATUS */}

      {goal.status ===
        'challenging' && (
        <div className="mt-4 flex items-start gap-2 bg-amber-400/[0.05] border border-amber-400/10 rounded-xl p-3">

          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />

          <p className="text-xs text-amber-300 leading-relaxed">
            You need to maintain this savings pace to reach the goal on time.
            Consider increasing your monthly savings or extending the deadline.
          </p>

        </div>
      )}

      {goal.status ===
        'on-track' && (
        <div className="mt-4 flex items-start gap-2 bg-emerald-400/[0.05] border border-emerald-400/10 rounded-xl p-3">

          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />

          <p className="text-xs text-emerald-300 leading-relaxed">
            Your current plan is reasonable for this target date.
          </p>

        </div>
      )}

      {goal.status ===
        'completed' && (
        <div className="mt-4 flex items-start gap-2 bg-blue-400/[0.05] border border-blue-400/10 rounded-xl p-3">

          <Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />

          <p className="text-xs text-blue-300">
            Congratulations! You reached this savings goal.
          </p>

        </div>
      )}

      {/* DELETE GOAL */}

      <button
        onClick={() =>
          onDelete(goal.id)
        }
        className="mt-4 p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
        title="Delete goal"
      >
        <Trash2 className="w-4 h-4" />
      </button>

    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: GoalStatus;
}) {
  return (
    <span
      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
        status === 'completed'
          ? 'bg-blue-400/10 text-blue-400'
          : status === 'on-track'
          ? 'bg-emerald-400/10 text-emerald-400'
          : 'bg-amber-400/10 text-amber-400'
      }`}
    >
      {status === 'completed'
        ? 'COMPLETED'
        : status === 'on-track'
        ? 'ON TRACK'
        : 'CHALLENGING'}
    </span>
  );
}

/* ============================================================
   GOAL DETAIL
============================================================ */

function GoalDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">

      <span className="text-gray-500">
        {label}
      </span>

      <span className="text-gray-300">
        {value}
      </span>

    </div>
  );
}

/* ============================================================
   PLAN STAT
============================================================ */

function PlanStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-3">

      <p className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p className="text-base font-bold text-white mt-1">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   OVERVIEW CARD
============================================================ */

function OverviewCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card p-4">

      <div className="flex items-center gap-2 mb-3">

        <Icon className="w-4 h-4 text-emerald-400" />

        <p className="metric-label">
          {label}
        </p>

      </div>

      <p className="text-lg md:text-xl font-bold text-white">
        {value}
      </p>

    </div>
  );
}

export default GoalsPage;
