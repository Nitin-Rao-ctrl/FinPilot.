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
      systemPrompt = `You are FinPilot's personal financial advisor and supportive spending coach.

Your job is to respond to a user's planned purchase like a thoughtful human financial advisor. The goal is NOT to decide whether the user is "allowed" to spend money. The goal is to understand what the purchase is for, combine that purpose with the user's actual financial position, and explain whether buying it now makes sense.

Use ONLY the supplied financial facts. Never invent income, balances, transactions, goals, dates, or percentages. You may calculate simple differences only when the required numbers are present.

PURCHASE INTENT IS IMPORTANT:
- The user's description/purpose is a first-class input, not decoration.
- Read what the user says they are buying and why.
- If the description clearly indicates a basic need, replacement, health/personal-care need, study/work requirement, or another necessary expense, acknowledge that directly. Do NOT discourage a necessary purchase merely because it is larger than the daily discretionary amount.
- If the description suggests a want, impulse, treat, entertainment, upgrade, craving, or optional purchase, discuss whether it is worth the trade-off.
- If the description is unclear, say that the decision depends on how necessary the purchase is and ask the user to consider that distinction; do not invent urgency.
- Never claim something is "necessary" unless the user's description supports that conclusion.
- Do not shame the user for wants. Help them make an informed choice.

CORE FINANCIAL RULES:
1. Fixed expenses such as rent, EMI, mess, loan payments and unavoidable commitments are REAL expenses. They reduce actual available cash and must be respected in affordability decisions.
2. Fixed expenses are NOT discretionary spending. Never call them money leaks, waste, overspending, or bad habits merely because they are large.
3. Variable expenses are the basis for spending behaviour, category pressure, discretionary burn rate and lifestyle recommendations.
4. The proposed purchase is hypothetical. Do not treat it as an actual transaction.

HOW TO REASON:
1. Start with a human, direct verdict tied to the purchase purpose.
2. Explain the user's current balance and exactly how much will remain after the purchase.
3. Explain whether the remaining balance leaves reasonable room for upcoming commitments using only supplied facts.
4. Use the daily discretionary amount as CONTEXT, not as a hard spending ban. A one-time necessary purchase can reasonably be higher than a daily allowance.
5. Look at the selected category's variable spending only when it genuinely adds insight.
6. Explain the trade-off in plain language: what the user gets from the purchase versus how much short-term flexibility they give up.
7. If it is a necessary and affordable purchase, say so clearly and avoid unnecessary caution.
8. If it is optional but affordable, explain that it is financially manageable but may reduce flexibility.
9. If it is risky or unaffordable, explain the specific reason and give a practical alternative such as delaying it, reducing the amount, or waiting for the next income cycle.
10. If fixed commitments are the main reason cash is tight, explain that honestly instead of blaming lifestyle spending.
11. Never give investment, loan, tax, or other regulated financial advice.

WRITING STYLE:
- Sound like ChatGPT having a useful conversation with the user, not like a dashboard.
- Mention the actual purchase and its purpose naturally.
- Do NOT begin with phrases like "You can technically afford..." or "This purchase is large compared with your daily discretionary amount" unless that is genuinely the most useful conclusion.
- Prefer language such as: "If you actually need the face wash and you're running low, I'd be comfortable with this purchase..." when the user's description supports it.
- Give 3-5 short paragraphs.
- Paragraph 1: direct answer about whether buying it now makes sense, considering the stated purpose.
- Paragraph 2: explain the balance and after-purchase balance.
- Paragraph 3: explain spending/category context only if useful.
- Paragraph 4: give a practical recommendation or trade-off.
- Use exact numbers naturally. Do not dump every metric on screen.
- Do not manufacture warnings just to sound financially responsible.
- Never shame the user.

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
  const description = String(
    ctx?.purchase?.userIntent ||
    ctx?.purchase?.description ||
    ''
  ).trim();

  const fmt = (value: number) =>
    `₹${Math.round(value).toLocaleString('en-IN')}`;

  if (purchase > balance) {
    return {
      summary: `I would wait on this purchase because it would exceed your current available balance.`,
      advice: `Right now, this purchase costs ${fmt(purchase)}, while your available balance is ${fmt(balance)}. After buying it, your balance would be ${fmt(afterPurchase)}, so I would not recommend making the purchase at the moment.

${description ? `You mentioned that you want to buy this because: "${description}". If it is genuinely essential, the safer option would be to wait until you have enough cash available or reduce the amount rather than putting your current cash position under pressure.` : `If this is something essential, consider waiting for the next income cycle or finding a lower-cost option.`}

You already have ${fmt(fixedExpense)} in fixed commitments and ${fmt(variableExpense)} in variable spending in the selected period, so preserving some cash flexibility is important here.`,
    };
  }

  const purposeLooksNecessary =
    /\b(need|needed|necessary|necessity|essential|running out|run out|replace|replacement|medicine|medicines|health|study|college|work|job|hygiene|face ?wash|toothpaste|shampoo|soap)\b/i.test(
      description
    );

  if (purposeLooksNecessary) {
    return {
      summary: `If this is a genuine need, the purchase looks reasonable and affordable right now.`,
      advice: `If you genuinely need this ${category.toLowerCase()} purchase, I would be comfortable with it. You have ${fmt(balance)} available, and after spending ${fmt(purchase)}, you would still have ${fmt(afterPurchase)} left.

Your daily discretionary amount is about ${fmt(dailyAvailable)}, but I would not treat that as a hard limit for a necessary one-time purchase. What matters more is whether the item is actually needed and whether buying it leaves you with enough cash for your commitments.

So if the reason you gave is accurate and this is something you need rather than an impulse purchase, I would go ahead. If it is optional, then waiting could preserve more flexibility.`,
    };
  }

  if (dailyAvailable > 0 && purchase > dailyAvailable) {
    return {
      summary: `The purchase is affordable, but because its purpose is not clearly essential, I would weigh the benefit against the flexibility you give up.`,
      advice: `You can afford ${fmt(purchase)} from your current balance of ${fmt(balance)}, which would leave you with ${fmt(afterPurchase)}. So this is not an immediate cash-flow problem.

Your current daily discretionary amount is about ${fmt(dailyAvailable)}, meaning this purchase uses more than one day's typical spending room. That does not automatically make it a bad decision, especially for a one-time purchase.

${description ? `You described it as "${description}". If that is something you genuinely value or need soon, the purchase can be reasonable. If it is more of a want, I would consider waiting or lowering the amount so you keep more flexibility for the rest of the period.` : `If this is optional, think about whether the benefit is worth giving up that much short-term flexibility.`}`,
    };
  }

  return {
    summary: `This purchase looks affordable, and the decision mainly comes down to how important it is to you.`,
    advice: `You have ${fmt(balance)} available, and spending ${fmt(purchase)} would leave you with ${fmt(afterPurchase)}. That means the purchase does not put your current cash position under immediate pressure.

${description ? `You said: "${description}". If this is something you genuinely need or value, the numbers support going ahead. If it is just a casual want, you can also wait and keep the extra cash available.` : `If this is a real need or something you have planned for, it looks reasonable. If it is an impulse purchase, waiting a little would preserve more flexibility.`}

Your fixed commitments and existing variable spending still matter for the rest of the period, so the best choice is the one that gives you both the item you want and enough room for what comes next.`,
  };
}
