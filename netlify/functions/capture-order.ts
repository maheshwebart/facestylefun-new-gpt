import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
    try {
        const { orderID } = JSON.parse(event.body || "{}");
        if (!orderID) return { statusCode: 400, body: JSON.stringify({ error: "Missing orderID" }) };

        const res = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64"),
            }
        });

        if (!res.ok) {
            const txt = await res.text();
            return { statusCode: 500, body: JSON.stringify({ error: "PayPal capture failed", detail: txt }) };
        }

        const data = await res.json();
        // TODO: credit logic (if/when you connect Supabase), e.g. addCredits(userId, packSize)

        return { statusCode: 200, body: JSON.stringify({ ok: true, data }) };
    } catch (e: any) {
        return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Server error" }) };
    }
};
