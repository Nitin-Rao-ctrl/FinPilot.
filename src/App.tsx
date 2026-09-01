import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import { SplashScreen } from '@/components/SplashScreen';

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

import { LoginPage } from '@/pages/Login';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* Landing */}
        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Main Application */}
        <Route element={<AppLayout />}>

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/transactions"
            element={<TransactionsPage />}
          />

          <Route
            path="/insights"
            element={<InsightsPage />}
          />

          <Route
            path="/budget"
            element={<BudgetPage />}
          />

          <Route
            path="/goals"
            element={<GoalsPage />}
          />

          <Route
            path="/weekly-report"
            element={<WeeklyReportPage />}
          />

          <Route
            path="/ask"
            element={<AskPage />}
          />

          <Route
            path="/loans"
            element={<LoansPage />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}