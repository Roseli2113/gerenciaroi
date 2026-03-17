import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin
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

    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin using service role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "targetUserId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all user data using service role (bypasses RLS)
    const [
      metaConnectionRes,
      adAccountsRes,
      salesRes,
      webhooksRes,
      pixelsRes,
      rulesRes,
      credentialsRes,
    ] = await Promise.all([
      serviceClient.from("meta_connections").select("*").eq("user_id", targetUserId).maybeSingle(),
      serviceClient.from("meta_ad_accounts").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false }),
      serviceClient.from("sales").select("id, amount, status, platform, product_name, customer_name, customer_email, created_at").eq("user_id", targetUserId).order("created_at", { ascending: false }).limit(50),
      serviceClient.from("webhooks").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false }),
      serviceClient.from("pixels").select("id, name, pixel_type, status").eq("user_id", targetUserId),
      serviceClient.from("automation_rules").select("id, name, is_active, condition_type, action_type, executions, last_execution").eq("user_id", targetUserId),
      serviceClient.from("api_credentials").select("id, name, status, created_at").eq("user_id", targetUserId),
    ]);

    return new Response(
      JSON.stringify({
        metaConnection: metaConnectionRes.data,
        adAccounts: adAccountsRes.data || [],
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
