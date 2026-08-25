import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Wallet,
  Target,
  BarChart3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Brain,
  CheckCircle2,
} from 'lucide-react';
import { Reveal } from '@/lib/animations';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 grid-bg">

      {/* ============================================================
          BACKGROUND
      ============================================================ */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-emerald-500/[0.06] rounded-full blur-[120px]" />

        <div className="absolute top-[40%] right-[5%] w-[400px] h-[400px] bg-emerald-600/[0.04] rounded-full blur-[100px]" />

        <div className="absolute bottom-[5%] left-[30%] w-[350px] h-[350px] bg-emerald-400/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* ============================================================
          NAVBAR
      ============================================================ */}

      <header className="relative z-10 border-b border-white/[0.05] bg-[#050505]/80 backdrop-blur-xl">

        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">

          {/* LOGO */}

          <div className="flex items-center gap-2.5">

            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center glow-emerald">

              <Wallet
                className="w-5 h-5 text-[#050505]"
                strokeWidth={2.5}
              />

            </div>

            <span className="text-white font-bold text-lg tracking-tight">
              FINPILOT
            </span>

          </div>

          {/* NAV */}

          <nav className="hidden md:flex items-center gap-7">

            <a
              href="#features"
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              How It Works
            </a>

            <a
              href="#goals"
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Goals
            </a>

          </nav>

          {/* BUTTONS */}

          <div className="flex items-center gap-3">

            <Link
  to="/login"
  className="hidden sm:inline-flex text-sm text-gray-400 hover:text-white transition-colors"
>
  Login
</Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 text-[#050505] text-sm font-semibold hover:bg-emerald-300 transition-all glow-emerald"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>

          </div>

        </div>

      </header>

      {/* ============================================================
          HERO
      ============================================================ */}

      <main className="relative z-10">

        <section className="max-w-7xl mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-20">

          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* LEFT */}

            <Reveal>

              <div className="space-y-6">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/[0.06] border border-emerald-400/20">

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />

                  <span className="text-[11px] uppercase tracking-[0.15em] text-emerald-400 font-semibold">
                    AI-Powered Financial Intelligence
                  </span>

                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.02] tracking-tight">

                  Your money.

                  <br />

                  <span className="neon-text">
                    Understood.
                  </span>

                </h1>

                <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                  FINPILOT transforms your everyday financial activity into
                  clear insights, smarter recommendations, better budgeting,
                  and goal-focused decisions.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">

                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-400 text-[#050505] font-semibold text-sm hover:bg-emerald-300 transition-all glow-emerald"
                  >
                    Start Managing Money
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/ask"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass text-gray-300 font-semibold text-sm hover:text-white transition-all"
                  >
                    Should I Spend?
                  </Link>

                </div>

              </div>

            </Reveal>

            {/* RIGHT PREVIEW */}

            <Reveal delay={100}>

              <div className="relative">

                <div className="absolute inset-0 bg-emerald-500/[0.08] blur-[70px] rounded-full" />

                <div className="relative glass rounded-3xl p-6 neon-border">

                  <div className="flex items-center justify-between mb-5">

                    <div>
                      <p className="metric-label">
                        FINANCIAL OVERVIEW
                      </p>

                      <p className="text-xs text-gray-600 mt-1">
                        Your command center
                      </p>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />

                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <PreviewCard
                      title="Budget"
                      value="Monthly"
                      icon={<Wallet className="w-4 h-4" />}
                    />

                    <PreviewCard
                      title="Goals"
                      value="On Track"
                      icon={<Target className="w-4 h-4" />}
                    />

                    <PreviewCard
                      title="Insights"
                      value="Smart"
                      icon={<BarChart3 className="w-4 h-4" />}
                    />

                    <PreviewCard
                      title="Decisions"
                      value="AI Guided"
                      icon={<Brain className="w-4 h-4" />}
                    />

                  </div>

                  <div className="mt-4 glass-card p-5">

                    <div className="flex items-center gap-2 mb-4">

                      <Sparkles className="w-4 h-4 text-emerald-400" />

                      <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                        FINPILOT INTELLIGENCE
                      </span>

                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed">
                      Understand where your money is going, what needs
                      attention, and which decision makes the most sense next.
                    </p>

                  </div>

                  <div className="mt-4 flex items-center gap-3 glass-card p-4">

                    <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Financial awareness
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Track → Understand → Improve
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </Reveal>

          </div>

        </section>

        {/* ============================================================
            FEATURES
        ============================================================ */}

        <section
          id="features"
          className="py-20 px-5 md:px-8 border-y border-white/[0.04]"
        >

          <div className="max-w-7xl mx-auto">

            <Reveal className="text-center mb-14">

              <p className="section-label mb-3">
                CORE FEATURES
              </p>

              <h2 className="text-3xl md:text-5xl font-bold text-white">
                More than an expense tracker.
              </h2>

              <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
                FINPILOT connects your spending, budget, goals and financial
                decisions into one simple system.
              </p>

            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

              <FeatureCard
                icon={<Wallet className="w-5 h-5" />}
                title="Smart Budget"
                description="Set your monthly limit and monitor spending in real time."
              />

              <FeatureCard
                icon={<BarChart3 className="w-5 h-5" />}
                title="Insights"
                description="Understand your spending patterns and important categories."
              />

              <FeatureCard
                icon={<Target className="w-5 h-5" />}
                title="Goal Tracking"
                description="Track savings targets and understand whether you're on track."
              />

              <FeatureCard
                icon={<Brain className="w-5 h-5" />}
                title="Smart Decisions"
                description="Evaluate planned purchases before spending your money."
              />

            </div>

          </div>

        </section>

        {/* ============================================================
            HOW IT WORKS
        ============================================================ */}

        <section
          id="how-it-works"
          className="py-20 px-5 md:px-8"
        >

          <div className="max-w-6xl mx-auto">

            <Reveal className="text-center mb-14">

              <p className="section-label mb-3">
                HOW IT WORKS
              </p>

              <h2 className="text-3xl md:text-5xl font-bold text-white">
                Three simple steps.
              </h2>

            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">

              <StepCard
                number="01"
                title="Track"
                description="Add your income and expenses so FINPILOT understands your financial activity."
              />

              <StepCard
                number="02"
                title="Understand"
                description="See your budget, spending patterns, goals and financial health."
              />

              <StepCard
                number="03"
                title="Decide"
                description="Use insights and recommendations to make better financial decisions."
              />

            </div>

          </div>

        </section>

        {/* ============================================================
            GOALS
        ============================================================ */}

        <section
          id="goals"
          className="py-20 px-5 md:px-8 bg-white/[0.01]"
        >

          <div className="max-w-6xl mx-auto">

            <Reveal className="text-center mb-14">

              <p className="section-label mb-3">
                FINANCIAL GOALS
              </p>

              <h2 className="text-3xl md:text-5xl font-bold text-white">
                Spend today.
                <br />
                Still reach tomorrow.
              </h2>

              <p className="text-gray-500 mt-4 max-w-xl mx-auto">
                FINPILOT helps you understand how today's spending can affect
                the goals you're working toward.
              </p>

            </Reveal>

            <div className="grid md:grid-cols-3 gap-4">

              <GoalPreview
                name="Savings Goal"
                progress={72}
                description="Track how close you are to your target."
              />

              <GoalPreview
                name="Monthly Budget"
                progress={58}
                description="Know how much room you have left."
              />

              <GoalPreview
                name="Spending Health"
                progress={81}
                description="Build better financial habits over time."
              />

            </div>

          </div>

        </section>

        {/* ============================================================
            TRUST
        ============================================================ */}

        <section className="py-20 px-5 md:px-8">

          <div className="max-w-4xl mx-auto">

            <Reveal>

              <div className="glass rounded-3xl p-8 md:p-12 text-center neon-border">

                <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-400/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white mt-5">
                  Clear data.
                  <br />
                  Better decisions.
                </h2>

                <p className="text-gray-500 max-w-xl mx-auto mt-4 leading-relaxed">
                  FINPILOT is designed to turn financial information into
                  understandable signals instead of overwhelming numbers.
                </p>

                <div className="grid sm:grid-cols-3 gap-3 mt-8">

                  <TrustItem text="Transparent insights" />

                  <TrustItem text="Goal-focused planning" />

                  <TrustItem text="Actionable decisions" />

                </div>

              </div>

            </Reveal>

          </div>

        </section>

        {/* ============================================================
            FINAL CTA
        ============================================================ */}

        <section className="py-20 px-5 md:px-8">

          <div className="max-w-4xl mx-auto text-center">

            <Reveal>

              <p className="text-emerald-400 text-xs uppercase tracking-[0.2em] font-semibold">
                READY?
              </p>

              <h2 className="text-4xl md:text-6xl font-bold text-white mt-4">
                Take control of
                <br />
                your money.
              </h2>

              <p className="text-gray-500 mt-5 max-w-lg mx-auto">
                Start using FINPILOT to understand your finances and make
                smarter decisions.
              </p>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 mt-8 px-7 py-4 rounded-xl bg-emerald-400 text-[#050505] font-bold hover:bg-emerald-300 transition-all glow-emerald"
              >
                Enter FINPILOT
                <ArrowRight className="w-5 h-5" />
              </Link>

            </Reveal>

          </div>

        </section>

      </main>

      {/* ============================================================
          FOOTER
      ============================================================ */}

      <footer className="border-t border-white/[0.05]">

        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2">

            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">

              <Wallet
                className="w-3.5 h-3.5 text-[#050505]"
                strokeWidth={2.5}
              />

            </div>

            <span className="text-white font-bold">
              FINPILOT
            </span>

          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Financial intelligence for everyday decisions.
          </div>

        </div>

      </footer>

    </div>
  );
}

/* ============================================================
   FEATURE CARD
============================================================ */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Reveal>

      <div className="glass-card p-6 h-full">

        <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 mb-5">
          {icon}
        </div>

        <h3 className="text-base font-semibold text-white">
          {title}
        </h3>

        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {description}
        </p>

      </div>

    </Reveal>
  );
}

/* ============================================================
   STEP CARD
============================================================ */

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <Reveal>

      <div className="glass-card p-7">

        <span className="text-xs text-emerald-400 font-mono">
          {number}
        </span>

        <h3 className="text-xl font-semibold text-white mt-4">
          {title}
        </h3>

        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {description}
        </p>

      </div>

    </Reveal>
  );
}

/* ============================================================
   GOAL PREVIEW
============================================================ */

function GoalPreview({
  name,
  progress,
  description,
}: {
  name: string;
  progress: number;

  description: string;
}) {
  return (
    <Reveal>

      <div className="glass-card p-6">

        <div className="flex items-center justify-between">

          <span className="text-sm font-semibold text-white">
            {name}
          </span>

          <span className="text-xs text-emerald-400 font-semibold">
            {progress}%
          </span>

        </div>

        <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-4">

          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            style={{ width: `${progress}%` }}
          />

        </div>

        <p className="text-xs text-gray-500 mt-3">
          {description}
        </p>

      </div>

    </Reveal>
  );
}

/* ============================================================
   TRUST ITEM
============================================================ */

function TrustItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="glass-card p-3 flex items-center justify-center gap-2">

      <CheckCircle2 className="w-4 h-4 text-emerald-400" />

      <span className="text-xs text-gray-400">
        {text}
      </span>

    </div>
  );
}

/* ============================================================
   PREVIEW CARD
============================================================ */

function PreviewCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass-card p-4">

      <div className="flex items-center gap-2 mb-3">

        <span className="text-emerald-400">
          {icon}
        </span>

        <p className="metric-label">
          {title}
        </p>

      </div>

      <p className="text-lg font-bold text-white">
        {value}
      </p>

    </div>
  );
}

export default LandingPage;
