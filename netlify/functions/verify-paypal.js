import { PAYPAL_API, getAccessToken } from "./_paypal.js";
import { addCredits } from "./_credits-lib.js";

export default async (req) => {
    try {
        if (req.method !== "POST")
            return new Response("Method Not Allowed", { status: 405 });

        const { orderID, email, pack } = await req.json();
        if (!orderID || !email || !pack)
            return new Response("Missing required fields", { status: 400 });

        // Keep this in sync with PayPalBuy.tsx
        const expected =
            pack === "20" ? { value: "9.00", credits: 20 } : { value: "3.00", credits: 5 };

        const token = await getAccessToken();
        const r = await fetch(
            `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderID)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!r.ok) {
            const t = await r.text().catch(() => "");
            return new Response(`Order lookup failed ${r.status}: ${t.slice(0, 300)}`, {
                status: 502,
            });
        }

        const order = await r.json();
        const status = order?.status;
        const amount = order?.purchase_units?.[0]?.amount?.value;

        if (status !== "COMPLETED" || amount !== expected.value) {
            return new Response("Order not completed or amount mismatch", { status: 400 });
        }

        const newCredits = await addCredits(email, expected.credits);
        return new Response(JSON.stringify({ ok: true, credits: newCredits }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e) {
        return new Response(e?.message || "Server error", { status: 500 });
    }
};
