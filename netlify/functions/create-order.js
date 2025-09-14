// netlify/functions/create-order.js
import { getAccessToken, PAYPAL_API } from "./_paypal.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { pack } = JSON.parse(event.body || "{}");
    const amount = pack === "20" ? "9.00" : "3.00";
    const label = pack === "20" ? "20 credits" : "5 credits";

    const access = await getAccessToken();

    const r = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
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
    if (!r.ok) {
      return {
        statusCode: r.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(j),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: j.id }),
    };
  } catch (err) {
    return { statusCode: 500, body: String(err?.message || err) };
  }
}
