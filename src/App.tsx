import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ComponentType } from 'react';

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
const TransactionsPageComponent = TransactionsPage as unknown as ComponentType;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            LANDING PAGE
        ===================================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />
        <Route
  path="/login"
  element={<LoginPage />}
/>

        {/* =====================================================
            MAIN APP
        ===================================================== */}

        <Route element={<AppLayout />}>

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          {/* What-If Simulator */}
          <Route
            path="/what-if"
            element={<WhatIfPage />}
          />

          {/* Transactions */}
          <Route
            path="/transactions"
            element={<TransactionsPageComponent />}
          />

          {/* Insights */}
          <Route
            path="/insights"
            element={<InsightsPage />}
          />

          {/* Budget */}
          <Route
            path="/budget"
            element={<BudgetPage />}
          />

          {/* Goals */}
          <Route
            path="/goals"
            element={<GoalsPage />}
          />

          {/* Weekly Report */}
          <Route
            path="/weekly-report"
            element={<WeeklyReportPage />}
          />

          {/* Should I Spend */}
          <Route
            path="/ask"
            element={<AskPage />}
          />

          {/* Loans */}
          <Route
            path="/loans"
            element={<LoansPage />}
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={<SettingsPage />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}
