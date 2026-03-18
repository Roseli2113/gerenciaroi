import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://graph.facebook.com/v21.0";

interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  condition_type: string;
  condition_value: string;
  action_type: string;
  frequency: string;
  applied_to: string;
  is_active: boolean;
  executions: number;
  last_execution: string | null;
}

interface MetaEntity {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  campaign_id?: string;
  adset_id?: string;
}

interface InsightData {
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  spend: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
}

// Map frequency to minutes
function frequencyToMinutes(frequency: string): number {
  switch (frequency) {
    case "15min": return 15;
    case "30min": return 30;
    case "1hour": return 60;
    case "2hours": return 120;
    case "daily": return 1440;
    default: return 30;
  }
}

function shouldExecuteRule(rule: AutomationRule): boolean {
  if (!rule.last_execution) return true;
  const lastExec = new Date(rule.last_execution).getTime();
  const intervalMs = frequencyToMinutes(rule.frequency) * 60 * 1000;
  return Date.now() - lastExec >= intervalMs;
}

function getEntityTypeAndStatus(appliedTo: string): { entityType: "campaign" | "adset" | "ad"; statusFilter: "ACTIVE" | "PAUSED" | null } {
  switch (appliedTo) {
    case "active_campaigns": return { entityType: "campaign", statusFilter: "ACTIVE" };
    case "paused_campaigns": return { entityType: "campaign", statusFilter: "PAUSED" };
    case "active_adsets": return { entityType: "adset", statusFilter: "ACTIVE" };
    case "paused_adsets": return { entityType: "adset", statusFilter: "PAUSED" };
    case "active_ads": return { entityType: "ad", statusFilter: "ACTIVE" };
    case "paused_ads": return { entityType: "ad", statusFilter: "PAUSED" };
    case "all":
    default:
      return { entityType: "campaign", statusFilter: null };
  }
}

async function fetchAllPages(url: string): Promise<unknown[]> {
  const allData: unknown[] = [];
  let nextUrl: string | null = url;
  while (nextUrl) {
    const response = await fetch(nextUrl);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Meta API error");
    if (data.data) allData.push(...data.data);
    nextUrl = data.paging?.next || null;
  }
  return allData;
}

async function fetchEntitiesWithInsights(
  accessToken: string,
  accountId: string,
  entityType: "campaign" | "adset" | "ad",
  statusFilter: "ACTIVE" | "PAUSED" | null
): Promise<Array<{ entity: MetaEntity; spent: number; cpa: number | null; roi: number | null }>> {
  let entitiesUrl: string;
  let insightsUrl: string;
  let entityIdField: string;

  if (entityType === "campaign") {
    entitiesUrl = `${BASE_URL}/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget&limit=500&access_token=${accessToken}`;
    insightsUrl = `${BASE_URL}/${accountId}/insights?fields=campaign_id,spend,actions,action_values&level=campaign&date_preset=today&limit=500&access_token=${accessToken}`;
    entityIdField = "campaign_id";
  } else if (entityType === "adset") {
    entitiesUrl = `${BASE_URL}/${accountId}/adsets?fields=id,name,status,daily_budget,lifetime_budget,campaign_id&limit=500&access_token=${accessToken}`;
    insightsUrl = `${BASE_URL}/${accountId}/insights?fields=adset_id,spend,actions,action_values&level=adset&date_preset=today&limit=500&access_token=${accessToken}`;
    entityIdField = "adset_id";
  } else {
    entitiesUrl = `${BASE_URL}/${accountId}/ads?fields=id,name,status,adset_id&limit=500&access_token=${accessToken}`;
    insightsUrl = `${BASE_URL}/${accountId}/insights?fields=ad_id,spend,actions,action_values&level=ad&date_preset=today&limit=500&access_token=${accessToken}`;
    entityIdField = "ad_id";
  }

  const [entities, insights] = await Promise.all([
    fetchAllPages(entitiesUrl),
    fetchAllPages(insightsUrl).catch(() => []),
  ]);

  const insightsMap = new Map<string, InsightData>();
  for (const i of insights as InsightData[]) {
    const id = (i as Record<string, unknown>)[entityIdField] as string;
    if (id) insightsMap.set(id, i);
  }

  const results: Array<{ entity: MetaEntity; spent: number; cpa: number | null; roi: number | null }> = [];

  for (const raw of entities as MetaEntity[]) {
    if (statusFilter && raw.status !== statusFilter) continue;

    const insight = insightsMap.get(raw.id);
    const spent = insight ? parseFloat(insight.spend) || 0 : 0;

    const purchases = insight?.actions?.find(
      (a) => a.action_type === "purchase" || a.action_type === "omni_purchase"
    );
    const sales = purchases ? parseInt(purchases.value) : 0;

    const purchaseValue = insight?.action_values?.find(
      (a) => a.action_type === "purchase" || a.action_type === "omni_purchase"
    );
    const revenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;

    const cpa = sales > 0 ? spent / sales : null;
    const roi = spent > 0 ? revenue / spent : null;

    results.push({ entity: raw, spent, cpa, roi });
  }

  return results;
}

function evaluateCondition(
  conditionType: string,
  conditionValue: string,
  spent: number,
  cpa: number | null,
  roi: number | null
): boolean {
  const threshold = parseFloat(conditionValue);
  if (isNaN(threshold)) return false;

  switch (conditionType) {
    case "cpa_greater": return cpa !== null && cpa > threshold;
    case "cpa_less": return cpa !== null && cpa < threshold;
    case "roi_greater": return roi !== null && (roi * 100) > threshold;
    case "roi_less": return roi !== null && (roi * 100) < threshold;
    case "spend_greater": return spent > threshold && cpa === null;
    default: return false;
  }
}

function getActionForEntityType(
  actionType: string,
  entityType: "campaign" | "adset" | "ad"
): { metaAction: string; description: string } | null {
  switch (actionType) {
    case "pause":
    case "pause_adset":
    case "pause_ad":
      if (entityType === "campaign") return { metaAction: "PAUSED", description: "Campanha pausada" };
      if (entityType === "adset") return { metaAction: "PAUSED", description: "Conjunto pausado" };
      if (entityType === "ad") return { metaAction: "PAUSED", description: "Anúncio pausado" };
      return null;
    case "activate":
      if (entityType === "campaign") return { metaAction: "ACTIVE", description: "Campanha ativada" };
      if (entityType === "adset") return { metaAction: "ACTIVE", description: "Conjunto ativado" };
      if (entityType === "ad") return { metaAction: "ACTIVE", description: "Anúncio ativado" };
      return null;
    case "increase_budget":
      return { metaAction: "increase_budget", description: "Orçamento aumentado em 20%" };
    case "decrease_budget":
      return { metaAction: "decrease_budget", description: "Orçamento diminuído em 20%" };
    default:
      return null;
  }
}

async function executeAction(
  accessToken: string,
  entity: MetaEntity,
  actionInfo: { metaAction: string; description: string }
): Promise<boolean> {
  try {
    if (actionInfo.metaAction === "PAUSED" || actionInfo.metaAction === "ACTIVE") {
      const url = `${BASE_URL}/${entity.id}?access_token=${accessToken}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: actionInfo.metaAction }),
      });
      const data = await response.json();
      return !data.error;
    }

    if (actionInfo.metaAction === "increase_budget" || actionInfo.metaAction === "decrease_budget") {
      const currentBudget = entity.daily_budget
        ? parseFloat(entity.daily_budget)
        : entity.lifetime_budget
        ? parseFloat(entity.lifetime_budget)
        : null;

      if (!currentBudget) return false;

      const multiplier = actionInfo.metaAction === "increase_budget" ? 1.2 : 0.8;
      const newBudget = Math.round(currentBudget * multiplier);
      const budgetField = entity.daily_budget ? "daily_budget" : "lifetime_budget";

      const url = `${BASE_URL}/${entity.id}?access_token=${accessToken}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [budgetField]: newBudget.toString() }),
      });
      const data = await response.json();
      return !data.error;
    }

    return false;
  } catch (err) {
    console.error(`Error executing action on ${entity.id}:`, err);
    return false;
  }
}

async function processRulesForUser(
  supabase: any,
  userId: string,
  rules: AutomationRule[],
  forceExecute: boolean
): Promise<Array<{ ruleName: string; entityName: string; action: string; success: boolean }>> {
  // Get Meta connection
  const { data: connection } = await supabase
    .from("meta_connections")
    .select("access_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection?.access_token) return [];

  // Get active ad accounts
  const { data: accounts } = await supabase
    .from("meta_ad_accounts")
    .select("account_id")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!accounts || accounts.length === 0) return [];

  const accessToken = connection.access_token;
  const executionResults: Array<{ ruleName: string; entityName: string; action: string; success: boolean }> = [];

  for (const rule of rules) {
    // Check frequency timing (skip if called from cron and not due yet)
    if (!forceExecute && !shouldExecuteRule(rule)) continue;

    const { entityType, statusFilter } = getEntityTypeAndStatus(rule.applied_to);
    const actionInfo = getActionForEntityType(rule.action_type, entityType);
    if (!actionInfo) continue;

    let ruleAffected = 0;
    let ruleSuccess = true;

    for (const account of accounts) {
      try {
        const entities = await fetchEntitiesWithInsights(
          accessToken,
          account.account_id.startsWith("act_") ? account.account_id : `act_${account.account_id}`,
          entityType,
          statusFilter
        );

        for (const { entity, spent, cpa, roi } of entities) {
          if (!evaluateCondition(rule.condition_type, rule.condition_value, spent, cpa, roi)) {
            continue;
          }

          const success = await executeAction(accessToken, entity, actionInfo);

          if (success) {
            ruleAffected++;
            await supabase.from("rule_execution_logs").insert({
              rule_id: rule.id,
              user_id: userId,
              rule_name: rule.name,
              campaign_name: entity.name,
              action_description: `${actionInfo.description}: ${entity.name}`,
              action_type: rule.action_type,
            });
          } else {
            ruleSuccess = false;
          }

          executionResults.push({
            ruleName: rule.name,
            entityName: entity.name,
            action: actionInfo.description,
            success,
          });
        }
      } catch (err) {
        ruleSuccess = false;
        console.error(`Error processing rule ${rule.name} for account ${account.account_id}:`, err);
      }
    }

    // Update rule with execution result
    const resultStatus = ruleAffected > 0 ? (ruleSuccess ? "success" : "partial") : "no_match";
    await supabase
      .from("automation_rules")
      .update({
        executions: rule.executions + ruleAffected,
        last_execution: new Date().toISOString(),
        last_execution_result: resultStatus,
        last_execution_affected: ruleAffected,
      })
      .eq("id", rule.id);
  }

  return executionResults;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body ok for cron */ }
    const isCron = !!body.cron;

    if (isCron) {
      // Cron mode: process all users with active rules
      console.log("Cron execution started");

      const { data: allRules } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("is_active", true);

      if (!allRules || allRules.length === 0) {
        return new Response(
          JSON.stringify({ message: "No active rules", executed: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Group rules by user
      const rulesByUser = new Map<string, AutomationRule[]>();
      for (const rule of allRules as AutomationRule[]) {
        const existing = rulesByUser.get(rule.user_id) || [];
        existing.push(rule);
        rulesByUser.set(rule.user_id, existing);
      }

      let totalExecuted = 0;
      for (const [userId, userRules] of rulesByUser) {
        try {
          const results = await processRulesForUser(supabase, userId, userRules, false);
          totalExecuted += results.length;
        } catch (err) {
          console.error(`Error processing rules for user ${userId}:`, err);
        }
      }

      console.log(`Cron execution completed. Total actions: ${totalExecuted}`);
      return new Response(
        JSON.stringify({ executed: totalExecuted }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Manual mode: requires auth
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rules } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma regra ativa", executed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const executionResults = await processRulesForUser(supabase, user.id, rules as AutomationRule[], true);

    return new Response(
      JSON.stringify({ executed: executionResults.length, results: executionResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Execute rules error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
