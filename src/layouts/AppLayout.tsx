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
   IMPORTANT:
   This button is NOT fixed or absolute.
   It stays inside the header and can never cover the menu.
============================================================ */

function ThemeButton() {
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === 'undefined') return false;

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

  const toggleTheme = () => {
    setIsLight((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Dark mode' : 'Light mode'}
      className="
        flex
        items-center
        justify-center
        w-10
        h-10
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
        shrink-0
      "
    >
      {isLight ? (
        <Moon
          className="w-5 h-5"
          strokeWidth={2.2}
        />
      ) : (
        <Sun
          className="w-5 h-5"
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();

  /* ============================================================
     LOGOUT
  ============================================================ */

  const handleLogout = () => {
    window.location.href = '/';
  };

  /* ============================================================
     CLOSE MOBILE MENU
  ============================================================ */

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 grid-bg flex">

      {/* ======================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-emerald-500/[0.05] rounded-full blur-[100px]" />

        <div className="absolute bottom-[20%] right-[5%] w-[300px] h-[300px] bg-emerald-600/[0.03] rounded-full blur-[80px]" />
      </div>

      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="
        hidden
        md:flex
        flex-col
        w-60
        bg-[#080A09]/80
        backdrop-blur-xl
        border-r
        border-white/[0.04]
        fixed
        h-screen
        z-40
      ">

        {/* ====================================================
            DESKTOP LOGO
        ==================================================== */}

        <div className="p-5 border-b border-white/[0.04]">

          <div className="flex items-center gap-2.5">

            <div className="
              w-8
              h-8
              rounded-lg
              bg-gradient-to-br
              from-emerald-400
              to-emerald-600
              flex
              items-center
              justify-center
              glow-emerald
            ">
              <Wallet
                className="w-4 h-4 text-[#050505]"
                strokeWidth={2.5}
              />
            </div>

            <span className="text-white font-bold tracking-tight text-sm">
              FINPILOT
            </span>

          </div>

        </div>

        {/* ====================================================
            MAIN NAVIGATION
        ==================================================== */}

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">

          {navItems.map((item) => {

            const isActive =
              location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/15'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >

                <item.icon className="w-4 h-4" />

                {item.label}

              </NavLink>
            );
          })}

        </nav>

        {/* ====================================================
            DESKTOP BOTTOM NAVIGATION
        ==================================================== */}

        <div className="p-3 border-t border-white/[0.04] space-y-0.5">

          {/* DESKTOP THEME */}

          <div className="flex items-center justify-between px-2 py-2 mb-1">

            <span className="text-xs text-gray-500">
              Theme
            </span>

            <ThemeButton />

          </div>

          {/* PROFILE */}

          <NavLink
            to="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/profile'
                ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/15'
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent'
            }`}
          >

            <User className="w-4 h-4" />

            Profile

          </NavLink>

          {/* SETTINGS */}

          <NavLink
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/settings'
                ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/15'
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent'
            }`}
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
              border
              border-transparent
              transition-all
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

      <header className="
        md:hidden
        fixed
        top-0
        left-0
        right-0
        bg-[#080A09]/95
        backdrop-blur-xl
        border-b
        border-white/[0.04]
        z-50
      ">

        {/* ==================================================
            MOBILE HEADER BAR

            IMPORTANT:
            Theme + Menu are normal flex children.
            Nothing is fixed/absolute here.
        ================================================== */}

        <div className="
          flex
          items-center
          justify-between
          px-3
          h-14
          w-full
        ">

          {/* ==================================================
              MOBILE LOGO
          ================================================== */}

          <div className="
            flex
            items-center
            gap-2
            min-w-0
            flex-1
          ">

            <div className="
              w-8
              h-8
              rounded-lg
              bg-gradient-to-br
              from-emerald-400
              to-emerald-600
              flex
              items-center
              justify-center
              shrink-0
            ">

              <Wallet
                className="w-4 h-4 text-[#050505]"
                strokeWidth={2.5}
              />

            </div>

            <span className="
              text-white
              font-bold
              tracking-tight
              text-sm
              truncate
            ">
              FINPILOT
            </span>

          </div>

          {/* ==================================================
              MOBILE ACTIONS

              Theme and Menu have separate 40x40 areas.
              They can NEVER overlap.
          ================================================== */}

          <div className="
            flex
            items-center
            gap-2
            shrink-0
            ml-3
          ">

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
                w-10
                h-10
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
                shrink-0
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

        {/* ==================================================
            MOBILE MENU
        ================================================== */}

        {mobileOpen && (

          <nav className="
            p-3
            border-t
            border-white/[0.04]
            space-y-0.5
            bg-[#080A09]/95
            backdrop-blur-xl
            max-h-[calc(100vh-56px)]
            overflow-y-auto
          ">

            {/* MAIN NAV */}

            {navItems.map((item) => (

              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                  }`
                }
              >

                <item.icon className="w-4 h-4" />

                {item.label}

              </NavLink>

            ))}

            {/* MOBILE PROFILE */}

            <NavLink
              to="/profile"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                }`
              }
            >

              <User className="w-4 h-4" />

              Profile

            </NavLink>

            {/* MOBILE SETTINGS */}

            <NavLink
              to="/settings"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                }`
              }
            >

              <Settings className="w-4 h-4" />

              Settings

            </NavLink>

            {/* MOBILE LOGOUT */}

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

      <main className="
        flex-1
        md:ml-60
        pt-14
        md:pt-0
        relative
        z-10
      ">

        <div className="
          max-w-6xl
          mx-auto
          p-4
          md:p-8
        ">

          <Outlet />

        </div>

      </main>

    </div>
  );
}