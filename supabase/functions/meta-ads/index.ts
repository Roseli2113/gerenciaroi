import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchAllPages(url: string): Promise<any[]> {
  const allData: any[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (data.data) {
      allData.push(...data.data);
    }

    // Check for pagination
    nextUrl = data.paging?.next || null;
  }

  return allData;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, adAccountId, campaignId, adsetId, adId, dateRange, updates, sourceId, copies, type } = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Access token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = "https://graph.facebook.com/v18.0";

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

      const datePreset = dateRange || "today";
      const url = `${baseUrl}/${adAccountId}/insights?` +
        `fields=${fields}` +
        `&level=campaign` +
        `&date_preset=${datePreset}` +
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
      
      const datePreset = dateRange || "today";
      const url = `${baseUrl}/${adAccountId}/insights?fields=${fields}&level=adset&date_preset=${datePreset}&limit=500&access_token=${accessToken}`;
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
      
      const datePreset = dateRange || "today";
      const url = `${baseUrl}/${adAccountId}/insights?fields=${fields}&level=ad&date_preset=${datePreset}&limit=500&access_token=${accessToken}`;
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
      const entityType = type || 'campaign';
      const numCopies = copies || 1;
      const sourceEntityId = sourceId || campaignId;

      if (!sourceEntityId) {
        return new Response(JSON.stringify({ error: "Source ID is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Use the copies endpoint for campaigns/adsets
      const copyEndpoint = entityType === 'campaign' 
        ? `${baseUrl}/${sourceEntityId}/copies`
        : entityType === 'adset'
        ? `${baseUrl}/${sourceEntityId}/copies`
        : `${baseUrl}/${sourceEntityId}/copies`;

      const results = [];
      for (let i = 0; i < numCopies; i++) {
        const response = await fetch(`${copyEndpoint}?access_token=${accessToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status_option: "PAUSED",
          })
        });
        const data = await response.json();
        if (data.error) {
          return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        results.push(data);
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