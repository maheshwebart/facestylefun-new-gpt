import { getCredits, deductCredits } from "./_credits-lib.js";


export default async (req) => {
    const email = req.headers.get("x-user-email");
    if (!email) return new Response("Missing x-user-email", { status: 400 });

    if (req.method === "GET") {
        const c = await getCredits(email);
        return new Response(JSON.stringify({ credits: c }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (req.method === "POST") {
        const { op, amount = 1 } = await req.json();
        if (op !== "deduct") return new Response("Bad op", { status: 400 });
        const c = await deductCredits(email, amount);
        return new Response(JSON.stringify({ ok: true, credits: c }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response("Method Not Allowed", { status: 405 });
};
