import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import { Reveal } from '@/lib/animations';
import { supabase } from '@/lib/supabase';

type SettingsData = {
  notifications: boolean;
  darkMode: boolean;
};

const SETTINGS_KEY_PREFIX = 'finpilot_settings';
const THEME_KEY_PREFIX = 'finpilot_theme';

function getSettingsKey(userId: string) {
  return `${SETTINGS_KEY_PREFIX}_${userId}`;
}

function getThemeKey(userId: string) {
  return `${THEME_KEY_PREFIX}_${userId}`;
}

function applyTheme(darkMode: boolean) {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [settingsKey, setSettingsKey] = useState<string | null>(null);
  const [themeKey, setThemeKey] = useState<string | null>(null);

  /* ============================================================
     LOAD USER SETTINGS
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error(
            'Failed to load authenticated user:',
            error
          );
        }

        if (!user) {
          if (!cancelled) {
            setNotifications(true);
            setDarkMode(true);
            setSettingsKey(null);
            setThemeKey(null);
            applyTheme(true);
            setLoaded(true);
          }

          return;
        }

        const userSettingsKey =
          getSettingsKey(user.id);

        const userThemeKey =
          getThemeKey(user.id);

        let nextNotifications = true;
        let nextDarkMode = true;

        const savedSettings =
          localStorage.getItem(
            userSettingsKey
          );

        if (savedSettings) {
          try {
            const parsed: Partial<SettingsData> =
              JSON.parse(savedSettings);

            if (
              typeof parsed.notifications ===
              'boolean'
            ) {
              nextNotifications =
                parsed.notifications;
            }

            if (
              typeof parsed.darkMode ===
              'boolean'
            ) {
              nextDarkMode =
                parsed.darkMode;
            }
          } catch (error) {
            console.error(
              'Failed to parse saved settings:',
              error
            );
          }
        }

        /*
          Theme has its own key so the instant toggle
          remains independent of the Save button.
        */
        const savedTheme =
          localStorage.getItem(
            userThemeKey
          );

        if (
          savedTheme === 'light'
        ) {
          nextDarkMode = false;
        } else if (
          savedTheme === 'dark'
        ) {
          nextDarkMode = true;
        }

        if (cancelled) return;

        setNotifications(
          nextNotifications
        );

        setDarkMode(nextDarkMode);
        setSettingsKey(userSettingsKey);
        setThemeKey(userThemeKey);

        applyTheme(nextDarkMode);
        setLoaded(true);
      } catch (error) {
        console.error(
          'Failed to load settings:',
          error
        );

        if (!cancelled) {
          setNotifications(true);
          setDarkMode(true);
          setSettingsKey(null);
          setThemeKey(null);
          applyTheme(true);
          setLoaded(true);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     THEME
  ============================================================ */

  function toggleTheme() {
    const newDarkMode = !darkMode;

    setDarkMode(newDarkMode);
    applyTheme(newDarkMode);

    if (themeKey) {
      localStorage.setItem(
        themeKey,
        newDarkMode
          ? 'dark'
          : 'light'
      );
    }

    setSaved(false);
  }

  /* ============================================================
     SAVE SETTINGS
  ============================================================ */

  function handleSave() {
    if (!settingsKey || !loaded) {
      return;
    }

    const settings: SettingsData = {
      notifications,
      darkMode,
    };

    localStorage.setItem(
      settingsKey,
      JSON.stringify(settings)
    );

    if (themeKey) {
      localStorage.setItem(
        themeKey,
        darkMode ? 'dark' : 'light'
      );
    }

    applyTheme(darkMode);

    setSaved(true);

    window.setTimeout(() => {
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

              <button
                type="button"
                onClick={toggleTheme}
                disabled={!loaded}
                aria-label="Toggle theme"
                aria-pressed={darkMode}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  darkMode
                    ? 'bg-emerald-400'
                    : 'bg-gray-300'
                } disabled:opacity-50`}
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
                type="button"
                onClick={() =>
                  setNotifications(
                    (value) => !value
                  )
                }
                disabled={!loaded}
                aria-label="Toggle notifications"
                aria-pressed={notifications}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  notifications
                    ? 'bg-emerald-400'
                    : 'bg-white/10'
                } disabled:opacity-50`}
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
              type="button"
              onClick={handleSave}
              disabled={!loaded || !settingsKey}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default SettingsPage;
