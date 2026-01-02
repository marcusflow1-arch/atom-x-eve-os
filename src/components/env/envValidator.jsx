import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Base44 Configuration (auto-injected, no user action needed)
  VITE_BASE44_APP_ID: z.string().optional(),
  
  // Optional third-party integrations
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_PAYPAL_CLIENT_ID: z.string().optional(),
  
  // Development mode
  MODE: z.enum(['development', 'production', 'preview']).optional(),
  DEV: z.boolean().optional(),
  PROD: z.boolean().optional(),
});

/**
 * Validates environment variables at app startup
 * Only runs in development/preview to help developers catch issues early
 */
export function validateEnv() {
  // Only validate in dev/preview mode
  if (import.meta.env.PROD) {
    return { success: true };
  }

  try {
    const env = {
      VITE_BASE44_APP_ID: import.meta.env.VITE_BASE44_APP_ID,
      VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      VITE_PAYPAL_CLIENT_ID: import.meta.env.VITE_PAYPAL_CLIENT_ID,
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    };

    envSchema.parse(env);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Environment Configuration Error:');
    console.error(error.errors || error.message);
    console.error('\n📝 Expected environment variables:');
    console.error('  - VITE_BASE44_APP_ID (optional - auto-set by Base44)');
    console.error('  - VITE_STRIPE_PUBLISHABLE_KEY (optional - for payments)');
    console.error('  - VITE_PAYPAL_CLIENT_ID (optional - for PayPal)');
    console.error('\n💡 Create a .env file in your project root with these variables.');
    
    return { success: false, error };
  }
}

/**
 * Safe getter for environment variables
 * Returns undefined if variable doesn't exist
 */
export function getEnv(key) {
  return import.meta.env[key];
}

/**
 * Get Base44 App ID
 * Checks env var first, then falls back to auto-detection
 */
export function getAppId() {
  // Try environment variable first
  const envAppId = import.meta.env.VITE_BASE44_APP_ID;
  if (envAppId) return envAppId;
  
  // Auto-detect from hostname (Base44 preview URLs)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Pattern: appid.preview.base44.app or appid-username.base44.app
    const match = hostname.match(/^([a-z0-9-]+)\.(preview\.)?base44\.app/);
    if (match) return match[1].split('-')[0]; // Take first part before dash
  }
  
  return null;
}

// Example .env file content
export const ENV_EXAMPLE = `# Atom x Eve - Environment Variables

# Base44 Configuration
# (Optional - auto-detected from URL in most cases)
# VITE_BASE44_APP_ID=your-app-id

# Payment Integration (Optional)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
# VITE_PAYPAL_CLIENT_ID=xxxxx

# The following are auto-set by Vite:
# MODE=development|production|preview
# DEV=true|false
# PROD=true|false
`;