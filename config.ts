// This setup assumes that your build process (like Vite, used by Netlify)
// will replace `process.env.VARIABLE_NAME` with the actual value at build time.

// --- PayPal Configuration ---
const PAYPAL_ENV = process.env.VITE_PAYPAL_ENV || 'sandbox';
const PAYPAL_CLIENT_ID_LIVE = process.env.VITE_PAYPAL_CLIENT_ID_LIVE;
const PAYPAL_CLIENT_ID_SANDBOX = process.env.VITE_PAYPAL_CLIENT_ID_SANDBOX;

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
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseconfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

if (!isSupabaseconfigured) {
    console.warn(
        "Supabase is not configured. " +
        "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
        "in your Netlify environment variables to enable user accounts and persistent data."
    );
}