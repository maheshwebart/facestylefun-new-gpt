// netlify/functions/_paypal.js
export const ENV = (() => {
  const raw = (process.env.PAYPAL_ENV || process.env.VITE_PAYPAL_ENV || "").toLowerCase();
  if (raw === "live" || raw === "sandbox") return raw;

  // Infer from presence of live creds
  const hasLive =
    process.env.PAYPAL_LIVE_CLIENT_ID ||
    process.env.PAYPAL_lIVE_CLIENT_ID ||
    process.env.PAYPAL_LIVE_SECRET ||
    process.env.PAYPAL_lIVE_SECRET;
  return hasLive ? "live" : "sandbox";
})();

export const PAYPAL_API =
  ENV === "live" ? "https://api.paypal.com" : "https://api-m.sandbox.paypal.com";

function resolveCreds() {
  if (ENV === "live") {
    const clientId =
      process.env.PAYPAL_LIVE_CLIENT_ID ||
      process.env.PAYPAL_lIVE_CLIENT_ID || "";
    const secret =
      process.env.PAYPAL_LIVE_SECRET ||
      process.env.PAYPAL_lIVE_SECRET || "";
    return { clientId, secret };
  } else {
    const clientId =
      process.env.PAYPAL_SANDBOX_CLIENT_ID ||
      process.env.PAYPAL_SANBOX_CLIENT_ID || ""; // tolerate SANBOX typo
    const secret =
      process.env.PAYPAL_SANDBOX_SECRET ||
      process.env.PAYPAL_SECRET || "";
    return { clientId, secret };
  }
}

export async function getAccessToken() {
  const { clientId, secret } = resolveCreds();
  if (!clientId || !secret) {
    throw new Error(
      `Missing PayPal ${ENV.toUpperCase()} credentials. Set PAYPAL_${ENV === "live" ? "LIVE" : "SANDBOX"}_CLIENT_ID and _SECRET.`
    );
  }

  const creds = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const r = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`PayPal token error ${r.status}: ${t.slice(0, 300)}`);
  }
  return (await r.json()).access_token;
}
