import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import { Reveal } from '@/lib/animations';

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem(
      'smartspend_settings'
    );

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);

        if (typeof parsed.notifications === 'boolean') {
          setNotifications(parsed.notifications);
        }

        if (typeof parsed.darkMode === 'boolean') {
          setDarkMode(parsed.darkMode);
        }
      } catch (error) {
        console.error(
          'Failed to load settings:',
          error
        );
      }
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem(
      'smartspend_theme'
    );

    if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  function toggleTheme() {
    const newDarkMode = !darkMode;

    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(
        'smartspend_theme',
        'dark'
      );
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(
        'smartspend_theme',
        'light'
      );
    }
  }

  function handleSave() {
    localStorage.setItem(
      'smartspend_settings',
      JSON.stringify({
        notifications,
        darkMode,
      })
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-white dark:text-white">
            Settings
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Manage your FinPilot preferences
          </p>
        </div>
      </Reveal>

      {/* General Settings */}
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

            {/* Theme */}
            <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center">

                  {darkMode ? (
                    <Moon className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-400" />
                  )}

                </div>

                <div>
                  <p className="text-sm text-white">
                    Appearance
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {darkMode
                      ? 'Dark mode'
                      : 'Light mode'}
                  </p>
                </div>

              </div>

              {/* Theme Switch */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  darkMode
                    ? 'bg-emerald-400'
                    : 'bg-gray-300'
                }`}
              >

                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                    darkMode
                      ? 'left-6'
                      : 'left-1'
                  }`}
                >
                  {darkMode ? (
                    <Moon className="w-3 h-3 text-gray-700" />
                  ) : (
                    <Sun className="w-3 h-3 text-amber-500" />
                  )}
                </span>

              </button>

            </div>

            {/* Notifications */}
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
                onClick={() =>
                  setNotifications(!notifications)
                }
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

            {/* Save */}
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