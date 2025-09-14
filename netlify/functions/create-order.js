// netlify/functions/create-order.js
import { getAccessToken, PAYPAL_API } from "./_paypal.js";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const { pack } = await req.json();
    const amount = pack === "20" ? "9.00" : "3.00";
    const label = pack === "20" ? "20 credits" : "5 credits";

    const token = await getAccessToken();
    const r = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: label,
            amount: { currency_code: "USD", value: amount },
            custom_id: `pack_${pack}`,
          },
        ],
        application_context: { shipping_preference: "NO_SHIPPING" },
      }),
    });

    const j = await r.json();
    if (!r.ok) return new Response(JSON.stringify(j), { status: r.status });
    return new Response(JSON.stringify({ id: j.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(e?.message || "Server error", { status: 500 });
  }
};
