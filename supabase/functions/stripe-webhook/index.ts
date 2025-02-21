import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Missing Stripe webhook secret');
    }
    
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { userId, pointsToAdd } = paymentIntent.metadata;

      // Update payment status
      await supabaseAdmin
        .from('payments')
        .update({ status: 'completed' })
        .eq('transaction_id', paymentIntent.id);

      // Add points to user
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .update({ 
          remaining_points: supabaseAdmin.sql`remaining_points + ${pointsToAdd}::int`
        })
        .eq('id', userId)
        .select()
        .single();

      if (userError) throw userError;

      // Record points transaction
      await supabaseAdmin
        .from('points_transactions')
        .insert({
          user_id: userId,
          points: pointsToAdd,
          reason: 'Points purchase'
        });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});