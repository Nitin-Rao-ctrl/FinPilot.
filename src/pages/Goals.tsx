import { useEffect, useMemo, useState } from 'react';
import {
  Target,
  Plus,
  X,
  Trash2,
  AlertTriangle,
  Check,
  Wallet,
} from 'lucide-react';

import { Reveal } from '@/lib/animations';
import { supabase } from '@/lib/supabase';

type GoalStatus =
  | 'on-track'
  | 'challenging'
  | 'completed';

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

function calculateProgress(
  targetAmount: number,
  savedAmount: number
) {
  if (targetAmount <= 0) return 0;

  return Math.min(
    100,
    Math.round(
      (savedAmount / targetAmount) * 100
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

  const today = new Date();
  const target = new Date(deadline);

  const months =
    (target.getFullYear() -
      today.getFullYear()) *
      12 +
    (target.getMonth() -
      today.getMonth());

  return Math.ceil(
    remaining / Math.max(1, months)
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

  const today = new Date();
  const target = new Date(deadline);

  const days = Math.max(
    1,
    Math.ceil(
      (target.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const weeks = Math.max(
    1,
    Math.ceil(days / 7)
  );

  return Math.ceil(
    remaining / weeks
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

  const today = new Date();
  const target = new Date(deadline);

  const days = Math.max(
    1,
    Math.ceil(
      (target.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    )
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
  if (
    targetAmount > 0 &&
    savedAmount >= targetAmount
  ) {
    return 'completed';
  }

  const progress =
    calculateProgress(
      targetAmount,
      savedAmount
    );

  const today = new Date();
  const target = new Date(deadline);

  const daysRemaining = Math.ceil(
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

function normalizeGoal(
  goal: any
): Goal {
  const targetAmount =
    Number(goal.targetAmount || 0);

  const savedAmount =
    Number(goal.savedAmount || 0);

  const deadline =
    goal.deadline ||
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
      goal.id ||
      `${Date.now()}-${Math.random()}`,

    name:
      goal.name ||
      'Untitled Goal',

    targetAmount,

    savedAmount,

    deadline,

    requiredMonthly:
      calculateRequiredMonthly(
        targetAmount,
        savedAmount,
        deadline
      ),

    requiredWeekly:
      calculateRequiredWeekly(
        targetAmount,
        savedAmount,
        deadline
      ),

    requiredDaily:
      calculateRequiredDaily(
        targetAmount,
        savedAmount,
        deadline
      ),

    progress:
      calculateProgress(
        targetAmount,
        savedAmount
      ),

    status:
      calculateStatus(
        targetAmount,
        savedAmount,
        deadline
      ),
  };
}

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
      new Date()
        .toISOString()
        .split('T')[0]
    );

  /*
   * ============================================================
   * GET CURRENT USER
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

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

  /*
   * ============================================================
   * LOAD ONLY CURRENT USER'S GOALS
   * ============================================================
   */

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
       * IMPORTANT:
       * Every account has its own storage key.
       *
       * Example:
       * smartspend_goals_google-user-1
       * smartspend_goals_google-user-2
       */

      const key =
        `smartspend_goals_${currentUserId}`;

      const stored =
        localStorage.getItem(key);

      /*
       * No data = EMPTY.
       *
       * We NEVER use mockGoals here.
       * We NEVER use old global storage keys.
       */

      if (!stored) {
        setGoals([]);
        return;
      }

      const parsed =
        JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setGoals([]);
        return;
      }

      const normalized =
        parsed.map(normalizeGoal);

      setGoals(normalized);
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

  /*
   * ============================================================
   * SAVE CURRENT USER'S GOALS
   * ============================================================
   */

  useEffect(() => {
    if (
      loadingGoals ||
      !userId
    ) {
      return;
    }

    try {
      const key =
        `smartspend_goals_${userId}`;

      localStorage.setItem(
        key,
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

  /*
   * ============================================================
   * CREATE GOAL
   * ============================================================
   */

  function handleCreateGoal() {
    if (!userId) return;

    const name =
      goalName.trim();

    const target =
      Number(targetAmount);

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

    const initialSaved =
      Math.max(
        0,
        Number(savedAmount) || 0
      );

    const goal: Goal =
      normalizeGoal({
        id:
          `${Date.now()}-${Math.random()}`,

        name,

        targetAmount:
          target,

        savedAmount:
          initialSaved,

        deadline:
          targetDate,
      });

    setGoals((previous) => [
      goal,
      ...previous,
    ]);

    setGoalName('');
    setTargetAmount('');
    setSavedAmount('');
    setTargetDate('');
    setShowCreate(false);
  }

  /*
   * ============================================================
   * DELETE GOAL
   * ============================================================
   */

  function handleDeleteGoal(
    id: string
  ) {
    const confirmed =
      window.confirm(
        'Delete this goal?'
      );

    if (!confirmed) return;

    setGoals((previous) =>
      previous.filter(
        (goal) =>
          goal.id !== id
      )
    );

    if (
      savingGoal?.id === id
    ) {
      setSavingGoal(null);
      setSavingAmount('');
    }
  }

  /*
   * ============================================================
   * ADD SAVINGS TO GOAL
   * ============================================================
   */

  function handleAddSaving() {
    if (!savingGoal) return;

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

    setGoals((previous) =>
      previous.map((goal) => {
        if (
          goal.id !==
          savingGoal.id
        ) {
          return goal;
        }

        return normalizeGoal({
          ...goal,

          savedAmount:
            goal.savedAmount +
            amount,
        });
      })
    );

    setSavingAmount('');
    setSavingGoal(null);
  }

  /*
   * ============================================================
   * ACTIVE / COMPLETED
   * ============================================================
   */

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

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

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

  /*
   * ============================================================
   * UI
   * ============================================================
   */

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
              Track and evaluate your savings targets
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

      {/* CREATE FORM */}
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
                onClick={() =>
                  setShowCreate(false)
                }
                className="p-2 text-gray-500 hover:text-white"
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
                onClick={() =>
                  setShowCreate(false)
                }
                className="px-4 py-2.5 rounded-lg border border-white/[0.06] text-gray-400 hover:text-white"
              >
                Cancel
              </button>

              <button
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

      {/* ADD SAVING MODAL */}
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
                onClick={() =>
                  setSavingGoal(null)
                }
                className="p-2 text-gray-500 hover:text-white"
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
                onClick={() =>
                  setSavingGoal(null)
                }
                className="px-4 py-2.5 rounded-lg border border-white/[0.06] text-gray-400 hover:text-white"
              >
                Cancel
              </button>

              <button
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

    </div>
  );
}

/*
 * ============================================================
 * GOAL CARD
 * ============================================================
 */

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
      : 'Needs attention';

  const statusClass =
    goal.status === 'completed'
      ? 'text-emerald-400 bg-emerald-400/10'
      : goal.status === 'on-track'
      ? 'text-blue-400 bg-blue-400/10'
      : 'text-amber-400 bg-amber-400/10';

  return (
    <div className="glass-card p-5">

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
              {new Date(
                goal.deadline
              ).toLocaleDateString(
                'en-IN'
              )}
            </p>

          </div>

        </div>

        <button
          onClick={onDelete}
          className="p-2 text-gray-600 hover:text-red-400 transition-colors"
          title="Delete goal"
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

      {/* ADD SAVING */}
      {goal.status !== 'completed' && (
        <button
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