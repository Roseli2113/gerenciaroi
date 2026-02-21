import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Map offer IDs to plan names
const offerToPlan: Record<string, string> = {
  'offer-1771698608846': 'premium',    // R$ 27
  'offer-1771698186014': 'advanced',   // R$ 67 (maps to 'profissional' in DB)
  'offer-1771698238795': 'monster',    // R$ 147 (maps to 'enterprise' in DB)
}

// Map internal plan names to DB plan names
const planToDbPlan: Record<string, string> = {
  'premium': 'starter',
  'advanced': 'profissional',
  'monster': 'enterprise',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate token against api_credentials
    const { data: credential, error: credError } = await supabase
      .from('api_credentials')
      .select('user_id, status')
      .eq('token', token)
      .eq('status', 'active')
      .single()

    if (credError || !credential) {
      console.error('Invalid payment webhook token:', credError)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or inactive token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.json()
    console.log('Payment webhook received:', JSON.stringify(payload))

    // Extract buyer email from payload (adsroi.com.br format)
    const buyerEmail = payload.buyer?.email || payload.customer?.email || payload.email || null
    const event = payload.event || payload.status || 'unknown'
    const offerId = payload.offer?.id || payload.offer_id || null

    if (!buyerEmail) {
      console.error('No buyer email in payload')
      return new Response(
        JSON.stringify({ success: false, error: 'Buyer email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine plan from offer ID
    let dbPlan = 'free'
    if (offerId && offerToPlan[offerId]) {
      const internalPlan = offerToPlan[offerId]
      dbPlan = planToDbPlan[internalPlan] || internalPlan
    }

    // Determine plan status based on event
    let planStatus = 'active'
    const eventLower = event.toLowerCase()
    if (['refunded', 'chargeback', 'cancelled', 'canceled', 'expired'].some(s => eventLower.includes(s))) {
      planStatus = 'cancelled'
      dbPlan = 'free'
    } else if (['overdue', 'past_due', 'unpaid'].some(s => eventLower.includes(s))) {
      planStatus = 'overdue'
    }

    // Find user profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', buyerEmail)
      .single()

    if (profileError || !profile) {
      console.error('User not found for email:', buyerEmail, profileError)
      return new Response(
        JSON.stringify({ success: false, error: 'User not found for this email' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ plan: dbPlan, plan_status: planStatus })
      .eq('user_id', profile.user_id)

    if (updateError) {
      console.error('Error updating plan:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Plan updated: ${buyerEmail} -> ${dbPlan} (${planStatus})`)

    return new Response(
      JSON.stringify({ success: true, email: buyerEmail, plan: dbPlan, status: planStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payment webhook error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
