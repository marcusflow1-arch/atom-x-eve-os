import { getEnv } from '@/components/env/envValidator';

/**
 * Get Stripe publishable key from environment
 * This is safe to expose in client code
 */
export function getStripePublishableKey() {
  const key = getEnv('VITE_STRIPE_PUBLISHABLE_KEY');
  
  if (!key && import.meta.env.DEV) {
    console.warn('⚠️ VITE_STRIPE_PUBLISHABLE_KEY not set. Stripe payments will not work.');
  }
  
  return key;
}

/**
 * Get PayPal client ID from environment
 */
export function getPayPalClientId() {
  const clientId = getEnv('VITE_PAYPAL_CLIENT_ID');
  
  if (!clientId && import.meta.env.DEV) {
    console.warn('⚠️ VITE_PAYPAL_CLIENT_ID not set. PayPal payments will not work.');
  }
  
  return clientId;
}

/**
 * Check if payment methods are configured
 */
export function isPaymentConfigured() {
  return !!(getStripePublishableKey() || getPayPalClientId());
}