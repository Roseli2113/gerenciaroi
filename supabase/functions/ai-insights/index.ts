import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface InsightOut {
  category: "campaign" | "sales" | "funnel" | "rule";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  recommendation: string;
  suggested_action?: {
    type: "create_rule" | "pause_campaign" | "scale_budget" | "manual";
    rule?: {
      name: string;
      condition_type: string;
      condition_value: string;
      action_type: string;
      action_value?: number;
      action_value_type?: string;
      frequency: string;
      applied_to: string;
      target_id?: string;
    };
    target_id?: string;
    note?: string;
  };
  context?: Record<string, unknown>;
}

async function gatherUserData(supabase: any, userId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [salesRes, rulesRes, accountsRes, visitorsRes] = await Promise.all([
    supabase.from("sales").select("amount,status,product_name,campaign_id,created_at,platform").eq("user_id", userId).gte("created_at", since).limit(500),
    supabase.from("automation_rules").select("id,name,is_active,executions,last_execution_result,last_execution_affected").eq("user_id", userId),
    supabase.from("meta_ad_accounts").select("account_id,name,is_active,currency").eq("user_id", userId).eq("is_active", true),
    supabase.from("live_visitors").select("id").eq("user_id", userId).gte("last_seen_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()),
  ]);

  const sales = salesRes.data || [];
  const realSales = sales.filter((s: any) => Number(s.amount) > 0);
  const approved = realSales.filter((s: any) => s.status === "approved" || s.status === "paid");
  const pending = realSales.filter((s: any) => s.status === "pending");
  const refunded = realSales.filter((s: any) => s.status === "refunded" || s.status === "chargedback");

  // Try to fetch Meta campaigns via the meta-ads function
  let campaigns: any[] = [];
  try {
    const metaRes = await supabase.functions.invoke("meta-ads", {
      body: { action: "list_campaigns", date_preset: "last_7d" },
      headers: { "x-user-id": userId },
    });
    if (metaRes.data?.campaigns) campaigns = metaRes.data.campaigns.slice(0, 30);
  } catch (_) { /* meta-ads may need user JWT, skip silently */ }

  return {
    period_days: 7,
    sales_summary: {
      total_real_sales: realSales.length,
      approved: approved.length,
      pending: pending.length,
      refunded: refunded.length,
      revenue: approved.reduce((s: number, x: any) => s + Number(x.amount), 0),
      pending_value: pending.reduce((s: number, x: any) => s + Number(x.amount), 0),
      avg_ticket: approved.length ? approved.reduce((s: number, x: any) => s + Number(x.amount), 0) / approved.length : 0,
      top_products: Object.entries(
        approved.reduce((acc: Record<string, number>, s: any) => {
          const k = s.product_name || "Sem nome";
          acc[k] = (acc[k] || 0) + Number(s.amount);
          return acc;
        }, {})
      ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5),
      sales_by_campaign: Object.entries(
        approved.reduce((acc: Record<string, { count: number; revenue: number }>, s: any) => {
          const k = s.campaign_id || "sem_utm";
          if (!acc[k]) acc[k] = { count: 0, revenue: 0 };
          acc[k].count++;
          acc[k].revenue += Number(s.amount);
          return acc;
        }, {})
      ),
    },
    funnel: {
      live_visitors_30min: (visitorsRes.data || []).length,
    },
    campaigns: campaigns.map((c: any) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      spend: Number(c.spend || 0),
      impressions: Number(c.impressions || 0),
      clicks: Number(c.clicks || 0),
      ctr: Number(c.ctr || 0),
      cpm: Number(c.cpm || 0),
      cpc: Number(c.cpc || 0),
      purchases: Number(c.purchases || 0),
      roas: Number(c.roas || 0),
      cpa: Number(c.cpa || 0),
      frequency: Number(c.frequency || 0),
      daily_budget: Number(c.daily_budget || 0),
    })),
    active_accounts: (accountsRes.data || []).length,
    automation_rules: (rulesRes.data || []).map((r: any) => ({
      name: r.name,
      active: r.is_active,
      executions: r.executions,
      last_result: r.last_execution_result,
    })),
  };
}

const SYSTEM_PROMPT = `Você é um especialista sênior em Meta Ads e otimização de campanhas para e-commerce/infoprodutos no Brasil.

Analise os dados do usuário e gere de 3 a 8 insights ACIONÁVEIS, priorizando o que mais impacta ROI/lucro.

Regras:
- Foco em: campanhas com ROAS baixo, alta frequência, CTR baixo, CPA acima do ticket médio, escalar campanhas vencedoras, funil quebrado, produtos top, regras de automação úteis.
- Severidade "critical" só para perdas reais (gasto sem retorno, ROAS<1 com volume).
- "warning" para oportunidades importantes. "info" para observações.
- Recomendação deve ser específica (com números, % ou nome da campanha).
- Para sugestões de regra de automação, preencha suggested_action.rule com a estrutura completa.
- Se não houver dados suficientes em alguma categoria, NÃO invente — pule.
- Texto em português do Brasil, direto e curto.
- IDs/valores numéricos sempre em pt-BR (R$ 1.234,56).

Tipos de regra disponíveis:
- condition_type: "roas_below", "cpa_above", "spend_above", "ctr_below", "frequency_above"
- action_type: "pause", "increase_budget", "decrease_budget", "notify"
- frequency: "hourly", "daily"
- applied_to: "all", "campaign", "adset", "ad"`;

async function callAI(userData: any): Promise<InsightOut[]> {
  const tools = [{
    type: "function",
    function: {
      name: "emit_insights",
      description: "Emite os insights de otimização",
      parameters: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string", enum: ["campaign", "sales", "funnel", "rule"] },
                severity: { type: "string", enum: ["info", "warning", "critical"] },
                title: { type: "string" },
                description: { type: "string" },
                recommendation: { type: "string" },
                suggested_action: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["create_rule", "pause_campaign", "scale_budget", "manual"] },
                    rule: { type: "object" },
                    target_id: { type: "string" },
                    note: { type: "string" },
                  },
                },
                context: { type: "object" },
              },
              required: ["category", "severity", "title", "description", "recommendation"],
            },
          },
        },
        required: ["insights"],
      },
    },
  }];

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Dados dos últimos 7 dias:\n\n${JSON.stringify(userData, null, 2)}` },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "emit_insights" } },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`AI error: ${resp.status} ${text}`);
  }

  const json = await resp.json();
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return [];
  const args = JSON.parse(toolCall.function.arguments);
  return args.insights || [];
}

async function processUser(supabase: any, userId: string, trigger: string) {
  try {
    const data = await gatherUserData(supabase, userId);

    // Skip if no data at all
    if (data.sales_summary.total_real_sales === 0 && data.campaigns.length === 0) {
      await supabase.from("ai_insights_runs").insert({
        user_id: userId, trigger, insights_generated: 0, status: "skipped", error_message: "no_data",
      });
      return { generated: 0, skipped: true };
    }

    const insights = await callAI(data);

    if (insights.length > 0) {
      // Mark previous "new" insights as "outdated" so the user only sees fresh ones
      await supabase.from("ai_insights").update({ status: "outdated" }).eq("user_id", userId).eq("status", "new");

      const rows = insights.map((i) => ({
        user_id: userId,
        category: i.category,
        severity: i.severity,
        title: i.title,
        description: i.description,
        recommendation: i.recommendation,
        suggested_action: i.suggested_action || null,
        context: i.context || null,
        status: "new",
      }));
      await supabase.from("ai_insights").insert(rows);
    }

    await supabase.from("ai_insights_runs").insert({
      user_id: userId, trigger, insights_generated: insights.length, status: "success",
    });
    return { generated: insights.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("ai_insights_runs").insert({
      user_id: userId, trigger, insights_generated: 0, status: "error", error_message: msg,
    });
    throw e;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const trigger = body.trigger || "manual";
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Cron mode: process all eligible users
    if (trigger === "cron") {
      const { data: accounts } = await supabase
        .from("meta_ad_accounts")
        .select("user_id")
        .eq("is_active", true);
      const userIds = [...new Set((accounts || []).map((a: any) => a.user_id))];
      const results: any[] = [];
      for (const uid of userIds) {
        try {
          const r = await processUser(supabase, uid, "cron");
          results.push({ user_id: uid, ...r });
        } catch (e) {
          results.push({ user_id: uid, error: e instanceof Error ? e.message : String(e) });
        }
      }
      return new Response(JSON.stringify({ processed: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Manual mode: needs auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await processUser(supabase, userRes.user.id, "manual");
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === "RATE_LIMIT" ? 429 : msg === "PAYMENT_REQUIRED" ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
