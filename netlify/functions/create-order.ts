import type { Handler } from "@netlify/functions";
import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID!;
const key_secret = process.env.RAZORPAY_KEY_SECRET!;

const razorpay = new Razorpay({ key_id, key_secret });

export const handler: Handler = async (event) => {
    try {
        // Parse amount/metadata from client if you want dynamic plans
        const { amount = 19900, currency = "INR", receipt = `rcpt_${Date.now()}` } =
            event.body ? JSON.parse(event.body) : {};

        // amount in paise: ₹199.00 -> 19900
        const order = await razorpay.orders.create({
            amount,
            currency,
            receipt,
            notes: { plan: "20_credits" },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ id: `ORDER-${Date.now()}` }),
        };
    } catch (e: any) {
        console.error(e);
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
