import { addCredits } from "./_credits-lib.js";

async function getAccessToken() {
    const creds = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
    const r = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: { "Authorization": `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
    });
    if (!r.ok) throw new Error("Failed to get PayPal access token");
    const j = await r.json();
    return j.access_token;
}

export default async (req) => {
    try {
        if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
        const { orderID, email, pack } = await req.json();
        if (!orderID || !email || !pack) return new Response("Missing params", { status: 400 });

        const expected = pack === "20" ? { value: "9.00", credits: 20 } : { value: "3.00", credits: 5 };
        const token = await getAccessToken();

        const r = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!r.ok) return new Response("Verify failed", { status: 400 });
        const order = await r.json();

        const status = order.status;
        const purchaseUnit = order.purchase_units?.[0];
        const amount = purchaseUnit?.amount?.value;

        if (status !== "COMPLETED" || amount !== expected.value) {
            return new Response("Order not completed or amount mismatch", { status: 400 });
        }

        const newCredits = await addCredits(email, expected.credits);
        return new Response(JSON.stringify({ ok: true, credits: newCredits }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e) {
        return new Response(e?.message || "Server error", { status: 500 });
    }
};
