import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type MetaAdAccount = {
  id: string;
  name: string;
  account_status: number;
  currency: string | null;
  timezone_name: string | null;
};

type MetaSyncStatus = {
  state: "not_connected" | "cached" | "live_synced" | "permissions_error" | "fetch_error";
  message?: string;
};

const fetchMetaAdAccounts = async (accessToken: string): Promise<MetaAdAccount[]> => {
  let allAccounts: MetaAdAccount[] = [];
  let url: string | null = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&limit=100&access_token=${accessToken}`;

  while (url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data?.error) {
      throw new Error(data?.error?.message || "Failed to fetch Meta ad accounts");
    }

    if (Array.isArray(data?.data)) {
      allAccounts = allAccounts.concat(data.data);
    }

    url = data?.paging?.next || null;
  }

  return allAccounts;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: authError,
    } = await anonClient.auth.getUser();

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData, error: roleError } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      throw roleError;
    }

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const targetUserId = body?.targetUserId;

    if (!targetUserId || typeof targetUserId !== "string") {
      return new Response(JSON.stringify({ error: "targetUserId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [
      metaConnectionRes,
      cachedAdAccountsRes,
      salesRes,
      webhooksRes,
      pixelsRes,
      rulesRes,
      credentialsRes,
    ] = await Promise.all([
      serviceClient
        .from("meta_connections")
        .select("id, meta_user_name, meta_user_email, expires_at, access_token")
        .eq("user_id", targetUserId)
        .maybeSingle(),
      serviceClient
        .from("meta_ad_accounts")
        .select("id, name, account_id, currency, account_status, timezone_name, is_active, created_at")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false }),
      serviceClient
        .from("sales")
        .select("id, amount, status, platform, product_name, customer_name, customer_email, created_at")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(50),
      serviceClient
        .from("webhooks")
        .select("id, name, platform, status, webhook_url, created_at")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false }),
      serviceClient
        .from("pixels")
        .select("id, name, pixel_type, status")
        .eq("user_id", targetUserId),
      serviceClient
        .from("automation_rules")
        .select("id, name, is_active, condition_type, action_type, executions, last_execution")
        .eq("user_id", targetUserId),
      serviceClient
        .from("api_credentials")
        .select("id, name, status, created_at")
        .eq("user_id", targetUserId),
    ]);

    const queryErrors = [
      metaConnectionRes.error,
      cachedAdAccountsRes.error,
      salesRes.error,
      webhooksRes.error,
      pixelsRes.error,
      rulesRes.error,
      credentialsRes.error,
    ].filter(Boolean);

    if (queryErrors.length > 0) {
      throw queryErrors[0];
    }

    let adAccounts = cachedAdAccountsRes.data || [];

    if (metaConnectionRes.data?.access_token) {
      try {
        const liveAdAccounts = await fetchMetaAdAccounts(metaConnectionRes.data.access_token);

        adAccounts = liveAdAccounts.map((acc) => ({
          id: acc.id,
          name: acc.name,
          account_id: acc.id,
          currency: acc.currency,
          account_status: acc.account_status,
          timezone_name: acc.timezone_name,
          is_active: adAccounts.some((cached) => cached.account_id === acc.id && cached.is_active),
          created_at: null,
        }));

        if (liveAdAccounts.length > 0) {
          const rowsToUpsert = liveAdAccounts.map((acc) => ({
            connection_id: metaConnectionRes.data!.id,
            user_id: targetUserId,
            account_id: acc.id,
            name: acc.name,
            account_status: acc.account_status,
            currency: acc.currency,
            timezone_name: acc.timezone_name,
            is_active: adAccounts.some((cached) => cached.account_id === acc.id && cached.is_active),
          }));

          const { error: upsertError } = await serviceClient
            .from("meta_ad_accounts")
            .upsert(rowsToUpsert, { onConflict: "connection_id,account_id" });

          if (upsertError) {
            console.error("Admin panel sync accounts error:", upsertError);
          }
        }
      } catch (metaFetchError) {
        console.error("Admin panel live Meta fetch error:", metaFetchError);
      }
    }

    const metaConnection = metaConnectionRes.data
      ? {
          id: metaConnectionRes.data.id,
          meta_user_name: metaConnectionRes.data.meta_user_name,
          meta_user_email: metaConnectionRes.data.meta_user_email,
          expires_at: metaConnectionRes.data.expires_at,
        }
      : null;

    return new Response(
      JSON.stringify({
        metaConnection,
        adAccounts,
        sales: salesRes.data || [],
        webhooks: webhooksRes.data || [],
        pixels: pixelsRes.data || [],
        rules: rulesRes.data || [],
        credentials: credentialsRes.data || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Admin user panel error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});