import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MetaApiError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
  is_transient?: boolean;
};

type MetaPayload = Record<string, unknown> & {
  error?: MetaApiError;
};

function formatMetaErrorMessage(error: MetaApiError): string {
  const baseMessage = error.message || "Erro desconhecido da Meta API";
  const details = [
    typeof error.code === "number" ? `code=${error.code}` : null,
    typeof error.error_subcode === "number" ? `error_subcode=${error.error_subcode}` : null,
    error.error_user_title ? `error_user_title=${error.error_user_title}` : null,
  ].filter(Boolean);

  return details.length ? `${baseMessage} (${details.join(", ")})` : baseMessage;
}

function logMetaError(context: string, payload: MetaPayload | null): void {
  if (!payload?.error) return;

  console.error(`${context}:`, JSON.stringify({
    message: payload.error.message,
    type: payload.error.type,
    code: payload.error.code,
    error_subcode: payload.error.error_subcode,
    error_user_title: payload.error.error_user_title,
    error_user_msg: payload.error.error_user_msg,
    fbtrace_id: payload.error.fbtrace_id,
    is_transient: payload.error.is_transient,
  }));
}

function getMetaErrorMessage(payload: MetaPayload | null): string | null {
  if (!payload?.error) return null;
  return formatMetaErrorMessage(payload.error);
}

function isRateLimitMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return msg.includes("too many calls") || msg.includes("request limit") || msg.includes("rate limit");
}

async function fetchAllPages(url: string, maxRetries = 4): Promise<unknown[]> {
  const allData: unknown[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    let data: MetaPayload | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(nextUrl);
      data = await response.json() as MetaPayload;

      const errorMessage = getMetaErrorMessage(data);
      if (!errorMessage) break;

      logMetaError("Meta API fetch error", data);
      if (!isRateLimitMessage(errorMessage) || attempt === maxRetries) {
        throw new Error(errorMessage);
      }

      const delay = 5000 * Math.pow(2, attempt);
      console.log(`Rate limited, retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delay));
      data = null;
    }

    if (!data) {
      throw new Error("Resposta inválida da Meta API");
    }

    if (data.data) {
      allData.push(...(data.data as unknown[]));
    }

    nextUrl = (data.paging as { next?: string } | undefined)?.next || null;
  }

  return allData;
}

async function postFormWithRetry(url: string, params: URLSearchParams, maxRetries = 4): Promise<MetaPayload> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json() as MetaPayload;
    const errorMessage = getMetaErrorMessage(data) || (!response.ok ? `Meta API HTTP ${response.status}` : null);

    if (!errorMessage) {
      return data;
    }

    const safeParams = new URLSearchParams(params);
    safeParams.delete("access_token");
    logMetaError("Meta API POST error", data);
    console.error("Meta API POST context:", JSON.stringify({
      url,
      params: Object.fromEntries(safeParams.entries()),
      status: response.status,
      attempt: attempt + 1,
    }));

    if (!isRateLimitMessage(errorMessage) || attempt === maxRetries) {
      throw new Error(errorMessage);
    }

    const delay = 5000 * Math.pow(2, attempt);
    console.log(`Rate limited on POST, retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, delay));
  }

  throw new Error("Falha ao processar requisição na Meta API");
}

function extractCopiedAdSetId(payload: MetaPayload): string | null {
  if (typeof payload.copied_adset_id === "string") {
    return payload.copied_adset_id;
  }

  const adObjectIds = payload.ad_object_ids;
  if (!Array.isArray(adObjectIds)) return null;

  const adSetObject = adObjectIds.find((item) => {
    const typedItem = item as { ad_object_type?: string; copied_id?: string };
    return typedItem.ad_object_type === "ad_set" && typeof typedItem.copied_id === "string";
  }) as { copied_id?: string } | undefined;

  return adSetObject?.copied_id || null;
}

async function fetchSourceAdAdSetId(baseUrl: string, adId: string, accessToken: string): Promise<string | null> {
  const adDetailsUrl = `${baseUrl}/${adId}?fields=adset_id&access_token=${accessToken}`;
  const response = await fetch(adDetailsUrl);
  const payload = await response.json() as MetaPayload;

  const errorMessage = getMetaErrorMessage(payload) || (!response.ok ? `Meta API HTTP ${response.status}` : null);
  if (errorMessage) {
    logMetaError("Meta API ad lookup error", payload);
    throw new Error(errorMessage);
  }

  if (typeof payload.adset_id === "string") {
    return payload.adset_id;
  }

  if (payload.adset_id && typeof payload.adset_id === "object") {
    const nestedId = (payload.adset_id as { id?: unknown }).id;
    if (typeof nestedId === "string") {
      return nestedId;
    }
  }

  return null;
}

type AdFallbackData = {
  adsetId: string;
  creativeId: string;
  name: string;
  status: string | null;
  adAccountId: string | null;
};

function isCreativeEnhancementError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("error_subcode=3858504") ||
    normalizedMessage.includes("aprimoramentos padrão") ||
    normalizedMessage.includes("default enhancements")
  );
}

function normalizeMetaAccountId(accountId: unknown): string | null {
  if (typeof accountId === "string" && accountId.trim().length > 0) {
    return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  }

  if (typeof accountId === "number") {
    return `act_${accountId}`;
  }

  return null;
}

function buildCopyName(baseName: string, copyIndex: number, totalCopies: number): string {
  if (totalCopies > 1) {
    return `${baseName} - Copy ${copyIndex + 1}`;
  }
  return `${baseName} - Copy`;
}

async function fetchAdSetAccountId(baseUrl: string, adsetId: string, accessToken: string): Promise<string | null> {
  const adsetUrl = `${baseUrl}/${adsetId}?fields=account_id&access_token=${accessToken}`;
  const response = await fetch(adsetUrl);
  const payload = await response.json() as MetaPayload;

  const errorMessage = getMetaErrorMessage(payload) || (!response.ok ? `Meta API HTTP ${response.status}` : null);
  if (errorMessage) {
    logMetaError("Meta API adset account lookup error", payload);
    return null;
  }

  return normalizeMetaAccountId(payload.account_id);
}

async function fetchAdFallbackData(baseUrl: string, adId: string, accessToken: string): Promise<AdFallbackData> {
  const fields = ["name", "status", "adset_id", "creative{id}", "account_id"].join(",");
  const adDetailsUrl = `${baseUrl}/${adId}?fields=${fields}&access_token=${accessToken}`;
  const response = await fetch(adDetailsUrl);
  const payload = await response.json() as MetaPayload;

  const errorMessage = getMetaErrorMessage(payload) || (!response.ok ? `Meta API HTTP ${response.status}` : null);
  if (errorMessage) {
    logMetaError("Meta API ad fallback lookup error", payload);
    throw new Error(errorMessage);
  }

  const adsetId = typeof payload.adset_id === "string"
    ? payload.adset_id
    : (payload.adset_id as { id?: unknown } | null)?.id;

  const creativeId = (payload.creative as { id?: unknown } | null)?.id;
  const adName = typeof payload.name === "string" ? payload.name : "Ad";
  const adStatus = typeof payload.status === "string" ? payload.status : null;

  if (typeof adsetId !== "string" || !adsetId) {
    throw new Error("Não foi possível identificar o adset_id do anúncio de origem");
  }

  if (typeof creativeId !== "string" || !creativeId) {
    throw new Error("Não foi possível identificar o creative_id do anúncio de origem");
  }

  const adAccountId = normalizeMetaAccountId(payload.account_id) || await fetchAdSetAccountId(baseUrl, adsetId, accessToken);

  return {
    adsetId,
    creativeId,
    name: adName,
    status: adStatus,
    adAccountId,
  };
}

async function createAdCopyFromCreative(
  baseUrl: string,
  adAccountId: string,
  accessToken: string,
  sourceAdData: AdFallbackData,
  copyIndex: number,
  totalCopies: number,
  statusOption?: string,
): Promise<MetaPayload> {
  const createEndpoint = `${baseUrl}/${adAccountId}/ads`;
  const fallbackStatus = statusOption === "ACTIVE" || statusOption === "PAUSED"
    ? statusOption
    : (sourceAdData.status === "ACTIVE" ? "ACTIVE" : "PAUSED");

  const params = new URLSearchParams();
  params.set("access_token", accessToken);
  params.set("name", buildCopyName(sourceAdData.name, copyIndex, totalCopies));
  params.set("adset_id", sourceAdData.adsetId);
  params.set("creative", JSON.stringify({ creative_id: sourceAdData.creativeId }));
  params.set("status", fallbackStatus);

  console.log("Using ad fallback duplication with creative_id", JSON.stringify({
    adAccountId,
    adsetId: sourceAdData.adsetId,
    creativeId: sourceAdData.creativeId,
    fallbackStatus,
  }));

  const createdAd = await postFormWithRetry(createEndpoint, params);
  return {
    ...createdAd,
    fallback_strategy: "create_from_existing_creative_id",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, adAccountId, campaignId, adsetId, adId, dateRange, dateSince, dateUntil, updates, sourceId, copies, type, statusOption, scheduledDate } = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Access token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = "https://graph.facebook.com/v21.0";

    if (action === "get-campaigns") {
      const fields = [
        "id",
        "name",
        "status",
        "objective",
        "daily_budget",
        "lifetime_budget",
        "created_time",
        "updated_time"
      ].join(",");

      const url = `${baseUrl}/${adAccountId}/campaigns?fields=${fields}&limit=500&access_token=${accessToken}`;
      const campaigns = await fetchAllPages(url);

      return new Response(
        JSON.stringify({ campaigns }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-campaign-insights") {
      const fields = [
        "campaign_id",
        "campaign_name",
        "spend",
        "impressions",
        "clicks",
        "cpc",
        "cpm",
        "ctr",
        "reach",
        "frequency",
        "actions",
        "action_values",
        "cost_per_action_type",
        "video_3_sec_watched_actions",
        "video_p25_watched_actions",
        "video_p50_watched_actions",
        "video_p75_watched_actions",
        "video_p100_watched_actions"
      ].join(",");

      let dateParams = '';
      if (dateSince && dateUntil) {
        dateParams = `&time_range={"since":"${dateSince}","until":"${dateUntil}"}`;
      } else {
        dateParams = `&date_preset=${dateRange || "today"}`;
      }
      const url = `${baseUrl}/${adAccountId}/insights?` +
        `fields=${fields}` +
        `&level=campaign` +
        dateParams +
        `&limit=500` +
        `&access_token=${accessToken}`;

      const insights = await fetchAllPages(url);

      return new Response(
        JSON.stringify({ insights }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-adsets") {
      const fields = [
        "id",
        "name",
        "status",
        "daily_budget",
        "lifetime_budget",
        "targeting",
        "optimization_goal",
        "campaign_id"
      ].join(",");

      const url = `${baseUrl}/${adAccountId}/adsets?fields=${fields}&limit=500&access_token=${accessToken}`;
      const adsets = await fetchAllPages(url);

      return new Response(
        JSON.stringify({ adsets }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-adsets-with-insights") {
      const entityFields = [
        "id", "name", "status", "daily_budget", "lifetime_budget",
        "targeting", "optimization_goal", "campaign_id"
      ].join(",");
      const insightFields = [
        "adset_id", "adset_name", "spend", "impressions", "clicks",
        "cpc", "cpm", "ctr", "reach", "frequency", "actions",
        "action_values", "cost_per_action_type",
        "video_3_sec_watched_actions", "video_p25_watched_actions", "video_p50_watched_actions",
        "video_p75_watched_actions", "video_p100_watched_actions"
      ].join(",");

      let dateParams = '';
      if (dateSince && dateUntil) {
        dateParams = `&time_range={"since":"${dateSince}","until":"${dateUntil}"}`;
      } else {
        dateParams = `&date_preset=${dateRange || "today"}`;
      }

      const entityUrl = `${baseUrl}/${adAccountId}/adsets?fields=${entityFields}&limit=500&access_token=${accessToken}`;
      const insightsUrl = `${baseUrl}/${adAccountId}/insights?fields=${insightFields}&level=adset${dateParams}&limit=500&access_token=${accessToken}`;

      const [adsets, insights] = await Promise.all([
        fetchAllPages(entityUrl),
        fetchAllPages(insightsUrl).catch((err) => {
          console.error("Adset insights fetch failed (non-blocking):", err.message);
          return [];
        }),
      ]);

      return new Response(
        JSON.stringify({ adsets, insights }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-adset-insights") {
      const fields = [
        "adset_id",
        "adset_name",
        "spend",
        "impressions",
        "clicks",
        "cpc",
        "cpm",
        "ctr",
        "reach",
        "frequency",
        "actions",
        "action_values",
        "cost_per_action_type",
        "video_3_sec_watched_actions",
        "video_p25_watched_actions",
        "video_p50_watched_actions",
        "video_p75_watched_actions",
        "video_p100_watched_actions"
      ].join(",");
      
      let dateParams = '';
      if (dateSince && dateUntil) {
        dateParams = `&time_range={"since":"${dateSince}","until":"${dateUntil}"}`;
      } else {
        dateParams = `&date_preset=${dateRange || "today"}`;
      }
      const url = `${baseUrl}/${adAccountId}/insights?fields=${fields}&level=adset${dateParams}&limit=500&access_token=${accessToken}`;
      const insights = await fetchAllPages(url);

      return new Response(
        JSON.stringify({ insights }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-ad-insights") {
      const fields = [
        "ad_id",
        "ad_name",
        "spend",
        "impressions",
        "clicks",
        "cpc",
        "cpm",
        "ctr",
        "reach",
        "frequency",
        "actions",
        "action_values",
        "cost_per_action_type",
        "video_3_sec_watched_actions",
        "video_p25_watched_actions",
        "video_p50_watched_actions",
        "video_p75_watched_actions",
        "video_p100_watched_actions"
      ].join(",");
      
      let dateParams = '';
      if (dateSince && dateUntil) {
        dateParams = `&time_range={"since":"${dateSince}","until":"${dateUntil}"}`;
      } else {
        dateParams = `&date_preset=${dateRange || "today"}`;
      }
      const url = `${baseUrl}/${adAccountId}/insights?fields=${fields}&level=ad${dateParams}&limit=500&access_token=${accessToken}`;
      const insights = await fetchAllPages(url);

      return new Response(
        JSON.stringify({ insights }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-ads-with-insights") {
      const entityFields = [
        "id", "name", "status", "creative", "adset_id"
      ].join(",");
      const insightFields = [
        "ad_id", "ad_name", "spend", "impressions", "clicks",
        "cpc", "cpm", "ctr", "reach", "frequency", "actions",
        "action_values", "cost_per_action_type",
        "video_p25_watched_actions", "video_p50_watched_actions",
        "video_p75_watched_actions", "video_p100_watched_actions"
      ].join(",");

      let dateParams = '';
      if (dateSince && dateUntil) {
        dateParams = `&time_range={"since":"${dateSince}","until":"${dateUntil}"}`;
      } else {
        dateParams = `&date_preset=${dateRange || "today"}`;
      }

      const entityUrl = `${baseUrl}/${adAccountId}/ads?fields=${entityFields}&limit=500&access_token=${accessToken}`;
      const insightsUrl = `${baseUrl}/${adAccountId}/insights?fields=${insightFields}&level=ad${dateParams}&limit=500&access_token=${accessToken}`;

      const [ads, insights] = await Promise.all([
        fetchAllPages(entityUrl),
        fetchAllPages(insightsUrl).catch((err) => {
          console.error("Ad insights fetch failed (non-blocking):", err.message);
          return [];
        }),
      ]);

      return new Response(
        JSON.stringify({ ads, insights }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-ads") {
      const fields = [
        "id",
        "name",
        "status",
        "creative",
        "adset_id"
      ].join(",");

      const url = `${baseUrl}/${adAccountId}/ads?fields=${fields}&limit=500&access_token=${accessToken}`;
      const ads = await fetchAllPages(url);

      return new Response(
        JSON.stringify({ ads }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update-campaign") {
      if (!campaignId || !updates) {
        return new Response(
          JSON.stringify({ error: "Campaign ID and updates are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = `${baseUrl}/${campaignId}?access_token=${accessToken}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await response.json();

      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "pause-campaign") {
      const url = `${baseUrl}/${campaignId}?access_token=${accessToken}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAUSED" })
      });
      const data = await response.json();

      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "activate-campaign") {
      const url = `${baseUrl}/${campaignId}?access_token=${accessToken}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" })
      });
      const data = await response.json();

      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update-adset") {
      if (!adsetId || !updates) {
        return new Response(JSON.stringify({ error: "Adset ID and updates are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const url = `${baseUrl}/${adsetId}?access_token=${accessToken}`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      const data = await response.json();
      if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "pause-adset") {
      const url = `${baseUrl}/${adsetId}?access_token=${accessToken}`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PAUSED" }) });
      const data = await response.json();
      if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "activate-adset") {
      const url = `${baseUrl}/${adsetId}?access_token=${accessToken}`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ACTIVE" }) });
      const data = await response.json();
      if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update-ad") {
      if (!adId || !updates) {
        return new Response(JSON.stringify({ error: "Ad ID and updates are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const url = `${baseUrl}/${adId}?access_token=${accessToken}`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      const data = await response.json();
      if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "pause-ad") {
      const url = `${baseUrl}/${adId}?access_token=${accessToken}`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PAUSED" }) });
      const data = await response.json();
      if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "activate-ad") {
      const url = `${baseUrl}/${adId}?access_token=${accessToken}`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ACTIVE" }) });
      const data = await response.json();
      if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "duplicate-campaign") {
      const entityType = (type || "campaign") as "campaign" | "adset" | "ad";
      const numCopies = Math.max(1, Number(copies) || 1);
      const sourceEntityId = sourceId || campaignId || adsetId || adId;

      if (!sourceEntityId) {
        return new Response(JSON.stringify({ error: "Source ID is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const results: MetaPayload[] = [];
      const isParentEntity = entityType === "campaign" || entityType === "adset";
      const sourceAdSetId = entityType === "ad"
        ? await fetchSourceAdAdSetId(baseUrl, sourceEntityId, accessToken)
        : null;
      let sourceAdFallbackData: AdFallbackData | null = null;

      for (let i = 0; i < numCopies; i++) {
        const params = new URLSearchParams();
        params.set("access_token", accessToken);

        // `status_option` and `start_time` are valid for parent entity copy flows.
        // For ad copies, sending these fields can trigger Meta "Invalid parameter".
        if (isParentEntity) {
          params.set("status_option", statusOption || "INHERITED_FROM_SOURCE");
          params.set("deep_copy", "true");

          if (scheduledDate) {
            params.set("start_time", scheduledDate);
          }
        }

        if (entityType === "ad") {
          if (sourceAdSetId) {
            params.set("adset_id", sourceAdSetId);
          }
          params.set("rename_options", JSON.stringify({ rename_suffix: " - Copy" }));
        }

        console.log(`Duplicating ${entityType} ${sourceEntityId}, attempt ${i + 1}/${numCopies}`);
        const copyEndpoint = `${baseUrl}/${sourceEntityId}/copies`;

        // Helper to log duplication audit
        const logDuplication = async (log: {
          newEntityId?: string;
          strategy: string;
          success: boolean;
          metaErrorCode?: number;
          metaErrorSubcode?: number;
          metaErrorMessage?: string;
        }) => {
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const sb = createClient(supabaseUrl, supabaseKey);

            // Extract user_id from the authorization header
            const authHeader = req.headers.get("authorization");
            let userId: string | null = null;
            if (authHeader) {
              const { data: { user } } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
              userId = user?.id || null;
            }

            if (userId) {
              await sb.from("duplication_logs").insert({
                user_id: userId,
                source_entity_id: sourceEntityId,
                entity_type: entityType,
                new_entity_id: log.newEntityId || null,
                strategy: log.strategy,
                success: log.success,
                meta_error_code: log.metaErrorCode || null,
                meta_error_subcode: log.metaErrorSubcode || null,
                meta_error_message: log.metaErrorMessage || null,
              });
            }
          } catch (logErr) {
            console.error("Failed to write duplication audit log:", logErr);
          }
        };

        const isCopyTooLargeError = (msg: string) =>
          msg.includes("1885194") || msg.toLowerCase().includes("cópia é muito grande") || msg.toLowerCase().includes("copy request is too large");

        try {
          const copiedEntity = await postFormWithRetry(copyEndpoint, params);
          console.log("Copy response:", JSON.stringify(copiedEntity));
          results.push(copiedEntity);

          const newId = typeof copiedEntity.id === "string" ? copiedEntity.id
            : (copiedEntity.copied_adset_id as string) || (copiedEntity.ad_object_ids as Array<{copied_id?: string}>)?.[0]?.copied_id || undefined;
          await logDuplication({ newEntityId: newId, strategy: "copies_endpoint", success: true });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);

          // For campaigns/adsets: if deep_copy is too large, retry without deep_copy
          if (isParentEntity && isCopyTooLargeError(message)) {
            console.warn(`Deep copy too large for ${entityType} ${sourceEntityId}, retrying without deep_copy`);
            const shallowParams = new URLSearchParams();
            shallowParams.set("access_token", accessToken);
            shallowParams.set("status_option", statusOption || "INHERITED_FROM_SOURCE");
            if (scheduledDate) {
              shallowParams.set("start_time", scheduledDate);
            }
            // No deep_copy param = shallow copy

            try {
              const copiedEntity = await postFormWithRetry(copyEndpoint, shallowParams);
              console.log("Shallow copy response:", JSON.stringify(copiedEntity));
              results.push(copiedEntity);

              const newId = typeof copiedEntity.id === "string" ? copiedEntity.id
                : extractCopiedAdSetId(copiedEntity) || undefined;
              await logDuplication({ newEntityId: newId, strategy: "shallow_copy_fallback", success: true, metaErrorSubcode: 1885194, metaErrorMessage: message });

              // For adsets: after shallow copy, manually duplicate all ads from the source adset into the new one
              if (entityType === "adset" && newId) {
                console.log(`Shallow copy created adset ${newId}, now duplicating ads from source ${sourceEntityId}`);
                try {
                  const adsUrl = `${baseUrl}/${sourceEntityId}/ads?fields=id,name,status,creative&limit=500&access_token=${accessToken}`;
                  const sourceAds = await fetchAllPages(adsUrl) as Array<{ id: string; name?: string; status?: string; creative?: { id?: string } }>;
                  console.log(`Found ${sourceAds.length} ads to duplicate into new adset ${newId}`);

                  for (const ad of sourceAds) {
                    try {
                      // Try native copy first
                      const adCopyParams = new URLSearchParams();
                      adCopyParams.set("access_token", accessToken);
                      adCopyParams.set("adset_id", newId);
                      adCopyParams.set("rename_options", JSON.stringify({ rename_suffix: " - Copy" }));
                      const adCopyEndpoint = `${baseUrl}/${ad.id}/copies`;
                      const adCopied = await postFormWithRetry(adCopyEndpoint, adCopyParams);
                      console.log(`Ad ${ad.id} copied to new adset:`, JSON.stringify(adCopied));
                    } catch (adCopyErr: unknown) {
                      const adMsg = adCopyErr instanceof Error ? adCopyErr.message : String(adCopyErr);
                      console.warn(`Native ad copy failed for ${ad.id}, trying creative fallback:`, adMsg);
                      // Fallback: create ad from creative
                      if (ad.creative?.id) {
                        const resolvedAccountId = adAccountId || await fetchAdSetAccountId(baseUrl, sourceEntityId, accessToken);
                        if (resolvedAccountId) {
                          const fallbackData: AdFallbackData = {
                            adsetId: newId,
                            creativeId: ad.creative.id,
                            name: ad.name || "Ad",
                            status: ad.status || null,
                            adAccountId: resolvedAccountId,
                          };
                          const createdAd = await createAdCopyFromCreative(baseUrl, resolvedAccountId, accessToken, fallbackData, 0, 1, statusOption);
                          console.log(`Ad ${ad.id} recreated via creative fallback:`, JSON.stringify(createdAd));
                        } else {
                          console.error(`Cannot fallback-copy ad ${ad.id}: no account_id available`);
                        }
                      } else {
                        console.error(`Cannot fallback-copy ad ${ad.id}: no creative_id`);
                      }
                    }
                  }
                } catch (adsErr: unknown) {
                  console.error("Failed to duplicate ads after shallow adset copy:", adsErr);
                }
              }

              continue;
            } catch (shallowError: unknown) {
              const shallowMsg = shallowError instanceof Error ? shallowError.message : String(shallowError);
              console.error("Shallow copy also failed:", shallowMsg);
              await logDuplication({ strategy: "shallow_copy_fallback", success: false, metaErrorSubcode: 1885194, metaErrorMessage: shallowMsg });
              throw shallowError;
            }
          }

          if (entityType === "ad" && isCreativeEnhancementError(message)) {
            if (!sourceAdFallbackData) {
              sourceAdFallbackData = await fetchAdFallbackData(baseUrl, sourceEntityId, accessToken);
            }

            const resolvedAdAccountId = adAccountId || sourceAdFallbackData.adAccountId;
            if (!resolvedAdAccountId) {
              throw new Error("Não foi possível identificar a conta de anúncios para concluir a duplicação");
            }

            console.warn("Meta copy failed with deprecated creative enhancements, applying fallback strategy", JSON.stringify({
              sourceEntityId,
              adAccountId: resolvedAdAccountId,
              message,
            }));

            const fallbackCopiedEntity = await createAdCopyFromCreative(
              baseUrl,
              resolvedAdAccountId,
              accessToken,
              sourceAdFallbackData,
              i,
              numCopies,
              statusOption,
            );

            console.log("Fallback copy response:", JSON.stringify(fallbackCopiedEntity));
            results.push(fallbackCopiedEntity);

            const newId = typeof fallbackCopiedEntity.id === "string" ? fallbackCopiedEntity.id : undefined;
            await logDuplication({
              newEntityId: newId,
              strategy: "create_from_existing_creative_id",
              success: true,
              metaErrorCode: 100,
              metaErrorSubcode: 3858504,
              metaErrorMessage: message,
            });
            continue;
          }

          await logDuplication({
            strategy: "copies_endpoint",
            success: false,
            metaErrorMessage: message,
          });
          throw error;
        }
      }

      return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete-campaign") {
      const entityId = campaignId || adsetId || adId;
      if (!entityId) {
        return new Response(JSON.stringify({ error: "Entity ID is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const url = `${baseUrl}/${entityId}?access_token=${accessToken}`;
      const response = await fetch(url, { method: "DELETE" });
      const data = await response.json();
      if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Meta Ads API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});