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

  // ================================
  // GOOGLE LOGIN
  // ================================
  async function handleGoogleLogin() {
    setLoading(true);
    setError('');

    const { error: authError } =
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  // ================================
  // UI
  // ================================
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

          {/* ================================
              GOOGLE LOGIN
          ================================= */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span className="text-lg font-bold">
              G
            </span>

            {loading
              ? 'Please wait...'
              : 'Continue with Google'}
          </button>
          {/* ================================
              ERROR MESSAGE
          ================================= */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-400/10 bg-red-400/[0.04] p-3">

              <p className="text-xs text-red-300">
                {error}
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
