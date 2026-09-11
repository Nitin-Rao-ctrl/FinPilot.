// Supabase Edge Function runtime declarations.
// Keeping these local declarations makes the file work in VS Code even when
// the Deno extension is not enabled, while remaining compatible with Supabase Edge Runtime.
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
};

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
      systemPrompt = `You are FinPilot's personal financial decision coach.

Your job is to reason through a user's planned purchase like ChatGPT giving a thoughtful, personalized answer. Do not sound like a dashboard, a bank warning, or a generic budgeting article. The user should understand not only the verdict, but WHY it is the verdict and what you would do next.

Use ONLY the supplied financial facts. Never invent income, balances, transactions, goals, dates, or percentages. Use exact numbers supplied when relevant, and calculate simple differences only when the required numbers are present.

CORE FINANCIAL RULES:
1. Fixed expenses such as rent, EMI, mess, loan payments and unavoidable commitments are REAL expenses. They reduce actual available cash and must be respected in the affordability decision.
2. Fixed expenses are NOT discretionary spending. Never call them money leaks, waste, overspending, or bad habits merely because they are large.
3. Variable expenses are the basis for spending behaviour, category pressure, discretionary burn rate and lifestyle recommendations.
4. The proposed purchase itself is hypothetical. Do not treat it as an actual transaction.

HOW TO REASON:
- Start with a clear verdict: whether the purchase looks comfortable, manageable with caution, or risky/not recommended.
- Explain WHY using the user's actual balance and the balance after purchase.
- Compare the purchase with the user's variable spending pattern and the amount available per day when that comparison is meaningful.
- If the selected category is already a large variable-spending category, explain the pressure without exaggerating it.
- If fixed commitments are the main reason cash is tight, explain that honestly instead of blaming discretionary spending.
- Explain the trade-off: what the user gains from the purchase versus what financial flexibility they give up.
- If it is affordable, do not manufacture a warning just to sound cautious.
- If it is risky, suggest a concrete alternative such as delaying it, lowering the purchase amount, reducing a controllable category, or waiting until the next income cycle.
- If data is incomplete, clearly say what is missing and avoid false certainty.
- Do not give investment, loan, tax, or other regulated financial advice.

WRITING STYLE:
- Sound like ChatGPT having a useful conversation with the user.
- Give a clear verdict first, then explain the reasoning in 3-5 short paragraphs.
- Paragraph 1: directly answer whether the purchase is comfortable, manageable with caution, or risky.
- Paragraph 2: explain the actual balance and exactly how much would remain after the purchase.
- Paragraph 3: explain the daily discretionary amount and the selected category's variable-spending pressure when meaningful.
- Paragraph 4: explain the trade-off and give a concrete recommendation. A fifth paragraph is allowed only if it adds useful context.
- Mention concrete numbers naturally instead of dumping raw metrics.
- Interpret the numbers; do not merely repeat dashboard labels.
- If the purchase is affordable, do not pretend it is dangerous. If it is risky, explain the specific reason.
- Never shame the user.
- Avoid repetitive phrases such as "based on the available information".
- Keep the tone warm, confident, practical and easy to understand.

Return JSON with exactly two fields:
- advice: 3-5 short paragraphs of natural, personalized financial guidance, separated by blank lines.
- summary: one concise sentence containing the overall verdict.`;

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

    // The spending-decision experience uses the newer Responses API and a stronger
    // model so the answer feels like an actual financial conversation instead of
    // a short rule-based status message. Weekly reports keep the existing path.
    if (reportType === "spending-advice") {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          instructions: systemPrompt,
          input: prompt,
          max_output_tokens: 1400,
          text: {
            format: {
              type: "json_schema",
              name: "spending_advice",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  advice: { type: "string" },
                  summary: { type: "string" },
                },
                required: ["advice", "summary"],
                additionalProperties: false,
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI Responses API error:", errText);

        return new Response(
          JSON.stringify({
            error: `AI API returned ${response.status}`,
            fallback: generateFallbackAdvice(spendingContext),
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const aiData = await response.json();
      const content =
        aiData.output_text ||
        aiData.output
          ?.flatMap((item: any) => item.content || [])
          ?.find((item: any) => item.type === "output_text")?.text ||
        "{}";

      const parsed = JSON.parse(content);

      return new Response(
        JSON.stringify({
          ...parsed,
          modelUsed: "gpt-5.6-luna",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
          fallback: generateFallbackReport(snapshot as FinancialSnapshot),
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
  ctx: Record<string, any>
): { advice: string; summary: string } {
  const purchase = Number(ctx?.purchase?.amount || 0);
  const balance = Number(ctx?.financialPosition?.currentBalance || 0);
  const afterPurchase = Number(ctx?.financialPosition?.afterPurchase || 0);
  const fixedExpense = Number(ctx?.financialPosition?.fixedExpense || 0);
  const variableExpense = Number(ctx?.financialPosition?.variableExpense || 0);
  const dailyAvailable = Number(ctx?.discretionaryAnalysis?.dailyAvailable || 0);
  const category = String(ctx?.purchase?.category || 'this category');
  const categoryPercentage = Number(
    ctx?.discretionaryAnalysis?.categoryPercentage || 0
  );

  const fmt = (value: number) =>
    `₹${Math.round(value).toLocaleString('en-IN')}`;

  if (purchase > balance) {
    return {
      summary: `I would not recommend this purchase right now because it is larger than your available balance.`,
      advice: `You currently have ${fmt(balance)} available, while this purchase costs ${fmt(purchase)}. Making the purchase would take you to ${fmt(afterPurchase)}, so it would put your current cash position under pressure.

You also have ${fmt(fixedExpense)} in fixed commitments and ${fmt(variableExpense)} in variable spending in the selected period. If the purchase is not urgent, delaying it until your next income cycle would be the safer option.`,
    };
  }

  if (dailyAvailable > 0 && purchase > dailyAvailable) {
    return {
      summary: `You can afford the purchase, but it is large compared with your current daily discretionary amount.`,
      advice: `You can technically afford ${fmt(purchase)} because your current balance is ${fmt(balance)} and you would have ${fmt(afterPurchase)} left afterward. The concern is that the purchase is larger than your current daily discretionary amount of about ${fmt(dailyAvailable)}.

Because this is a ${category} purchase, it is worth checking whether that category is already under pressure. It currently represents about ${Math.round(categoryPercentage)}% of period income after including this purchase. If the purchase is important, consider delaying it or reducing the amount; otherwise, it looks manageable if you are comfortable giving up that much short-term flexibility.`,
    };
  }

  return {
    summary: `This purchase looks manageable without putting your current balance under immediate pressure.`,
    advice: `You can afford ${fmt(purchase)} from your current balance of ${fmt(balance)}, leaving about ${fmt(afterPurchase)} afterward. That means the purchase does not immediately put your cash position at risk.

You still have ${fmt(fixedExpense)} of fixed commitments and ${fmt(variableExpense)} of variable spending in the selected period, so the main question is whether this purchase is worth the reduction in financial flexibility. If it is a planned or important purchase, it looks reasonable; if it is optional, waiting could preserve more room for upcoming expenses.`,
  };
}
