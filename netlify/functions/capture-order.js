// netlify/functions/capture-order.js
import { getAccessToken, PAYPAL_API } from "./_paypal.js";

export async function handler(event) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { orderID } = JSON.parse(event.body || "{}");
        if (!orderID) return { statusCode: 400, body: "Missing orderID" };

        const access = await getAccessToken();

        const r = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
            method: "POST",
            headers: { Authorization: `Bearer ${access}` },
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
            body: JSON.stringify(j),
        };
    } catch (err) {
        return { statusCode: 500, body: String(err?.message || err) };
    }
}
