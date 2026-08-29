import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ComponentType } from 'react';
import { useState } from 'react';

import { SplashScreen } from '@/components/SplashScreen';
import { ThemeToggle } from '@/components/ThemeToggle';

import { LandingPage } from '@/pages/Landing';
import { AppLayout } from '@/layouts/AppLayout';

import { DashboardPage } from '@/pages/Dashboard';
import { TransactionsPage } from '@/pages/Transactions';
import { InsightsPage } from '@/pages/Insights';
import { BudgetPage } from '@/pages/Budget';
import { GoalsPage } from '@/pages/Goals';
import { WeeklyReportPage } from '@/pages/WeeklyReport';
import { AskPage } from '@/pages/AskPage';
import { LoansPage } from '@/pages/Loans';
import { ProfilePage } from '@/pages/Profile';
import { SettingsPage } from '@/pages/settings';
import { WhatIfPage } from '@/pages/WhatIf';
import { LoginPage } from '@/pages/Login';

// Keep the route usable until TransactionsPage's return type is corrected.
const TransactionsPageComponent =
  TransactionsPage as unknown as ComponentType;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  /*
   * ============================================================
   * SPLASH SCREEN
   * ============================================================
   */

  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  /*
   * ============================================================
   * MAIN APPLICATION
   * ============================================================
   */

  return (
    <BrowserRouter>
      {/* ========================================================
          GLOBAL THEME TOGGLE

          Dark mode is the default.
          User can switch to light mode from anywhere.
      ======================================================== */}

      <ThemeToggle />

      <Routes>

        {/* ======================================================
            LANDING PAGE
        ====================================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* ======================================================
            LOGIN
        ====================================================== */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* ======================================================
            MAIN APP LAYOUT
        ====================================================== */}

        <Route element={<AppLayout />}>

          {/* ====================================================
              DASHBOARD
          ==================================================== */}

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          {/* ====================================================
              WHAT-IF SIMULATOR
          ==================================================== */}

          <Route
            path="/what-if"
            element={<WhatIfPage />}
          />

          {/* ====================================================
              TRANSACTIONS
          ==================================================== */}

          <Route
            path="/transactions"
            element={<TransactionsPageComponent />}
          />

          {/* ====================================================
              INSIGHTS
          ==================================================== */}

          <Route
            path="/insights"
            element={<InsightsPage />}
          />

          {/* ====================================================
              BUDGET
          ==================================================== */}

          <Route
            path="/budget"
            element={<BudgetPage />}
          />

          {/* ====================================================
              GOALS
          ==================================================== */}

          <Route
            path="/goals"
            element={<GoalsPage />}
          />

          {/* ====================================================
              WEEKLY REPORT
          ==================================================== */}

          <Route
            path="/weekly-report"
            element={<WeeklyReportPage />}
          />

          {/* ====================================================
              SHOULD I SPEND?
          ==================================================== */}

          <Route
            path="/ask"
            element={<AskPage />}
          />

          {/* ====================================================
              LOANS
          ==================================================== */}

          <Route
            path="/loans"
            element={<LoansPage />}
          />

          {/* ====================================================
              PROFILE
          ==================================================== */}

          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          {/* ====================================================
              SETTINGS
          ==================================================== */}

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}