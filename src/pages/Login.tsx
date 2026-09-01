import { useState } from 'react';
import {
  ArrowLeft,
  LockKeyhole,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ============================================================
     GOOGLE LOGIN
  ============================================================ */

  async function handleGoogleLogin() {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      /*
        Always use the current deployed origin.

        For Vercel:
          https://your-app.vercel.app/dashboard

        For localhost:
          http://localhost:5173/dashboard

        IMPORTANT:
        The same production URL must also be added to
        Supabase Authentication -> URL Configuration ->
        Redirect URLs.
      */
      const redirectTo =
        `${window.location.origin}/dashboard`;

      const {
        error: authError,
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (authError) {
        console.error(
          'Google login error:',
          authError
        );

        setError(
          authError.message ||
            'Unable to continue with Google.'
        );

        setLoading(false);
      }

      /*
        If OAuth starts successfully, Supabase redirects
        the browser to Google. Do not manually redirect here.
      */
    } catch (authError) {
      console.error(
        'Unexpected Google login error:',
        authError
      );

      setError(
        authError instanceof Error
          ? authError.message
          : 'Something went wrong while signing in with Google.'
      );

      setLoading(false);
    }
  }

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 grid-bg flex items-center justify-center px-4">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-emerald-500/[0.05] rounded-full blur-[120px]" />

        <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] bg-emerald-600/[0.04] rounded-full blur-[100px]" />

      </div>

      <div className="relative w-full max-w-md">

        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Login Card */}
        <div className="glass rounded-3xl p-6 md:p-8 neon-border">

          {/* Logo */}
          <div className="text-center mb-8">

            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center glow-emerald">
              <LockKeyhole
                className="w-6 h-6 text-[#050505]"
                strokeWidth={2.5}
              />
            </div>

            <h1 className="text-2xl font-bold text-white mt-4">
              Welcome to FINPILOT
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Sign in to manage your finances
            </p>

          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            aria-busy={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >

            <span
              aria-hidden="true"
              className="text-lg font-bold"
            >
              G
            </span>

            {loading
              ? 'Opening Google...'
              : 'Continue with Google'}

          </button>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-400/10 bg-red-400/[0.04] p-3"
            >
              <p className="text-xs text-red-300">
                {error}
              </p>

              <p className="text-[10px] text-gray-500 mt-2">
                If this is a redirect error, make sure
                your deployed FinPilot URL is added to
                Supabase Authentication URL Configuration.
              </p>
            </div>
          )}

          {/* Terms */}
          <p className="text-[10px] text-gray-600 text-center mt-6 leading-relaxed">
            By continuing, you agree to use FINPILOT
            responsibly for your personal financial
            management.
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
