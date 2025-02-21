import { loadStripe } from '@stripe/stripe-js';

// Get publishable key from environment variable
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error('Missing Stripe publishable key in environment variables');
}

// Only initialize Stripe if we have a key
export const stripePromise = publishableKey 
  ? loadStripe(publishableKey)
  : Promise.reject(new Error('Stripe publishable key is not configured'));