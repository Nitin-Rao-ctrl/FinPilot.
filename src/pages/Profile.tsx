import { useState } from 'react';
import { User, Check, Save } from 'lucide-react';
import { Reveal } from '@/lib/animations';

export function ProfilePage() {
  const [name, setName] = useState('Nitin');
  const [currency, setCurrency] = useState('INR');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // Save profile data
    localStorage.setItem(
      'smartspend_profile',
      JSON.stringify({
        name,
        currency,
        monthlyIncome: Number(monthlyIncome) || 0,
        monthlyBudget: Number(monthlyBudget) || 0,
      })
    );

    setSaved(true);

    setTimeout(() => {
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
              <User className="w-8 h-8 text-[#050505]" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                {name || 'Nitin'}
              </h2>

              <p className="text-sm text-gray-500">
                nitin@example.com
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
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="EUR">€ EUR — Euro</option>
                <option value="GBP">£ GBP — British Pound</option>
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

            {/* Monthly Budget */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">
                Monthly Budget
              </label>

              <input
                type="number"
                min="0"
                value={monthlyBudget}
                onChange={(e) => {
                  setMonthlyBudget(e.target.value);
                  setSaved(false);
                }}
                placeholder="Enter monthly budget"
                className="form-input"
              />
            </div>

            {/* Save */}
            <div className="pt-1">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all glow-emerald"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/[0.02] rounded-xl p-4">
              <p className="metric-label">
                Monthly Income
              </p>

              <p className="text-xl font-bold text-white mt-1">
                ₹{Number(monthlyIncome || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-4">
              <p className="metric-label">
                Monthly Budget
              </p>

              <p className="text-xl font-bold text-white mt-1">
                ₹{Number(monthlyBudget || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-4">
              <p className="metric-label">
                Available for Savings
              </p>

              <p
                className={`text-xl font-bold mt-1 ${
                  Number(monthlyIncome || 0) -
                    Number(monthlyBudget || 0) >=
                  0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                ₹
                {Math.max(
                  0,
                  Number(monthlyIncome || 0) -
                    Number(monthlyBudget || 0)
                ).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
} 
