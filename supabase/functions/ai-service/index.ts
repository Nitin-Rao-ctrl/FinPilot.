import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FinancialSnapshot {
  weekStart: string;
  weekEnd: string;

  // Real cash-flow figures. Fixed expenses remain part of actual spending.
  totalIncome: number;
  totalExpense: number;
  fixedExpense: number;
  variableExpense: number;
  savings: number;

  // Discretionary analytics must be variable-expense only.
  topCategories: { category: string; total: number; percentage: number }[];
  previousWeekExpense: number;
  weekOverWeekChange: number;
  moneyLeaks: { category: string; count: number; total: number; average: number }[];
  budgetStatus: { budget: number; spent: number; utilization: number; status: string };
  healthScore: number;
  activeGoals: { name: string; target: number; saved: number; requiredWeekly: number; feasibility: string }[];
  currency: string;
  dataConfidence: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { snapshot, reportType, spendingContext } = await req.json();

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "AI service not configured. Set OPENAI_API_KEY in edge function secrets.",
          fallback:
            reportType === "weekly"
              ? generateFallbackReport(snapshot as FinancialSnapshot)
              : generateFallbackAdvice(spendingContext),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let prompt: string;
    let systemPrompt: string;

    if (reportType === "weekly") {
      systemPrompt = `You are a financial behavior analysis assistant.

Use ONLY the supplied financial facts. Do not invent numbers.

IMPORTANT EXPENSE CLASSIFICATION RULES:

1. Fixed expenses such as rent, EMI, mess, loan payments and other unavoidable commitments are REAL expenses and MUST count toward:
   - actual spending
   - actual cash flow
   - actual savings
   - actual available balance

2. Fixed expenses MUST NOT be treated as discretionary spending.

3. Fixed expenses MUST NOT be used for:
   - daily variable spending
   - discretionary burn rate
   - money leaks
   - spending behavior
   - variable category analysis
   - unnecessary spending patterns
   - discretionary savings suggestions

4. Variable expenses are the ONLY expenses that should be used for discretionary behavior analysis, money leaks, spending patterns and category insights.

5. If fixedExpense and variableExpense are supplied, never add fixedExpense into discretionary analytics.

6. If topCategories or moneyLeaks are supplied, treat them as variable/discretionary-only analytics unless the supplied facts explicitly state otherwise.

7. Do not describe rent, EMI, mess, loan payments or other unavoidable commitments as "money leaks", "overspending", "waste", or unnecessary spending merely because they are large.

Explain what happened, what improved, what went wrong, what patterns were detected, and what the user can do next. Use supportive, practical language. Do not shame the user. Do not provide investment or regulated financial advice.

Format your response as a JSON object with a "reportText" field (a flowing narrative report) and a "reportSections" array of {heading, body} objects covering: Weekly Summary, Top Spending, Money Leaks, Budget Status, Financial Health, Goal Progress, Problems Detected, Positive Behavior, Recommended Actions, Next Week Spending Limit.`;

      prompt = `Generate a weekly financial report using these facts.

Treat fixed expenses as real cash-flow commitments, but keep all discretionary analysis variable-only.

FINANCIAL SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}`;
    } else if (reportType === "spending-advice") {
      systemPrompt = `You are a personal spending guidance assistant.

Use ONLY the supplied financial context. Do not make up data.

IMPORTANT EXPENSE CLASSIFICATION RULES:

1. Fixed expenses such as rent, EMI, mess, loan payments and other unavoidable commitments are REAL expenses and affect actual available balance and cash flow.

2. Fixed expenses are NOT discretionary spending and must not be treated as money leaks or evidence of poor spending behavior.

3. Variable expenses are the basis for discretionary spending behavior, category behavior and unnecessary-spending analysis.

4. When evaluating a proposed purchase, consider the user's actual available balance after all real expenses, including fixed commitments.

5. When discussing spending behavior, patterns or category pressure, use variable spending only.

6. Do not recommend cutting unavoidable fixed commitments as if they were discretionary purchases.

Explain the consequences of the proposed expense. Do not simply say yes or no. Consider remaining money, actual balance, budget, daily spending limit, variable spending patterns, goals, goal impact, and category behavior. If the purchase is manageable, say so. If it is risky, explain why and suggest realistic alternatives. The user remains responsible for the final decision.

Respond as a JSON object with an "advice" field (2-4 paragraphs of natural language advice) and a "summary" field (one-line summary).`;

      prompt = `Provide spending advice based on this context.

Remember: actual balance/cash flow includes fixed commitments, while discretionary behavior analysis uses variable spending only.

SPENDING CONTEXT:
${JSON.stringify(spendingContext, null, 2)}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid report type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", errText);

      return new Response(
        JSON.stringify({
          error: `AI API returned ${response.status}`,
          fallback:
            reportType === "weekly"
              ? generateFallbackReport(snapshot as FinancialSnapshot)
              : generateFallbackAdvice(spendingContext),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return new Response(
      JSON.stringify({
        ...parsed,
        modelUsed: "gpt-4o-mini",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateFallbackReport(
  s: FinancialSnapshot
): {
  reportText: string;
  reportSections: { heading: string; body: string }[];
} {
  const cur = s.currency || "INR";
  const fmt = (n: number) =>
    `${cur === "INR" ? "₹" : "$"}${n.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;

  const fixedExpense = Number(s.fixedExpense || 0);
  const variableExpense = Number(s.variableExpense || 0);
  const totalExpense = Number.isFinite(s.totalExpense)
    ? s.totalExpense
    : fixedExpense + variableExpense;

  const reportText = `This week you spent ${fmt(totalExpense)} and earned ${fmt(
    s.totalIncome
  )}, saving ${fmt(s.savings)}. ${
    fixedExpense > 0
      ? `${fmt(fixedExpense)} was fixed/committed spending and ${fmt(
          variableExpense
        )} was variable spending. `
      : ""
  }${
    s.previousWeekExpense > 0
      ? `Your spending ${
          s.weekOverWeekChange > 0 ? "increased" : "decreased"
        } by ${Math.abs(s.weekOverWeekChange).toFixed(
          1
        )}% compared to last week.`
      : "No previous week data available for comparison."
  } Your top discretionary spending category was ${
    s.topCategories[0]?.category || "N/A"
  }. ${
    s.moneyLeaks.length > 0
      ? `We detected ${s.moneyLeaks.length} potential variable-spending money leak pattern(s).`
      : "No variable-spending money leaks detected."
  } Your financial health score is ${s.healthScore}/100. ${
    s.activeGoals.length > 0
      ? `You have ${s.activeGoals.length} active savings goal(s).`
      : ""
  }`;

  const sections = [
    {
      heading: "Weekly Summary",
      body: `Total income: ${fmt(s.totalIncome)}. Total spending: ${fmt(
        totalExpense
      )}. Savings: ${fmt(s.savings)}.`,
    },
    {
      heading: "Top Spending",
      body:
        s.topCategories.length > 0
          ? s.topCategories
              .map(
                (c) =>
                  `${c.category}: ${fmt(c.total)} (${c.percentage.toFixed(1)}%)`
              )
              .join(". ")
          : "No variable spending category data available.",
    },
    {
      heading: "Budget Status",
      body: `${s.budgetStatus.status}. Utilization: ${s.budgetStatus.utilization.toFixed(
        1
      )}%.`,
    },
    {
      heading: "Financial Health",
      body: `Score: ${s.healthScore}/100. Fixed commitments are treated as real cash-flow expenses, not discretionary behavior.`,
    },
    {
      heading: "Goal Progress",
      body:
        s.activeGoals
          .map(
            (g) =>
              `${g.name}: ${fmt(g.saved)}/${fmt(g.target)} — ${
                g.feasibility
              }`
          )
          .join(". ") || "No active goals.",
    },
    {
      heading: "Recommended Actions",
      body:
        "Focus discretionary spending improvements on variable expenses. Continue tracking fixed commitments separately because they remain part of real cash flow.",
    },
  ];

  return { reportText, reportSections: sections };
}

function generateFallbackAdvice(
  ctx: Record<string, unknown>
): { advice: string; summary: string } {
  const decision = ctx?.decision || "CAUTION";
  const reasons = (ctx?.reasons as string[]) || [];

  const advice = `Based on your financial context, this expense is classified as ${decision}. ${
    reasons.length > 0
      ? reasons.join(". ") + ". "
      : ""
  }Review your actual available balance and fixed commitments before making the purchase. For spending-behavior decisions, focus on your variable/discretionary spending rather than unavoidable fixed expenses.`;

  const summary = `Classification: ${decision}`;

  return { advice, summary };
}
