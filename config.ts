// This setup assumes that your build process (like Vite, used by Netlify)
// will replace `import.meta.env.VARIABLE_NAME` with the actual value at build time.

// --- PayPal Configuration ---
// Fix: Cast import.meta to any to resolve TypeScript error about 'env' property.
const PAYPAL_ENV = (import.meta as any).env.VITE_PAYPAL_ENV || 'sandbox';
// Fix: Cast import.meta to any to resolve TypeScript error about 'env' property.
const PAYPAL_CLIENT_ID_LIVE = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID_LIVE;
// Fix: Cast import.meta to any to resolve TypeScript error about 'env' property.
const PAYPAL_CLIENT_ID_SANDBOX = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID_SANDBOX;

export const PAYPAL_CLIENT_ID = PAYPAL_ENV === 'live' 
    ? PAYPAL_CLIENT_ID_LIVE 
    : PAYPAL_CLIENT_ID_SANDBOX;

if (!PAYPAL_CLIENT_ID) {
  console.warn(
    "PayPal payments are not configured. " +
    "Please set either VITE_PAYPAL_CLIENT_ID_LIVE or VITE_PAYPAL_CLIENT_ID_SANDBOX " +
    "in your Netlify environment variables to enable payments."
  );
}

// --- Supabase Configuration ---
// Fix: Cast import.meta to any to resolve TypeScript error about 'env' property.
export const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
// Fix: Cast import.meta to any to resolve TypeScript error about 'env' property.
export const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseconfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

if (!isSupabaseconfigured) {
    console.warn(
        "Supabase is not configured. " +
        "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
        "in your Netlify environment variables to enable user accounts and persistent data."
    );
}

// --- Gemini API Key Configuration ---
// Fix: Cast import.meta to any to resolve TypeScript error about 'env' property.
export const API_KEY = (import.meta as any).env.VITE_API_KEY;

if (!API_KEY) {
  console.warn(
    "Gemini API Key is not configured. " +
    "Please set VITE_API_KEY in your Netlify environment variables " +
    "to enable AI features."
  );
}