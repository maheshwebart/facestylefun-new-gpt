import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
    try {
        const { amount = "5.00", description = "Credit pack" } = JSON.parse(event.body || "{}");

        const res = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64"),
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [{ amount: { currency_code: "USD", value: amount }, description }]
            })
        });

        if (!res.ok) {
            const txt = await res.text();
            return { statusCode: 500, body: JSON.stringify({ error: "PayPal create failed", detail: txt }) };
        }
        const data = await res.json();
        return { statusCode: 200, body: JSON.stringify({ id: data.id }) };
    } catch (e: any) {
        return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Server error" }) };
    }
};
