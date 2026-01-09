import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, adAccountId, campaignId, adsetId, adId, dateRange, updates } = await req.json();

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

      const url = `${baseUrl}/${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ campaigns: data.data || [] }),
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
        "actions",
        "action_values",
        "cost_per_action_type"
      ].join(",");

      const datePreset = dateRange || "last_7d";
      const url = `${baseUrl}/${adAccountId}/insights?` +
        `fields=${fields}` +
        `&level=campaign` +
        `&date_preset=${datePreset}` +
        `&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ insights: data.data || [] }),
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
        "optimization_goal"
      ].join(",");

      const url = `${baseUrl}/${adAccountId}/adsets?fields=${fields}&access_token=${accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ adsets: data.data || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-adset-insights") {
      const fields = ["adset_id", "adset_name", "spend", "impressions", "clicks", "actions", "action_values"].join(",");
      const datePreset = dateRange || "last_7d";
      const url = `${baseUrl}/${adAccountId}/insights?fields=${fields}&level=adset&date_preset=${datePreset}&access_token=${accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ insights: data.data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get-ad-insights") {
      const fields = ["ad_id", "ad_name", "spend", "impressions", "clicks", "actions", "action_values"].join(",");
      const datePreset = dateRange || "last_7d";
      const url = `${baseUrl}/${adAccountId}/insights?fields=${fields}&level=ad&date_preset=${datePreset}&access_token=${accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ insights: data.data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get-ads") {
      const fields = [
        "id",
        "name",
        "status",
        "creative",
        "adset_id"
      ].join(",");

      const url = `${baseUrl}/${adAccountId}/ads?fields=${fields}&access_token=${accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ads: data.data || [] }),
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
