import type { Handler } from "@netlify/functions";
import crypto from "crypto";

const key_secret = process.env.RAZORPAY_KEY_SECRET!;

export const handler: Handler = async (event) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            JSON.parse(event.body || "{}");

        const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expected = crypto
            .createHmac("sha256", key_secret)
            .update(payload)
            .digest("hex");

        const valid = expected === razorpay_signature;

        if (!valid) {
            return { statusCode: 400, body: JSON.stringify({ ok: false, reason: "invalid_signature" }) };
        }

        // TODO: add credits to the user in your DB here (idempotent)
        // e.g., await addCredits(userId, 20);

        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (e: any) {
        console.error(e);
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) };
    }
};
