import {
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import {
  LayoutDashboard,
  ArrowLeftRight,
  Lightbulb,
  Wallet,
  Target,
  FileText,
  HelpCircle,
  HandCoins,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
  },
  {
    to: '/insights',
    label: 'Insights',
    icon: Lightbulb,
  },
  {
    to: '/budget',
    label: 'Budget',
    icon: Wallet,
  },
  {
    to: '/goals',
    label: 'Goals',
    icon: Target,
  },
  {
    to: '/weekly-report',
    label: 'Weekly Report',
    icon: FileText,
  },
  {
    to: '/ask',
    label: 'Should I Spend?',
    icon: HelpCircle,
  },
  {
    to: '/loans',
    label: 'Loans',
    icon: HandCoins,
  },
  
  {
    to: '/profile',
    label: 'Profile',
    icon: User,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function AppLayout() {
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /*
   * ============================================================
   * THEME
   * ============================================================
   *
   * Dark mode is ALWAYS the default.
   *
   * Light mode is enabled only when the user explicitly
   * switches to it.
   *
   * The preference is saved in localStorage.
   */

  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => {
      if (typeof window === 'undefined') {
        return 'dark';
      }

      // Theme is resolved after authentication in the
      // effect below. Default is always dark.
      return 'dark';
    }
  );

  /*
   * ============================================================
   * APPLY THEME
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadUserTheme() {
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

        if (!user || cancelled) {
          setTheme('dark');
          return;
        }

        const userThemeKey =
          `finpilot_theme_${user.id}`;

        const savedTheme =
          localStorage.getItem(
            userThemeKey
          );

        const nextTheme =
          savedTheme === 'light'
            ? 'light'
            : 'dark';

        setTheme(nextTheme);
      } catch (error) {
        console.error(
          'Failed to load user theme:',
          error
        );

        if (!cancelled) {
          setTheme('dark');
        }
      }
    }

    loadUserTheme();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  /*
   * ============================================================
   * TOGGLE THEME
   * ============================================================
   */

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme =
        currentTheme === 'dark'
          ? 'light'
          : 'dark';

      void supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          if (!user) return;

          localStorage.setItem(
            `finpilot_theme_${user.id}`,
            nextTheme
          );
        })
        .catch((error) => {
          console.error(
            'Failed to save theme:',
            error
          );
        });

      return nextTheme;
    });
  };

  /*
   * ============================================================
   * CLOSE MOBILE MENU WHEN ROUTE CHANGES
   * ============================================================
   */

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  const handleLogout = async () => {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          'Logout failed:',
          error
        );
        return;
      }

      // Reset the document theme so the next user
      // starts from the correct default until their
      // own preference is loaded.
      document.documentElement.classList.add(
        'dark'
      );

      window.location.replace('/');
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );
    }
  };

  /*
   * ============================================================
   * COMMON THEME BUTTON
   * ============================================================
   */

  const ThemeButton = ({
    desktop = false,
  }: {
    desktop?: boolean;
  }) => (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === 'dark'
          ? 'Switch to light mode'
          : 'Switch to dark mode'
      }
      title={
        theme === 'dark'
          ? 'Switch to light mode'
          : 'Switch to dark mode'
      }
      className={`
        flex
        items-center
        justify-center
        shrink-0
        rounded-full
        border
        transition-all
        duration-200
        active:scale-95
        touch-manipulation

        ${
          desktop
            ? `
              w-11
              h-11
              shadow-lg
              ${
                theme === 'dark'
                  ? 'bg-[#0B100E] border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10'
                  : 'bg-white border-gray-300 text-emerald-600 hover:bg-emerald-50'
              }
            `
            : `
              w-10
              h-10
              ${
                theme === 'dark'
                  ? 'bg-[#0B100E] border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10'
                  : 'bg-gray-100 border-gray-300 text-emerald-600 hover:bg-gray-200'
              }
            `
        }
      `}
    >
      {theme === 'dark' ? (
        <Sun
          className="w-5 h-5"
          strokeWidth={2.2}
        />
      ) : (
        <Moon
          className="w-5 h-5"
          strokeWidth={2.2}
        />
      )}
    </button>
  );

  return (
    <div
      className={`
        min-h-screen
        flex
        transition-colors
        duration-300
        ${
          theme === 'dark'
            ? 'bg-[#050505] text-gray-200'
            : 'bg-gray-50 text-gray-900'
        }
      `}
    >

      {/* ======================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className={`
            absolute
            top-[10%]
            left-[5%]
            w-96
            h-96
            rounded-full
            blur-3xl
            ${
              theme === 'dark'
                ? 'bg-emerald-500 opacity-5'
                : 'bg-emerald-400 opacity-10'
            }
          `}
        />

        <div
          className={`
            absolute
            bottom-20
            right-10
            w-64
            h-64
            rounded-full
            blur-3xl
            ${
              theme === 'dark'
                ? 'bg-emerald-600 opacity-5'
                : 'bg-emerald-400 opacity-10'
            }
          `}
        />
      </div>

      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className={`
          hidden
          md:flex
          flex-col
          w-60
          shrink-0
          fixed
          left-0
          top-0
          h-screen
          z-40
          border-r
          backdrop-blur-xl
          transition-colors
          duration-300

          ${
            theme === 'dark'
              ? 'bg-[#080A09] border-white/[0.06]'
              : 'bg-gray-200 border-gray-300'
          }
        `}
      >

        {/* ====================================================
            LOGO
        ==================================================== */}

        <div
          className={`
            h-20
            px-5
            flex
            items-center
            border-b
            ${
              theme === 'dark'
                ? 'border-white/[0.06]'
                : 'border-gray-300'
            }
          `}
        >
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-emerald-400 flex items-center justify-center shrink-0">
              <Wallet
                className="w-5 h-5 text-[#050505]"
                strokeWidth={2.2}
              />
            </div>

            <span
              className={`
                text-lg
                font-bold
                tracking-tight
                ${
                  theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                }
              `}
            >
              FINPILOT
            </span>

          </div>
        </div>

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-xl
                  text-sm
                  font-medium
                  transition-all

                  ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : 'bg-emerald-100 text-emerald-700'
                      : theme === 'dark'
                        ? 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/70'
                  }
                `}
              >
                <Icon
                  className="w-4 h-4 shrink-0"
                  strokeWidth={2}
                />

                <span>
                  {item.label}
                </span>
              </NavLink>
            );
          })}

        </nav>

        {/* ====================================================
            SIDEBAR BOTTOM
        ==================================================== */}

        <div
          className={`
            p-4
            border-t
            ${
              theme === 'dark'
                ? 'border-white/[0.06]'
                : 'border-gray-300'
            }
          `}
        >

          {/* Theme label + button */}

          <div className="flex items-center justify-between mb-3 px-2">

            <span
              className={`
                text-xs
                font-medium
                ${
                  theme === 'dark'
                    ? 'text-gray-500'
                    : 'text-gray-600'
                }
              `}
            >
              Theme
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              className={`
                w-10
                h-10
                rounded-xl
                flex
                items-center
                justify-center
                border
                transition-all
                active:scale-95

                ${
                  theme === 'dark'
                    ? 'bg-[#0B100E] border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10'
                    : 'bg-gray-100 border-gray-300 text-emerald-600 hover:bg-gray-300'
                }
              `}
            >
              {theme === 'dark' ? (
                <Sun
                  className="w-5 h-5"
                  strokeWidth={2.2}
                />
              ) : (
                <Moon
                  className="w-5 h-5"
                  strokeWidth={2.2}
                />
              )}
            </button>

          </div>

          {/* Profile */}

          <NavLink
            to="/profile"
            className={({ isActive }) => `
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-xl
              text-sm
              transition-all
              ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'bg-emerald-100 text-emerald-700'
                  : theme === 'dark'
                    ? 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/70'
              }
            `}
          >
            <User className="w-4 h-4" />

            <span>
              Profile
            </span>
          </NavLink>

          {/* Settings */}

          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-xl
              text-sm
              transition-all
              ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'bg-emerald-100 text-emerald-700'
                  : theme === 'dark'
                    ? 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/70'
              }
            `}
          >
            <Settings className="w-4 h-4" />

            <span>
              Settings
            </span>
          </NavLink>

          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            className={`
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              mt-1
              rounded-xl
              text-sm
              transition-all
              ${
                theme === 'dark'
                  ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/5'
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
              }
            `}
          >
            <LogOut className="w-4 h-4" />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div
        className="
          flex-1
          min-w-0
          relative
          md:ml-60
        "
      >

        {/* ====================================================
            MOBILE HEADER
        ==================================================== */}

        <header
          className={`
            md:hidden
            h-16
            px-4
            flex
            items-center
            justify-between
            sticky
            top-0
            z-40
            border-b
            backdrop-blur-xl

            ${
              theme === 'dark'
                ? 'bg-[#050505]/95 border-white/[0.06]'
                : 'bg-white/95 border-gray-200'
            }
          `}
        >

          {/* Mobile Logo */}

          <div className="flex items-center gap-2 min-w-0">

            <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center shrink-0">
              <Wallet
                className="w-4 h-4 text-[#050505]"
                strokeWidth={2.2}
              />
            </div>

            <span
              className={`
                font-bold
                tracking-tight
                ${
                  theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                }
              `}
            >
              FINPILOT
            </span>

          </div>

          {/* ==================================================
              MOBILE ACTIONS

              IMPORTANT:
              Theme button and menu button are separate.
              Neither one is absolute/fixed.
              So they cannot overlap.
          ================================================== */}

          <div className="flex items-center gap-2 shrink-0">

            <ThemeButton />

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (current) => !current
                )
              }
              aria-label={
                mobileMenuOpen
                  ? 'Close navigation menu'
                  : 'Open navigation menu'
              }
              className={`
                w-10
                h-10
                rounded-xl
                flex
                items-center
                justify-center
                border
                transition-all
                active:scale-95

                ${
                  theme === 'dark'
                    ? 'bg-[#0B100E] border-white/[0.08] text-gray-300 hover:text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                }
              `}
            >
              {mobileMenuOpen ? (
                <X
                  className="w-5 h-5"
                  strokeWidth={2}
                />
              ) : (
                <Menu
                  className="w-5 h-5"
                  strokeWidth={2}
                />
              )}
            </button>

          </div>

        </header>

        {/* ======================================================
            MOBILE NAVIGATION
        ====================================================== */}

        {mobileMenuOpen && (
          <div
            className={`
              md:hidden
              fixed
              top-16
              left-0
              right-0
              z-50
              border-b
              shadow-2xl

              ${
                theme === 'dark'
                  ? 'bg-[#080A09] border-white/[0.06]'
                  : 'bg-white border-gray-200'
              }
            `}
          >

            <nav className="p-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">

              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-xl
                      text-sm
                      font-medium

                      ${
                        isActive
                          ? theme === 'dark'
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : 'bg-emerald-50 text-emerald-600'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0" />

                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}

              {/* Mobile Logout */}

              <button
                type="button"
                onClick={handleLogout}
                className={`
                  w-full
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-xl
                  text-sm
                  text-left
                  transition-all

                  ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/5'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }
                `}
              >
                <LogOut className="w-4 h-4" />

                <span>
                  Logout
                </span>
              </button>

            </nav>

          </div>
        )}

        {/* ======================================================
            DESKTOP THEME TOGGLE

            Only visible on desktop.
            It is in the top-right corner and does NOT overlap
            the sidebar/navigation.
        ====================================================== */}

        <div
          className="
            hidden
            md:flex
            fixed
            top-5
            right-5
            z-50
          "
        >
          <ThemeButton desktop />
        </div>

        {/* ======================================================
            PAGE CONTENT
        ====================================================== */}

        <main
          className="
            relative
            z-10
            p-4
            sm:p-6
            lg:p-8
          "
        >
          <Outlet />
        </main>

      </div>

    </div>
  );
}