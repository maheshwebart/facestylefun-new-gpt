import { PAYPAL_API, getAccessToken } from "./_paypal.js";

export default async () => {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "USD", value: "5.00" } }],
    }),
  });

  const json = await res.json();
  return new Response(JSON.stringify({ id: json.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
