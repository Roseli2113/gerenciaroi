import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fetch all ad accounts: personal (/me/adaccounts) + from Business Managers (/me/businesses -> owned_ad_accounts)
const fetchAllAdAccounts = async (accessToken: string) => {
  const accountsMap = new Map<string, any>();

  // 1. Personal ad accounts
  let url: string | null = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&limit=100&access_token=${accessToken}`;
  while (url) {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data?.data) {
      for (const acc of data.data) {
        accountsMap.set(acc.id, acc);
      }
    }
    url = data?.paging?.next || null;
  }

  // 2. Business Manager ad accounts
  let bmUrl: string | null = `https://graph.facebook.com/v18.0/me/businesses?fields=id,name&limit=100&access_token=${accessToken}`;
  while (bmUrl) {
    const bmResp = await fetch(bmUrl);
    const bmData = await bmResp.json();
    if (bmData?.data) {
      // Fetch owned_ad_accounts for each BM in parallel
      const bmFetches = bmData.data.map(async (bm: any) => {
        let bmAccUrl: string | null = `https://graph.facebook.com/v18.0/${bm.id}/owned_ad_accounts?fields=id,name,account_status,currency,timezone_name&limit=100&access_token=${accessToken}`;
        while (bmAccUrl) {
          try {
            const accResp = await fetch(bmAccUrl);
            const accData = await accResp.json();
            if (accData?.data) {
              for (const acc of accData.data) {
                accountsMap.set(acc.id, acc);
              }
            }
            bmAccUrl = accData?.paging?.next || null;
          } catch {
            bmAccUrl = null;
          }
        }

        // Also fetch client_ad_accounts (accounts managed by this BM)
        let clientUrl: string | null = `https://graph.facebook.com/v18.0/${bm.id}/client_ad_accounts?fields=id,name,account_status,currency,timezone_name&limit=100&access_token=${accessToken}`;
        while (clientUrl) {
          try {
            const clientResp = await fetch(clientUrl);
            const clientData = await clientResp.json();
            if (clientData?.data) {
              for (const acc of clientData.data) {
                accountsMap.set(acc.id, acc);
              }
            }
            clientUrl = clientData?.paging?.next || null;
          } catch {
            clientUrl = null;
          }
        }
      });
      await Promise.all(bmFetches);
    }
    bmUrl = bmData?.paging?.next || null;
  }

  return Array.from(accountsMap.values());
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, redirectUri, accessToken: providedAccessToken } = await req.json();

    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");

    if (!META_APP_ID || !META_APP_SECRET) {
      return new Response(
        JSON.stringify({ 
          error: "Meta App credentials not configured",
          message: "Por favor, configure META_APP_ID e META_APP_SECRET nos secrets do projeto."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-auth-url") {
      const scopes = [
        "ads_read",
        "ads_management",
        "business_management",
        "pages_read_engagement"
      ].join(",");

      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&response_type=code`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchange-code") {
      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${META_APP_SECRET}` +
        `&code=${code}`;

      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(
          JSON.stringify({ error: tokenData.error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${META_APP_ID}` +
        `&client_secret=${META_APP_SECRET}` +
        `&fb_exchange_token=${tokenData.access_token}`;

      const longLivedResponse = await fetch(longLivedUrl);
      const longLivedData = await longLivedResponse.json();

      if (longLivedData.error) {
        return new Response(
          JSON.stringify({ error: longLivedData.error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userUrl = `https://graph.facebook.com/v18.0/me?` +
        `fields=id,name,email` +
        `&access_token=${longLivedData.access_token}`;

      const userResponse = await fetch(userUrl);
      const userData = await userResponse.json();

      // Fetch ALL ad accounts (personal + BM)
      const allAdAccounts = await fetchAllAdAccounts(longLivedData.access_token);
      console.log(`Total ad accounts fetched (personal + BM): ${allAdAccounts.length}`);

      return new Response(
        JSON.stringify({
          accessToken: longLivedData.access_token,
          expiresIn: longLivedData.expires_in,
          user: userData,
          adAccounts: allAdAccounts
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refresh-accounts") {
      if (!providedAccessToken) {
        return new Response(
          JSON.stringify({ error: "Access token required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const allAccounts = await fetchAllAdAccounts(providedAccessToken);
      console.log(`Refresh: Total ad accounts fetched (personal + BM): ${allAccounts.length}`);

      return new Response(
        JSON.stringify({ adAccounts: allAccounts }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Meta auth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
