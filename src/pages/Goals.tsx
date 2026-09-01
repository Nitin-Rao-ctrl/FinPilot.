import { useEffect, useMemo, useState } from 'react';
import {
  Target,
  Plus,
  X,
  Trash2,
  Check,
  Wallet,
} from 'lucide-react';

import { Reveal } from '@/lib/animations';
import { supabase } from '@/lib/supabase';

type GoalStatus = 'on-track' | 'challenging' | 'completed';

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  requiredMonthly: number;
  requiredWeekly: number;
  requiredDaily: number;
  status: GoalStatus;
  progress: number;
};

/* ============================================================
   HELPERS
   ============================================================ */

function calculateProgress(
  targetAmount: number,
  savedAmount: number
): number {
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return 0;
  }

  const safeSaved = Math.max(0, savedAmount);

  return Math.min(
    100,
    Math.round((safeSaved / targetAmount) * 100)
  );
}

function getDaysRemaining(deadline: string): number {
  const today = new Date();
  const target = new Date(`${deadline}T23:59:59`);

  if (Number.isNaN(target.getTime())) {
    return 1;
  }

  const diff =
    target.getTime() - today.getTime();

  return Math.max(
    1,
    Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    )
  );
}

function calculateRequiredDaily(
  targetAmount: number,
  savedAmount: number,
  deadline: string
): number {
  const safeTarget = Number.isFinite(targetAmount)
    ? Math.max(0, targetAmount)
    : 0;
  const safeSaved = Number.isFinite(savedAmount)
    ? Math.max(0, savedAmount)
    : 0;

  const remaining = Math.max(
    0,
    safeTarget - safeSaved
  );

  if (remaining <= 0) {
    return 0;
  }

  const days = getDaysRemaining(deadline);

  return Math.ceil(
    remaining / days
  );
}

function calculateRequiredWeekly(
  targetAmount: number,
  savedAmount: number,
  deadline: string
): number {
  const safeTarget = Number.isFinite(targetAmount)
    ? Math.max(0, targetAmount)
    : 0;
  const safeSaved = Number.isFinite(savedAmount)
    ? Math.max(0, savedAmount)
    : 0;

  const remaining = Math.max(
    0,
    safeTarget - safeSaved
  );

  if (remaining <= 0) {
    return 0;
  }

  const days = getDaysRemaining(deadline);
  const weeks = Math.max(
    1,
    Math.ceil(days / 7)
  );

  return Math.ceil(
    remaining / weeks
  );
}

function calculateRequiredMonthly(
  targetAmount: number,
  savedAmount: number,
  deadline: string
): number {
  const safeTarget = Number.isFinite(targetAmount)
    ? Math.max(0, targetAmount)
    : 0;
  const safeSaved = Number.isFinite(savedAmount)
    ? Math.max(0, savedAmount)
    : 0;

  const remaining = Math.max(
    0,
    safeTarget - safeSaved
  );

  if (remaining <= 0) {
    return 0;
  }

  const today = new Date();
  const target = new Date(`${deadline}T23:59:59`);

  if (Number.isNaN(target.getTime())) {
    return remaining;
  }

  const months =
    (target.getFullYear() -
      today.getFullYear()) *
      12 +
    (target.getMonth() -
      today.getMonth());

  // Same-month or overdue goals need the remaining amount
  // rather than dividing by zero/negative months.
  return Math.ceil(
    remaining / Math.max(1, months)
  );
}

function calculateStatus(
  targetAmount: number,
  savedAmount: number,
  deadline: string
): GoalStatus {
  if (
    targetAmount > 0 &&
    savedAmount >= targetAmount
  ) {
    return 'completed';
  }

  const progress = calculateProgress(
    targetAmount,
    savedAmount
  );

  const today = new Date();
  const target = new Date(`${deadline}T23:59:59`);

  const daysRemaining =
    !deadline || Number.isNaN(target.getTime())
      ? 1
      : Math.ceil(
          (target.getTime() -
            today.getTime()) /
            (1000 * 60 * 60 * 24)
        );

  if (
    daysRemaining <= 0 &&
    savedAmount < targetAmount
  ) {
    return 'challenging';
  }

  if (progress >= 50) {
    return 'on-track';
  }

  return 'challenging';
}

/* ============================================================
   NORMALIZE GOAL

   IMPORTANT:
   There is NO default/mock goal here.
   If a goal does not exist, it is NOT created automatically.
   ============================================================ */

function normalizeGoal(goal: unknown): Goal {
  const source =
    goal && typeof goal === 'object'
      ? (goal as Record<string, unknown>)
      : {};

  const targetAmount = Math.max(
    0,
    Number(source.targetAmount) || 0
  );

  const savedAmount = Math.max(
    0,
    Number(source.savedAmount) || 0
  );

  const deadline =
    typeof source.deadline === 'string' &&
    source.deadline.length > 0
      ? source.deadline
      : '';

  return {
    id:
      typeof source.id === 'string' &&
      source.id.length > 0
        ? source.id
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,

    name:
      typeof source.name === 'string'
        ? source.name
        : '',

    targetAmount,

    savedAmount,

    deadline,

    requiredMonthly:
      deadline
        ? calculateRequiredMonthly(
            targetAmount,
            savedAmount,
            deadline
          )
        : 0,

    requiredWeekly:
      deadline
        ? calculateRequiredWeekly(
            targetAmount,
            savedAmount,
            deadline
          )
        : 0,

    requiredDaily:
      deadline
        ? calculateRequiredDaily(
            targetAmount,
            savedAmount,
            deadline
          )
        : 0,

    progress:
      calculateProgress(
        targetAmount,
        savedAmount
      ),

    status:
      deadline
        ? calculateStatus(
            targetAmount,
            savedAmount,
            deadline
          )
        : 'challenging',
  };
}

/* ============================================================
   GOALS PAGE
   ============================================================ */

export function GoalsPage() {
  const [userId, setUserId] =
    useState<string | null>(null);

  const [goals, setGoals] =
    useState<Goal[]>([]);

  const [loadingGoals, setLoadingGoals] =
    useState(true);

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
      (() => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(
          date.getMonth() + 1
        ).padStart(2, '0');
        const day = String(
          date.getDate()
        ).padStart(2, '0');

        return `${year}-${month}-${day}`;
      })()
    );

  const [deleteGoalId, setDeleteGoalId] =
    useState<string | null>(null);

  /* ============================================================
     GET CURRENT SUPABASE USER
     ============================================================ */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (!mounted) {
          return;
        }

        if (!user) {
          setUserId(null);
          setGoals([]);
          setLoadingGoals(false);
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error(
          'Failed to get current user:',
          error
        );

        if (mounted) {
          setUserId(null);
          setGoals([]);
          setLoadingGoals(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     LOAD GOALS FOR CURRENT USER ONLY
     ============================================================ */

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setLoadingGoals(false);
      return;
    }

    loadGoalsForUser(userId);
  }, [userId]);

  async function loadGoalsForUser(
    currentUserId: string
  ) {
    setLoadingGoals(true);

    try {
      /*
        CRITICAL:

        Every account gets its own key.

        User A:
        smartspend_goals_USER_A

        User B:
        smartspend_goals_USER_B

        There is NO:
        - mockGoals
        - default goal
        - global goals key
        - fallback goal
      */

      const storageKey =
        `finpilot_goals_${currentUserId}`;

      const stored =
        localStorage.getItem(storageKey) ??
        localStorage.getItem(
          `smartspend_goals_${currentUserId}`
        );

      /*
        Brand-new account:

        No storage entry = EMPTY GOALS.

        We do NOT create a default goal.
        We do NOT create ₹50,000.
      */

      if (!stored) {
        setGoals([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setGoals([]);
        return;
      }

      /*
        Remove invalid/corrupted entries.
      */

      const validGoals = parsed
        .filter(
          (goal: unknown) =>
            goal &&
            typeof goal === 'object'
        )
        .map((goal: unknown) => normalizeGoal(goal))
        .filter(
          (goal) =>
            goal.name.trim() !== '' &&
            goal.targetAmount > 0 &&
            goal.deadline !== ''
        );

      setGoals(validGoals);
    } catch (error) {
      console.error(
        'Failed to load goals:',
        error
      );

      setGoals([]);
    } finally {
      setLoadingGoals(false);
    }
  }

  /* ============================================================
     SAVE GOALS
     ============================================================ */

  useEffect(() => {
    if (
      loadingGoals ||
      !userId
    ) {
      return;
    }

    try {
      const storageKey =
        `finpilot_goals_${userId}`;

      localStorage.setItem(
        storageKey,
        JSON.stringify(goals)
      );
    } catch (error) {
      console.error(
        'Failed to save goals:',
        error
      );
    }
  }, [
    goals,
    userId,
    loadingGoals,
  ]);

  /* ============================================================
     CREATE GOAL
     ============================================================ */

  function handleCreateGoal() {
    if (!userId) {
      alert(
        'Please login before creating a goal.'
      );
      return;
    }

    const name =
      goalName.trim();

    const target =
      Number(targetAmount);

    const initialSaved =
      Math.max(
        0,
        Number(savedAmount) || 0
      );

    if (!name) {
      alert(
        'Please enter a goal name.'
      );
      return;
    }

    if (
      !Number.isFinite(target) ||
      target <= 0
    ) {
      alert(
        'Please enter a valid target amount.'
      );
      return;
    }

    if (!targetDate) {
      alert(
        'Please select a target date.'
      );
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(
      `${targetDate}T00:00:00`
    );

    if (
      Number.isNaN(deadlineDate.getTime()) ||
      deadlineDate < today
    ) {
      alert(
        'Please select today or a future target date.'
      );
      return;
    }

    if (initialSaved > target) {
      alert(
        'Already saved amount cannot be greater than the target amount.'
      );
      return;
    }

    const goal =
      normalizeGoal({
        id:
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,

        name,

        targetAmount:
          target,

        savedAmount:
          initialSaved,

        deadline:
          targetDate,
      });

    setGoals(
      (previous) => [
        goal,
        ...previous,
      ]
    );

    setGoalName('');
    setTargetAmount('');
    setSavedAmount('');
    setTargetDate('');
    setShowCreate(false);
  }

  /* ============================================================
     DELETE GOAL
     ============================================================ */

  function handleDeleteGoal(
    id: string
  ) {
    setDeleteGoalId(id);
  }

  function confirmDeleteGoal() {
    if (!deleteGoalId) {
      return;
    }

    setGoals(
      (previous) =>
        previous.filter(
          (goal) =>
            goal.id !==
            deleteGoalId
        )
    );

    if (
      savingGoal?.id ===
      deleteGoalId
    ) {
      setSavingGoal(null);
    }

    setDeleteGoalId(null);
  }

  /* ============================================================
     ADD SAVINGS
     ============================================================ */

  function handleAddSaving() {
    if (!savingGoal) {
      return;
    }

    const amount =
      Number(savingAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        'Please enter a valid saving amount.'
      );
      return;
    }

    if (!savingDate) {
      alert(
        'Please select a date.'
      );
      return;
    }

    const newSavedAmount =
      Math.max(
        0,
        savingGoal.savedAmount +
          amount
      );

    if (
      !Number.isFinite(newSavedAmount)
    ) {
      alert(
        'Please enter a valid saving amount.'
      );
      return;
    }

    if (
      newSavedAmount >
      savingGoal.targetAmount
    ) {
      alert(
        `You only need ₹${Math.max(
          0,
          savingGoal.targetAmount -
            savingGoal.savedAmount
        ).toLocaleString('en-IN')} more for this goal.`
      );
      return;
    }

    setGoals(
      (previous) =>
        previous.map(
          (goal) => {
            if (
              goal.id !==
              savingGoal.id
            ) {
              return goal;
            }

            return normalizeGoal({
              ...goal,
              savedAmount:
                newSavedAmount,
            });
          }
        )
    );

    setSavingAmount('');
    setSavingDate(
      (() => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(
          date.getMonth() + 1
        ).padStart(2, '0');
        const day = String(
          date.getDate()
        ).padStart(2, '0');

        return `${year}-${month}-${day}`;
      })()
    );
    setSavingGoal(null);
  }

  /* ============================================================
     ACTIVE / COMPLETED
     ============================================================ */

  const activeGoals =
    useMemo(
      () =>
        goals.filter(
          (goal) =>
            goal.status !==
            'completed'
        ),
      [goals]
    );

  const completedGoals =
    useMemo(
      () =>
        goals.filter(
          (goal) =>
            goal.status ===
            'completed'
        ),
      [goals]
    );

  /* ============================================================
     LOADING
     ============================================================ */

  if (loadingGoals) {
    return (
      <div className="space-y-6">
        <Reveal>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Goals
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Loading your goals...
            </p>
          </div>
        </Reveal>

        <div className="glass-card p-8 text-center">
          <p className="text-sm text-gray-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <div className="space-y-6 pb-8">

      {/* HEADER */}

      <Reveal>
        <div className="flex items-center justify-between gap-4">

          <div>
            <div className="flex items-center gap-2">

              <Target className="w-5 h-5 text-emerald-400" />

              <h1 className="text-2xl font-bold text-white">
                Goals
              </h1>

            </div>

            <p className="text-sm text-gray-500 mt-1">
              Track goals, add savings and follow your automatic plan
            </p>
          </div>

          <button
            onClick={() =>
              setShowCreate(true)
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all glow-emerald"
          >
            <Plus className="w-4 h-4" />

            Create Goal
          </button>

        </div>
      </Reveal>

      {/* CREATE GOAL */}

      {showCreate && (
        <Reveal>
          <div className="glass-card p-5">

            <div className="flex items-center justify-between mb-5">

              <div>
                <span className="metric-label">
                  New Goal
                </span>

                <h2 className="text-lg font-semibold text-white mt-1">
                  Create a savings goal
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="p-2 text-gray-500 hover:text-white"
                aria-label="Close create goal"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* NAME */}

              <div>
                <label className="metric-label">
                  Goal Name
                </label>

                <input
                  value={goalName}
                  onChange={(e) =>
                    setGoalName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. New Laptop"
                  className="w-full mt-2 px-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/30"
                />
              </div>

              {/* TARGET */}

              <div>
                <label className="metric-label">
                  Target Amount
                </label>

                <div className="relative mt-2">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={targetAmount}
                    onChange={(e) =>
                      setTargetAmount(
                        e.target.value
                      )
                    }
                    placeholder="50000"
                    className="w-full pl-8 pr-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/30"
                  />

                </div>
              </div>

              {/* SAVED */}

              <div>
                <label className="metric-label">
                  Already Saved
                </label>

                <div className="relative mt-2">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                    className="w-full pl-8 pr-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/30"
                  />

                </div>
              </div>

              {/* DEADLINE */}

              <div>
                <label className="metric-label">
                  Target Date
                </label>

                <input
                  type="date"
                  value={targetDate}
                  min={
                    new Date()
                      .toISOString()
                      .split('T')[0]
                  }
                  onChange={(e) =>
                    setTargetDate(
                      e.target.value
                    )
                  }
                  className="w-full mt-2 px-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-emerald-400/30"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-5">

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="px-4 py-2.5 rounded-lg border border-white/[0.06] text-gray-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCreateGoal
                }
                className="px-5 py-2.5 rounded-lg bg-emerald-400 text-[#050505] font-semibold hover:bg-emerald-300"
              >
                Create Goal
              </button>

            </div>

          </div>
        </Reveal>
      )}

      {/* ACTIVE GOALS */}

      <Reveal delay={50}>
        <div>

          <p className="section-label mb-3">
            Active Goals
          </p>

          {activeGoals.length === 0 ? (
            <div className="glass-card p-8 text-center">

              <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />

              <h2 className="text-lg font-semibold text-white">
                No active goals
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Create your first savings goal to get started.
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {activeGoals.map(
                (goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={() =>
                      handleDeleteGoal(
                        goal.id
                      )
                    }
                    onAddSaving={() => {
                      setSavingGoal(
                        goal
                      );

                      setSavingAmount(
                        ''
                      );

                      setSavingDate(
                        new Date()
                          .toISOString()
                          .split('T')[0]
                      );
                    }}
                  />
                )
              )}

            </div>
          )}

        </div>
      </Reveal>

      {/* COMPLETED */}

      {completedGoals.length > 0 && (
        <Reveal delay={100}>
          <div>

            <p className="section-label mb-3">
              Completed Goals
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {completedGoals.map(
                (goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={() =>
                      handleDeleteGoal(
                        goal.id
                      )
                    }
                    onAddSaving={() => {}}
                  />
                )
              )}

            </div>

          </div>
        </Reveal>
      )}

      {/* ADD SAVINGS MODAL */}

      {savingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">

          <div className="glass-card w-full max-w-md p-5">

            <div className="flex items-center justify-between mb-5">

              <div>
                <span className="metric-label">
                  Add Savings
                </span>

                <h2 className="text-lg font-semibold text-white mt-1">
                  {savingGoal.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSavingGoal(null)
                }
                className="p-2 text-gray-500 hover:text-white"
                aria-label="Close savings modal"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div>

              <label className="metric-label">
                Amount
              </label>

              <div className="relative mt-2">

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  value={savingAmount}
                  onChange={(e) =>
                    setSavingAmount(
                      e.target.value
                    )
                  }
                  placeholder="5000"
                  autoFocus
                  className="w-full pl-8 pr-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-emerald-400/30"
                />

              </div>
            </div>

            <div className="mt-4">

              <label className="metric-label">
                Date
              </label>

              <input
                type="date"
                value={savingDate}
                onChange={(e) =>
                  setSavingDate(
                    e.target.value
                  )
                }
                className="w-full mt-2 px-3 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-emerald-400/30"
              />

            </div>

            <div className="flex justify-end gap-3 mt-5">

              <button
                type="button"
                onClick={() =>
                  setSavingGoal(null)
                }
                className="px-4 py-2.5 rounded-lg border border-white/[0.06] text-gray-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleAddSaving
                }
                className="px-5 py-2.5 rounded-lg bg-emerald-400 text-[#050505] font-semibold hover:bg-emerald-300"
              >
                Add Savings
              </button>

            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {deleteGoalId && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={() =>
            setDeleteGoalId(null)
          }
        >

          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111514] p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-start justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10">

                  <Trash2 className="h-5 w-5 text-red-400" />

                </div>

                <div>

                  <h3 className="text-lg font-semibold text-white">
                    Delete this goal?
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    This action cannot be undone.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setDeleteGoalId(null)
                }
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close delete confirmation"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="mt-5 rounded-xl border border-red-500/10 bg-red-500/5 p-4">

              <p className="text-sm leading-6 text-gray-300">
                Are you sure you want to permanently delete this goal?
              </p>

            </div>

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={() =>
                  setDeleteGoalId(null)
                }
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  confirmDeleteGoal
                }
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Delete Goal
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* ============================================================
   GOAL CARD
   ============================================================ */

function GoalCard({
  goal,
  onDelete,
  onAddSaving,
}: {
  goal: Goal;
  onDelete: () => void;
  onAddSaving: () => void;
}) {
  const remaining =
    Math.max(
      0,
      goal.targetAmount -
        goal.savedAmount
    );

  const statusText =
    goal.status === 'completed'
      ? 'Completed'
      : goal.status === 'on-track'
      ? 'On track'
      : 'Challenging';

  const statusClass =
    goal.status === 'completed'
      ? 'text-emerald-400 bg-emerald-400/10'
      : goal.status === 'on-track'
      ? 'text-blue-400 bg-blue-400/10'
      : 'text-amber-400 bg-amber-400/10';

  const daysRemaining =
    goal.deadline
      ? getDaysRemaining(
          goal.deadline
        )
      : 0;

  return (
    <div className="glass-card p-5">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-3">

        <div className="flex items-start gap-3">

          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center flex-shrink-0">

            <Target className="w-5 h-5 text-emerald-400" />

          </div>

          <div>

            <h3 className="font-semibold text-white">
              {goal.name}
            </h3>

            <p className="text-xs text-gray-500 mt-0.5">
              Target:{' '}
              {goal.deadline
                ? new Date(
                    `${goal.deadline}T12:00:00`
                  ).toLocaleDateString(
                    'en-IN'
                  )
                : 'Not set'}
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-gray-600 hover:text-red-400 transition-colors"
          title="Delete goal"
          aria-label="Delete goal"
        >
          <Trash2 className="w-4 h-4" />
        </button>

      </div>

      {/* STATUS */}

      <div className="mt-4">

        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}`}
        >
          {statusText}
        </span>

      </div>

      {/* PROGRESS */}

      <div className="mt-5">

        <div className="flex items-center justify-between mb-2">

          <span className="text-sm text-gray-400">
            Progress
          </span>

          <span className="text-sm font-semibold text-white">
            {goal.progress}%
          </span>

        </div>

        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">

          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{
              width: `${Math.min(
                100,
                goal.progress
              )}%`,
            }}
          />

        </div>

      </div>

      {/* AMOUNTS */}

      <div className="grid grid-cols-2 gap-4 mt-5">

        <div>

          <p className="metric-label">
            Saved
          </p>

          <p className="text-lg font-bold text-white mt-1">
            ₹
            {goal.savedAmount.toLocaleString(
              'en-IN'
            )}
          </p>

        </div>

        <div>

          <p className="metric-label">
            Target
          </p>

          <p className="text-lg font-bold text-white mt-1">
            ₹
            {goal.targetAmount.toLocaleString(
              'en-IN'
            )}
          </p>

        </div>

      </div>

      {/* REMAINING */}

      {goal.status !== 'completed' && (
        <div className="mt-4 flex items-start gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">

          <Wallet className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />

          <div>

            <p className="text-xs text-gray-500">
              Remaining
            </p>

            <p className="text-sm font-semibold text-white">
              ₹
              {remaining.toLocaleString(
                'en-IN'
              )}
            </p>

          </div>

        </div>
      )}

      {/* REQUIRED SAVING */}

      {goal.status !== 'completed' && (
        <div className="grid grid-cols-3 gap-2 mt-4">

          <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">

            <p className="text-[10px] text-gray-600 uppercase">
              Daily
            </p>

            <p className="text-xs font-semibold text-gray-300 mt-1">
              ₹
              {goal.requiredDaily.toLocaleString(
                'en-IN'
              )}
            </p>

          </div>

          <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">

            <p className="text-[10px] text-gray-600 uppercase">
              Weekly
            </p>

            <p className="text-xs font-semibold text-gray-300 mt-1">
              ₹
              {goal.requiredWeekly.toLocaleString(
                'en-IN'
              )}
            </p>

          </div>

          <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">

            <p className="text-[10px] text-gray-600 uppercase">
              Monthly
            </p>

            <p className="text-xs font-semibold text-gray-300 mt-1">
              ₹
              {goal.requiredMonthly.toLocaleString(
                'en-IN'
              )}
            </p>

          </div>

        </div>
      )}

      {/* TIME */}

      {goal.status !== 'completed' &&
        goal.deadline && (
          <div className="mt-4 text-xs text-gray-500">
            {daysRemaining} day
            {daysRemaining === 1
              ? ''
              : 's'} remaining
          </div>
        )}

      {/* ADD SAVING */}

      {goal.status !== 'completed' && (
        <button
          type="button"
          onClick={onAddSaving}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.07] transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Savings
        </button>
      )}

      {/* COMPLETED */}

      {goal.status === 'completed' && (
        <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-semibold">

          <Check className="w-4 h-4" />

          Goal completed

        </div>
      )}

    </div>
  );
}

export default GoalsPage;