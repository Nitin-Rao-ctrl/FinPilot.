import { useEffect } from 'react';
import { Wallet, ArrowUpRight } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#020504]">

      {/* Ambient glow */}
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[100px] animate-pulse" />

      {/* Animated rings */}
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/10 animate-[ping_2s_ease-out_infinite]" />

      <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/20 animate-[pulse_1.8s_ease-in-out_infinite]" />

      {/* Main content */}
      <div className="relative flex flex-col items-center">

        {/* Logo */}
        <div className="relative animate-[splashLogo_1.2s_ease-out_forwards]">

          {/* Glow */}
          <div className="absolute inset-0 rounded-[30px] bg-emerald-400/30 blur-2xl animate-pulse" />

          {/* Logo box */}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-[30px] border border-emerald-300/30 bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-[0_0_60px_rgba(16,185,129,0.35)]">

            <Wallet
              className="h-14 w-14 text-black"
              strokeWidth={2.2}
            />

            {/* Arrow */}
            <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 shadow-[0_0_25px_rgba(163,230,53,0.7)]">

              <ArrowUpRight
                className="h-5 w-5 text-black"
                strokeWidth={3}
              />

            </div>

          </div>
        </div>

        {/* Brand */}
        <div className="mt-8 text-center animate-[splashText_1s_0.5s_ease-out_both]">

          <h1 className="text-4xl font-black tracking-[0.18em] text-white">
            FINPILOT
          </h1>

          <div className="mx-auto mt-3 h-[2px] w-16 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          <p className="mt-4 text-[11px] font-semibold tracking-[0.28em] text-emerald-300/70">
            SMART FINANCE. BETTER FUTURE.
          </p>

        </div>

        {/* Loading dots */}
        <div className="mt-10 flex items-center gap-2 animate-[splashText_1s_0.9s_ease-out_both]">

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />

        </div>

      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 text-[9px] tracking-[0.35em] text-gray-600">
        YOUR MONEY. YOUR CONTROL.
      </div>

      <style>{`
        @keyframes splashLogo {
          0% {
            opacity: 0;
            transform: scale(0.65) translateY(20px);
          }

          60% {
            opacity: 1;
            transform: scale(1.08) translateY(0);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes splashText {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </div>
  );
}