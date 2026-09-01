import { useEffect, useState } from 'react';
import { User, Check, Save } from 'lucide-react';
import { Reveal } from '@/lib/animations';
import { supabase } from '@/lib/supabase';

type ProfileData = {
  name: string;
  currency: string;
  monthlyIncome: number;
};

const PROFILE_KEY_PREFIX = 'finpilot_profile';

function getLocalDateProfileKey(userId: string) {
  return `${PROFILE_KEY_PREFIX}_${userId}`;
}

export function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profileKey, setProfileKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error('Failed to load user:', error);
        }

        if (!user) {
          if (!cancelled) {
            setName('');
            setEmail('');
            setCurrency('INR');
            setMonthlyIncome('');
            setProfileKey(null);
            setLoaded(true);
          }
          return;
        }

        const googleName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.user_name ||
          '';

        const key = getLocalDateProfileKey(user.id);
        const savedProfile =
          localStorage.getItem(key);

        let parsed: Partial<ProfileData> = {};

        if (savedProfile) {
          try {
            const value = JSON.parse(savedProfile);

            if (
              value &&
              typeof value === 'object'
            ) {
              parsed = value;
            }
          } catch (error) {
            console.error(
              'Failed to parse saved profile:',
              error
            );
          }
        }

        if (cancelled) return;

        setName(
          typeof parsed.name === 'string'
            ? parsed.name
            : googleName
        );

        setEmail(user.email || '');

        setCurrency(
          typeof parsed.currency === 'string' &&
            parsed.currency.length > 0
            ? parsed.currency
            : 'INR'
        );

        setMonthlyIncome(
          typeof parsed.monthlyIncome === 'number' &&
            Number.isFinite(parsed.monthlyIncome) &&
            parsed.monthlyIncome >= 0
            ? String(parsed.monthlyIncome)
            : ''
        );

        setProfileKey(key);
        setLoaded(true);
      } catch (error) {
        console.error(
          'Failed to load profile:',
          error
        );

        if (!cancelled) {
          setName('');
          setEmail('');
          setCurrency('INR');
          setMonthlyIncome('');
          setProfileKey(null);
          setLoaded(true);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSave() {
    if (!profileKey) {
      return;
    }

    const income = Number(monthlyIncome);

    if (
      monthlyIncome.trim() !== '' &&
      (!Number.isFinite(income) || income < 0)
    ) {
      return;
    }

    const profile: ProfileData = {
      name: name.trim(),
      currency,
      monthlyIncome:
        monthlyIncome.trim() === ''
          ? 0
          : income,
    };

    localStorage.setItem(
      profileKey,
      JSON.stringify(profile)
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Profile
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Manage your account and preferences
          </p>
        </div>
      </Reveal>

      {/* Profile Card */}
      <Reveal delay={50}>
        <div className="glass-card p-6">

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
              <User
                className="w-8 h-8 text-[#050505]"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                {name || 'User'}
              </h2>

              <p className="text-sm text-gray-500">
                {email || 'No email available'}
              </p>
            </div>

          </div>

        </div>
      </Reveal>

      {/* Personal Information */}
      <Reveal delay={100}>
        <div className="glass-card p-6">

          <p className="section-label mb-5">
            Personal Information
          </p>

          <div className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                placeholder="Enter your name"
                className="form-input"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
                Email
              </label>

              <input
                type="email"
                value={email}
                readOnly
                className="form-input opacity-70 cursor-not-allowed"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
                Currency
              </label>

              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  setSaved(false);
                }}
                className="form-input"
              >
                <option value="INR">
                  ₹ INR — Indian Rupee
                </option>

                <option value="USD">
                  $ USD — US Dollar
                </option>

                <option value="EUR">
                  € EUR — Euro
                </option>

                <option value="GBP">
                  £ GBP — British Pound
                </option>
              </select>
            </div>

            {/* Monthly Income */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
                Monthly Income
              </label>

              <input
                type="number"
                min="0"
                value={monthlyIncome}
                onChange={(e) => {
                  setMonthlyIncome(e.target.value);
                  setSaved(false);
                }}
                placeholder="10000"
                className="form-input"
              />
            </div>

            {/* Save */}
            <div className="pt-1">
              <button
                onClick={handleSave}
                disabled={!loaded || !profileKey}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all glow-emerald disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </Reveal>

      {/* Financial Summary */}
      <Reveal delay={150}>
        <div className="glass-card p-6">

          <p className="section-label mb-5">
            Financial Summary
          </p>

          <div className="grid grid-cols-1 gap-4">

            <div className="bg-white/[0.02] rounded-xl p-4">
              <p className="metric-label">
                Monthly Income
              </p>

              <p className="text-xl font-bold text-white mt-1">
                ₹
                {Number(
                  monthlyIncome || 0
                ).toLocaleString('en-IN')}
              </p>
            </div>

          </div>

        </div>
      </Reveal>

    </div>
  );
}

export default ProfilePage;
