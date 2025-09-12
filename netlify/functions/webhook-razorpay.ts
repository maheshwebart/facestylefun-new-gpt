import type { Handler } from "@netlify/functions";
import crypto from "crypto";

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

function verify(body: string, signature: string) {
    const digest = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
    return signature === digest;
}

export const handler: Handler = async (event) => {
    const signature = event.headers["x-razorpay-signature"] || "";
    const body = event.body || "";

    if (!verify(body, String(signature))) {
        return { statusCode: 400, body: "Invalid signature" };
    }

    const payload = JSON.parse(body);
    // Example: on payment.captured, credit the user
    if (payload.event === "payment.captured") {
        const payment = payload.payload?.payment?.entity;
        const notes = payment?.notes || {};
        // You can store userId/order mapping in notes or receipt and credit here
        // await addCredits(userIdFromNotes, 20);
    }

    return { statusCode: 200, body: "OK" };
};
