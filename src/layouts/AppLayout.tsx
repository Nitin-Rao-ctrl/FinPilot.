import {
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useEffect, useState } from 'react';

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

/* ============================================================
   NAVIGATION
============================================================ */

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
    to: '/what-if',
    label: 'What-If Simulator',
    icon: Lightbulb,
  },
];

/* ============================================================
   THEME BUTTON

   Important:
   - NOT fixed
   - NOT absolute
   - Normal flex child
   - Safe on mobile
============================================================ */

function ThemeButton() {
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return localStorage.getItem('finpilot_theme') === 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    if (isLight) {
      root.classList.remove('dark');
      localStorage.setItem('finpilot_theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('finpilot_theme', 'dark');
    }
  }, [isLight]);

  function toggleTheme() {
    setIsLight((current) => !current);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isLight
          ? 'Switch to dark mode'
          : 'Switch to light mode'
      }
      title={
        isLight
          ? 'Dark mode'
          : 'Light mode'
      }
      className="
        flex
        items-center
        justify-center
        w-9
        h-9
        sm:w-10
        sm:h-10
        shrink-0
        rounded-xl
        border
        border-emerald-400/20
        bg-emerald-400/[0.06]
        text-emerald-400
        hover:bg-emerald-400/[0.12]
        hover:border-emerald-400/30
        active:scale-95
        transition-all
        touch-manipulation
      "
    >
      {isLight ? (
        <Moon
          className="w-[18px] h-[18px]"
          strokeWidth={2.2}
        />
      ) : (
        <Sun
          className="w-[18px] h-[18px]"
          strokeWidth={2.2}
        />
      )}
    </button>
  );
}

/* ============================================================
   APP LAYOUT
============================================================ */

export function AppLayout() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const location = useLocation();

  /* ==========================================================
     LOGOUT
  ========================================================== */

  function handleLogout() {
    window.location.href = '/';
  }

  /* ==========================================================
     CLOSE MOBILE MENU
  ========================================================== */

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  /* ==========================================================
     CLOSE MENU WHEN ROUTE CHANGES
  ========================================================== */

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div
      className="
        min-h-screen
        flex
        bg-[#050505]
        text-gray-200
        grid-bg
      "
    >

      {/* ======================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div
        className="
          fixed
          inset-0
          pointer-events-none
          z-0
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            top-[10%]
            left-[5%]
            w-[400px]
            h-[400px]
            rounded-full
            bg-emerald-500
            opacity-[0.05]
            blur-[100px]
          "
        />

        <div
          className="
            absolute
            bottom-20
            right-10
            w-64
            h-64
            rounded-full
            bg-emerald-600
            opacity-[0.05]
            blur-3xl
          "
        />
      </div>

      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className="
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
          bg-[#080A09]/95
          backdrop-blur-xl
          border-r
          border-white/[0.04]
        "
      >

        {/* ====================================================
            DESKTOP LOGO
        ==================================================== */}

        <div
          className="
            p-5
            border-b
            border-white/[0.04]
          "
        >
          <div className="flex items-center gap-2.5">

            <div
              className="
                w-8
                h-8
                rounded-lg
                bg-gradient-to-br
                from-emerald-400
                to-emerald-600
                flex
                items-center
                justify-center
              "
            >
              <Wallet
                className="w-4 h-4 text-[#050505]"
                strokeWidth={2.5}
              />
            </div>

            <span
              className="
                text-white
                font-bold
                tracking-tight
                text-sm
              "
            >
              FINPILOT
            </span>

          </div>
        </div>

        {/* ====================================================
            DESKTOP NAVIGATION
        ==================================================== */}

        <nav
          className="
            flex-1
            overflow-y-auto
            p-3
            space-y-0.5
          "
        >
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to;

            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2.5
                  rounded-lg
                  text-sm
                  font-medium
                  transition-all
                  ${
                    isActive
                      ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/15'
                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* ====================================================
            DESKTOP BOTTOM AREA
        ==================================================== */}

        <div
          className="
            p-3
            border-t
            border-white/[0.04]
            space-y-1
          "
        >

          {/* THEME */}

          <div
            className="
              flex
              items-center
              justify-between
              px-2
              py-2
            "
          >
            <span className="text-xs text-gray-500">
              Theme
            </span>

            <ThemeButton />
          </div>

          {/* PROFILE */}

          <NavLink
            to="/profile"
            className={`
              flex
              items-center
              gap-3
              px-3
              py-2.5
              rounded-lg
              text-sm
              font-medium
              transition-all
              ${
                location.pathname === '/profile'
                  ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/15'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent'
              }
            `}
          >
            <User className="w-4 h-4" />
            Profile
          </NavLink>

          {/* SETTINGS */}

          <NavLink
            to="/settings"
            className={`
              flex
              items-center
              gap-3
              px-3
              py-2.5
              rounded-lg
              text-sm
              font-medium
              transition-all
              ${
                location.pathname === '/settings'
                  ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/15'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent'
              }
            `}
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              gap-3
              px-3
              py-2.5
              rounded-lg
              text-sm
              font-medium
              text-gray-500
              hover:text-red-400
              hover:bg-red-400/[0.05]
              transition-all
              border
              border-transparent
            "
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>

        </div>
      </aside>

      {/* ======================================================
          MOBILE HEADER
      ====================================================== */}

      <header
        className="
          md:hidden
          fixed
          top-0
          left-0
          right-0
          z-50
          bg-[#080A09]/95
          backdrop-blur-xl
          border-b
          border-white/[0.04]
        "
      >

        {/* ====================================================
            MOBILE TOP BAR

            Layout:
            FINPILOT       ☀️    ☰

            Theme and menu are separate flex children.
            Nothing is absolute.
        ==================================================== */}

        <div
          className="
            flex
            items-center
            w-full
            h-14
            px-3
          "
        >

          {/* LOGO */}

          <div
            className="
              flex
              items-center
              gap-2
              min-w-0
              flex-1
            "
          >
            <div
              className="
                w-8
                h-8
                shrink-0
                rounded-lg
                bg-gradient-to-br
                from-emerald-400
                to-emerald-600
                flex
                items-center
                justify-center
              "
            >
              <Wallet
                className="w-4 h-4 text-[#050505]"
                strokeWidth={2.5}
              />
            </div>

            <span
              className="
                text-white
                font-bold
                tracking-tight
                text-sm
                truncate
              "
            >
              FINPILOT
            </span>
          </div>

          {/* ==================================================
              MOBILE ACTIONS

              IMPORTANT:
              Theme and Menu are in their own flex container.
              They can NEVER overlap.
          ================================================== */}

          <div
            className="
              flex
              items-center
              gap-2
              shrink-0
              ml-2
            "
          >

            {/* THEME */}

            <ThemeButton />

            {/* MENU */}

            <button
              type="button"
              aria-label={
                mobileOpen
                  ? 'Close navigation menu'
                  : 'Open navigation menu'
              }
              aria-expanded={mobileOpen}
              onClick={() =>
                setMobileOpen((prev) => !prev)
              }
              className="
                flex
                items-center
                justify-center
                w-9
                h-9
                sm:w-10
                sm:h-10
                shrink-0
                rounded-xl
                border
                border-white/[0.06]
                text-gray-400
                hover:text-white
                hover:bg-white/[0.06]
                active:bg-white/[0.1]
                active:scale-95
                transition-all
                touch-manipulation
              "
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

          </div>

        </div>

        {/* ====================================================
            MOBILE MENU
        ==================================================== */}

        {mobileOpen && (
          <nav
            className="
              p-3
              border-t
              border-white/[0.04]
              space-y-0.5
              bg-[#080A09]/95
              backdrop-blur-xl
              max-h-[calc(100vh-56px)]
              overflow-y-auto
            "
          >

            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `
                      flex
                      items-center
                      gap-3
                      px-3
                      py-3
                      rounded-lg
                      text-sm
                      font-medium
                      transition-all
                      ${
                        isActive
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                      }
                    `
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}

            {/* PROFILE */}

            <NavLink
              to="/profile"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `
                  flex
                  items-center
                  gap-3
                  px-3
                  py-3
                  rounded-lg
                  text-sm
                  font-medium
                  transition-all
                  ${
                    isActive
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                  }
                `
              }
            >
              <User className="w-4 h-4" />
              Profile
            </NavLink>

            {/* SETTINGS */}

            <NavLink
              to="/settings"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `
                  flex
                  items-center
                  gap-3
                  px-3
                  py-3
                  rounded-lg
                  text-sm
                  font-medium
                  transition-all
                  ${
                    isActive
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                  }
                `
              }
            >
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                handleLogout();
              }}
              className="
                w-full
                flex
                items-center
                gap-3
                px-3
                py-3
                rounded-lg
                text-sm
                font-medium
                text-gray-500
                hover:text-red-400
                hover:bg-red-400/[0.05]
                transition-all
              "
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

          </nav>
        )}

      </header>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main
        className="
          flex-1
          md:ml-60
          pt-14
          md:pt-0
          relative
          z-10
          min-w-0
        "
      >
        <div
          className="
            max-w-6xl
            mx-auto
            p-4
            md:p-8
          "
        >
          <Outlet />
        </div>
      </main>

    </div>
  );
}