import { useState } from 'react';
import { Settings as SettingsIcon, Check } from 'lucide-react';
import { Reveal } from '@/lib/animations';

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem(
      'smartspend_settings',
      JSON.stringify({
        notifications,
      })
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Settings
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Manage your SmartSpend preferences
          </p>
        </div>
      </Reveal>

      <Reveal delay={50}>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">
                General Settings
              </h2>

              <p className="text-xs text-gray-500">
                Configure your application preferences
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
              <div>
                <p className="text-sm text-white">
                  Notifications
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Receive spending and budget notifications
                </p>
              </div>

              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  notifications
                    ? 'bg-emerald-400'
                    : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    notifications
                      ? 'left-6'
                      : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
