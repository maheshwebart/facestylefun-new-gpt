// netlify/functions/capture-order.js
import { getAccessToken, PAYPAL_API } from "./_paypal.js";

export default async (req) => {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    try {
        const { orderID } = await req.json();
        if (!orderID) return new Response("Missing orderID", { status: 400 });

        const token = await getAccessToken();
        const r = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        const j = await r.json();
        if (!r.ok) return new Response(JSON.stringify(j), { status: r.status });
        return new Response(JSON.stringify(j), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e) {
        return new Response(e?.message || "Server error", { status: 500 });
    }
};
