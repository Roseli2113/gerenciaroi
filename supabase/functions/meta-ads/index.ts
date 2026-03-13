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
};

function isCreativeEnhancementError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("error_subcode=3858504") ||
    normalizedMessage.includes("aprimoramentos padrão") ||
    normalizedMessage.includes("default enhancements")
  );
}

function buildCopyName(baseName: string, copyIndex: number, totalCopies: number): string {
  if (totalCopies > 1) {
    return `${baseName} - Copy ${copyIndex + 1}`;
  }
  return `${baseName} - Copy`;
}

async function fetchAdFallbackData(baseUrl: string, adId: string, accessToken: string): Promise<AdFallbackData> {
  const fields = ["name", "status", "adset_id", "creative{id}"].join(",");
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

  return {
    adsetId,
    creativeId,
    name: adName,
    status: adStatus,
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

        try {
          const copiedEntity = await postFormWithRetry(copyEndpoint, params);
          console.log("Copy response:", JSON.stringify(copiedEntity));
          results.push(copiedEntity);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);

          if (entityType === "ad" && isCreativeEnhancementError(message)) {
            if (!adAccountId) {
              throw new Error("Ad Account ID is required for fallback ad duplication");
            }

            console.warn("Meta copy failed with deprecated creative enhancements, applying fallback strategy", JSON.stringify({
              sourceEntityId,
              adAccountId,
              message,
            }));

            if (!sourceAdFallbackData) {
              sourceAdFallbackData = await fetchAdFallbackData(baseUrl, sourceEntityId, accessToken);
            }

            const fallbackCopiedEntity = await createAdCopyFromCreative(
              baseUrl,
              adAccountId,
              accessToken,
              sourceAdFallbackData,
              i,
              numCopies,
              statusOption,
            );

            console.log("Fallback copy response:", JSON.stringify(fallbackCopiedEntity));
            results.push(fallbackCopiedEntity);
            continue;
          }

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