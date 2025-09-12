export const PAYPAL_API =
  process.env.PAYPAL_ENV === "live"
    ? "https://api.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function getAccessToken() {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");

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
  const j = await r.json();
  return j.access_token;
}
