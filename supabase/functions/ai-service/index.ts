import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FinancialSnapshot {
  weekStart: string;
  weekEnd: string;
  totalIncome: number;
  totalExpense: number;
  savings: number;
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
          fallback: generateFallbackReport(snapshot as FinancialSnapshot),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let prompt: string;
    let systemPrompt: string;

    if (reportType === "weekly") {
      systemPrompt = `You are a financial behavior analysis assistant. Use ONLY the supplied financial facts. Do not invent numbers. Explain what happened, what improved, what went wrong, what patterns were detected, and what the user can do next. Use supportive, practical language. Do not shame the user. Do not provide investment or regulated financial advice. Format your response as a JSON object with a "reportText" field (a flowing narrative report) and a "reportSections" array of {heading, body} objects covering: Weekly Summary, Top Spending, Money Leaks, Budget Status, Financial Health, Goal Progress, Problems Detected, Positive Behavior, Recommended Actions, Next Week Spending Limit.`;
      prompt = `Generate a weekly financial report using these facts:\n\n${JSON.stringify(snapshot, null, 2)}`;
    } else if (reportType === "spending-advice") {
      systemPrompt = `You are a personal spending guidance assistant. Use ONLY the supplied financial context. Explain the consequences of the proposed expense. Do not make up data. Do not simply say yes or no. Consider remaining money, budget, daily spending limit, spending patterns, goals, goal impact, and category behavior. If the purchase is manageable, say so. If it is risky, explain why and suggest alternatives. The user remains responsible for the final decision. Respond as a JSON object with an "advice" field (2-4 paragraphs of natural language advice) and a "summary" field (one-line summary).`;
      prompt = `Provide spending advice based on this context:\n\n${JSON.stringify(spendingContext, null, 2)}`;
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
      return new Response(
        JSON.stringify({
          error: `AI API returned ${response.status}`,
          fallback: reportType === "weekly"
            ? generateFallbackReport(snapshot as FinancialSnapshot)
            : generateFallbackAdvice(spendingContext),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackReport(s: FinancialSnapshot): { reportText: string; reportSections: { heading: string; body: string }[] } {
  const cur = s.currency || "INR";
  const fmt = (n: number) => `${cur === "INR" ? "₹" : "$"}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const reportText = `This week you spent ${fmt(s.totalExpense)} and earned ${fmt(s.totalIncome)}, saving ${fmt(s.savings)}. ${
    s.previousWeekExpense > 0
      ? `Your spending ${s.weekOverWeekChange > 0 ? "increased" : "decreased"} by ${Math.abs(s.weekOverWeekChange).toFixed(1)}% compared to last week.`
      : "No previous week data available for comparison."
  } Your top spending category was ${s.topCategories[0]?.category || "N/A"}. ${
    s.moneyLeaks.length > 0 ? `We detected ${s.moneyLeaks.length} potential money leak pattern(s).` : "No money leaks detected."
  } Your financial health score is ${s.healthScore}/100. ${
    s.activeGoals.length > 0 ? `You have ${s.activeGoals.length} active savings goal(s).` : ""
  }`;

  const sections = [
    { heading: "Weekly Summary", body: `Total income: ${fmt(s.totalIncome)}. Total spending: ${fmt(s.totalExpense)}. Savings: ${fmt(s.savings)}.` },
    { heading: "Top Spending", body: s.topCategories.map((c) => `${c.category}: ${fmt(c.total)} (${c.percentage.toFixed(1)}%)`).join(". ") },
    { heading: "Budget Status", body: `${s.budgetStatus.status}. Utilization: ${s.budgetStatus.utilization.toFixed(1)}%.` },
    { heading: "Financial Health", body: `Score: ${s.healthScore}/100.` },
    { heading: "Goal Progress", body: s.activeGoals.map((g) => `${g.name}: ${fmt(g.saved)}/${fmt(g.target)} — ${g.feasibility}`).join(". ") || "No active goals." },
    { heading: "Recommended Actions", body: "Continue tracking your spending daily for more accurate insights." },
  ];

  return { reportText, reportSections: sections };
}

function generateFallbackAdvice(ctx: Record<string, unknown>): { advice: string; summary: string } {
  const decision = ctx.decision || "CAUTION";
  const reasons = (ctx.reasons as string[]) || [];
  const advice = `Based on your financial context, this expense is classified as ${decision}. ${reasons.join(". ")}. Please review your current balance and goals before making this purchase.`;
  const summary = `Classification: ${decision}`;
  return { advice, summary };
}
