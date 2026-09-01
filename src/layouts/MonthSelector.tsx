import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';

export type SelectedPeriod =
  | {
      type: 'month';
      year: number;
      month: number; // 0 = January, 11 = December
    }
  | {
      type: 'all';
    };

interface MonthSelectorProps {
  value?: SelectedPeriod;
  onChange?: (period: SelectedPeriod) => void;
}

function getInitialPeriod(): SelectedPeriod {
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
}

function savePeriod(period: SelectedPeriod) {
  localStorage.setItem(
    'finpilot_selected_period',
    JSON.stringify(period)
  );
}

function formatMonth(year: number, month: number) {
  return new Date(
    year,
    month,
    1
  ).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function MonthSelector({
  value,
  onChange,
}: MonthSelectorProps) {
  const [internalPeriod, setInternalPeriod] =
    useState<SelectedPeriod>(getInitialPeriod);

  const selectedPeriod = value ?? internalPeriod;

  useEffect(() => {
    savePeriod(selectedPeriod);
  }, [selectedPeriod]);

  const options = useMemo(() => {
    const now = new Date();

    const months: {
      label: string;
      value: SelectedPeriod;
    }[] = [];

    // Current month + previous 11 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      months.push({
        label: formatMonth(
          date.getFullYear(),
          date.getMonth()
        ),
        value: {
          type: 'month',
          year: date.getFullYear(),
          month: date.getMonth(),
        },
      });
    }

    return months;
  }, []);

  function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const selectedValue = event.target.value;

    let period: SelectedPeriod;

    if (selectedValue === 'all') {
      period = {
        type: 'all',
      };
    } else {
      const [year, month] =
        selectedValue.split('-').map(Number);

      period = {
        type: 'month',
        year,
        month,
      };
    }

    setInternalPeriod(period);
    savePeriod(period);
    onChange?.(period);
  }

  const selectValue =
    selectedPeriod.type === 'all'
      ? 'all'
      : `${selectedPeriod.year}-${selectedPeriod.month}`;

  return (
    <div className="relative">
      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />

      <select
        value={selectValue}
        onChange={handleChange}
        className="appearance-none pl-9 pr-9 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-gray-300 hover:bg-white/[0.05] focus:outline-none focus:border-emerald-400/40 cursor-pointer transition-all"
      >
        {options.map((option) => {
          if (option.value.type !== 'month') {
            return null;
          }

          return (
            <option
              key={`${option.value.year}-${option.value.month}`}
              value={`${option.value.year}-${option.value.month}`}
              className="bg-[#101010] text-white"
            >
              {option.label}
            </option>
          );
        })}

        <option
          value="all"
          className="bg-[#101010] text-white"
        >
          All Time — Continuous
        </option>
      </select>

      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
}

export default MonthSelector;