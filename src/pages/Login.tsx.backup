import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  Phone,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ================================
  // GOOGLE LOGIN
  // ================================
  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    setMessage('');

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
  // NORMALIZE PHONE NUMBER
  // ================================
  function normalizePhone(value: string) {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }

    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    return value.startsWith('+')
      ? value
      : `+${cleaned}`;
  }

  // ================================
  // SEND OTP
  // ================================
  async function handleSendOtp(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError('');
    setMessage('');

    const normalizedPhone =
      normalizePhone(phone);

    if (!/^\+91\d{10}$/.test(normalizedPhone)) {
      setError(
        'Please enter a valid 10-digit Indian mobile number.'
      );
      return;
    }

    setLoading(true);

    const { error: otpError } =
      await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setPhone(normalizedPhone);
    setOtpSent(true);

    setMessage(
      'OTP sent successfully. Check your phone.'
    );
  }

  // ================================
  // VERIFY OTP
  // ================================
  async function handleVerifyOtp(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(otp)) {
      setError(
        'Please enter the 6-digit OTP.'
      );
      return;
    }

    setLoading(true);

    const {
      data,
      error: verifyError,
    } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    if (!data.session) {
      setError(
        'Login could not be completed. Please try again.'
      );
      return;
    }

    navigate('/dashboard');
  }

  // ================================
  // BACK FROM OTP
  // ================================
  function handleBack() {
    setOtp('');
    setOtpSent(false);
    setError('');
    setMessage('');
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">

            <div className="flex-1 h-px bg-white/[0.07]" />

            <span className="text-xs text-gray-600">
              OR
            </span>

            <div className="flex-1 h-px bg-white/[0.07]" />

          </div>

          {/* ================================
              PHONE LOGIN
          ================================= */}
          {!otpSent ? (

            <form
              onSubmit={handleSendOtp}
              className="space-y-4"
            >

              <div>

                <label className="metric-label block mb-2">
                  MOBILE NUMBER
                </label>

                <div className="relative">

                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 10)
                      )
                    }
                    placeholder="9876543210"
                    maxLength={10}
                    className="form-input pl-11"
                  />

                </div>

                <p className="text-[10px] text-gray-600 mt-2">
                  India (+91) mobile numbers are supported.
                </p>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-emerald-400 text-[#050505] font-semibold text-sm hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-emerald"
              >
                {loading
                  ? 'Sending OTP...'
                  : 'Send OTP'}
              </button>

            </form>

          ) : (

            /* ================================
               OTP VERIFICATION
            ================================= */

            <form
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >

              <div>

                <label className="metric-label block mb-2">
                  ENTER OTP
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                    )
                  }
                  placeholder="123456"
                  maxLength={6}
                  className="form-input text-center tracking-[0.45em] text-lg"
                />

                <p className="text-[10px] text-gray-600 mt-2 text-center">
                  OTP sent to {phone}
                </p>

              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  otp.length !== 6
                }
                className="w-full px-4 py-3 rounded-xl bg-emerald-400 text-[#050505] font-semibold text-sm hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-emerald"
              >
                {loading
                  ? 'Verifying...'
                  : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full text-sm text-gray-500 hover:text-white transition-colors"
              >
                Use a different number
              </button>

            </form>
          )}

          {/* ================================
              SUCCESS MESSAGE
          ================================= */}
          {message && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-3">

              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />

              <p className="text-xs text-emerald-300">
                {message}
              </p>

            </div>
          )}

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