import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LowifyPayload {
  id?: string | number;
  event?: string;
  transaction_id?: string;
  order_id?: string;
  status?: string;
  sale_amount?: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  buyer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  product?: {
    id?: string | number;
    name?: string;
    price?: number;
  };
  offer?: {
    id?: string | number;
    name?: string;
  };
  payment?: {
    amount?: number;
    currency?: string;
    method?: string;
  };
  value?: number;
  price?: number;
  amount?: number;
  payment_type?: string;
  commission?: number;
  [key: string]: unknown;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the webhook token from query params or headers
    const url = new URL(req.url)
    const webhookToken = url.searchParams.get('token') || req.headers.get('x-webhook-token')
    let platform = url.searchParams.get('platform') || 'unknown'

    // Parse the incoming payload
    const payload: LowifyPayload = await req.json()

    console.log('Received webhook:', { platform, payload })

    // Find the webhook configuration by token if provided
    let webhookConfig = null
    let userId = null

    if (webhookToken) {
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('token', webhookToken)
        .eq('status', 'active')
        .single()

      if (webhookError) {
        console.error('Webhook lookup error:', webhookError)
      } else {
        webhookConfig = webhook
        userId = webhook.user_id
        // Use the platform from the webhook config if not explicitly provided in URL
        if (!url.searchParams.get('platform')) {
          platform = webhook.platform
        }
      }
    }

    // If no webhook found by token, reject the request
    // We no longer fall back to platform-only matching as it could route events to the wrong user

    if (!userId) {
      console.error('No valid webhook configuration found')
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook configuration not found' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse the sale data based on platform
    const saleData = parseSaleData(platform.toLowerCase(), payload, userId, webhookConfig?.id)

    // Insert the sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single()

    if (saleError) {
      console.error('Error inserting sale:', saleError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save sale data' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Sale recorded:', sale)

    return new Response(
      JSON.stringify({ success: true, sale_id: sale.id }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function parseSaleData(platform: string, payload: LowifyPayload, userId: string, webhookId: string | null) {
  // Common structure for sale data
  const baseData = {
    user_id: userId,
    webhook_id: webhookId,
    platform: platform,
    raw_data: payload,
    // Let the database set created_at with now() to ensure correct UTC timestamp
  }

  // Parse based on platform
  switch (platform) {
    case 'lowify':
      return {
        ...baseData,
        transaction_id: payload.transaction_id || payload.order_id || payload.id?.toString() || null,
        status: mapStatus(payload.status || payload.event || 'unknown'),
        customer_name: payload.customer?.name || payload.buyer?.name || null,
        customer_email: payload.customer?.email || payload.buyer?.email || null,
        customer_phone: payload.customer?.phone || payload.buyer?.phone || null,
        product_name: payload.product?.name || payload.offer?.name || null,
        product_id: payload.product?.id?.toString() || payload.offer?.id?.toString() || null,
        amount: payload.sale_amount || payload.product?.price || payload.payment?.amount || payload.value || payload.price || 0,
        currency: payload.payment?.currency || 'BRL',
        payment_method: payload.payment?.method || payload.payment_type || null,
        commission: payload.commission || 0,
      }

    default:
      // Generic parsing for unknown platforms
      return {
        ...baseData,
        transaction_id: payload.transaction_id || payload.id?.toString() || null,
        status: mapStatus(payload.status || payload.event || 'unknown'),
        customer_name: payload.customer?.name || null,
        customer_email: payload.customer?.email || null,
        customer_phone: payload.customer?.phone || null,
        product_name: payload.product?.name || null,
        product_id: payload.product?.id?.toString() || null,
        amount: payload.payment?.amount || payload.amount || payload.value || 0,
        currency: payload.payment?.currency || 'BRL',
        payment_method: payload.payment?.method || null,
        commission: payload.commission || 0,
      }
  }
}

function mapStatus(status: string): string {
  const statusLower = status.toLowerCase()
  
  // IMPORTANT: Check negative/intermediate statuses FIRST to avoid false positives
  // e.g. "waiting_payment" contains no approved keywords but must map to pending
  if (['pending', 'waiting', 'awaiting', 'waiting_payment', 'pix_pending'].some(s => statusLower.includes(s))) {
    return 'pending'
  }
  if (['refunded', 'refund', 'chargeback', 'chargedback', 'dispute'].some(s => statusLower.includes(s))) {
    return 'refunded'
  }
  if (['cancelled', 'canceled', 'expired', 'abandoned'].some(s => statusLower.includes(s))) {
    return 'cancelled'
  }
  // Only map to approved if none of the above matched
  if (['approved', 'paid', 'confirmed', 'completed'].some(s => statusLower.includes(s))) {
    return 'approved'
  }
  // Generic event names like "purchase" or "sale" default to approved
  if (['purchase', 'sale'].some(s => statusLower.includes(s))) {
    return 'approved'
  }
  
  return statusLower
}
