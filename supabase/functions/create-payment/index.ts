import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface PaymentRequest {
  userId: string;
  amount: number;
  pointsToAdd: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, amount, pointsToAdd } = await req.json() as PaymentRequest;

    if (!userId || !amount || !pointsToAdd) {
      throw new Error('Missing required fields');
    }

    console.log('Validating user:', userId);

    // Validate user exists in auth.users first.
    const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUserData.user) {
      console.error('Auth user validation error:', authError);
      throw new Error('User not found in auth system');
    }
    const authUser = authUserData.user;

    // Then validate user exists in public.users using id.
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (!user) {
      console.error('Public user not found. Creating new record.');
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: authUser.email,
          remaining_points: 1000 // Default starting points
        })
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        throw new Error('Failed to create user record: ' + createError.message);
      }
      user = newUser; // Use the newly created user record.
    }

    console.log('User validated successfully');

    // Get origin for redirect URLs
    const origin = req.headers.get('origin') || req.headers.get('referer');
    if (!origin) {
      throw new Error('No origin or referer header found');
    }

    // Create a Stripe Checkout Session using PromptPay (Thai QR)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['promptpay'],
      line_items: [
        {
          price_data: {
            currency: 'thb', // Using Thai Baht for PromptPay
            product_data: {
              name: `Payment for ${pointsToAdd} Points`,
            },
            unit_amount: Math.round(amount * 100), // amount in satang (smallest THB unit)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        userId,
        pointsToAdd: pointsToAdd.toString(),
      },
      // Use query parameters for success/cancel status
      success_url: `${origin}?payment_status=success&points=${pointsToAdd}`,
      cancel_url: `${origin}?payment_status=cancelled`,
    });

    console.log('Checkout session created:', session.id);

    // Create a pending payment record using the session id as the transaction id.
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        amount,
        currency: 'thb',
        points_added: pointsToAdd,
        payment_method: 'stripe',
        transaction_id: session.id,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      throw new Error('Failed to create payment record: ' + paymentError.message);
    }

    console.log('Payment record created successfully');

    return new Response(
      JSON.stringify({
        sessionUrl: session.url,
        paymentId: payment.id,
        amount,
        currency: 'thb'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process payment request',
        details: error.toString()
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});