import { useState } from "react";
import { loadScript } from "../utils/loadScript";

const KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID || "").trim();

export default function RazorpayButton() {
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        try {
            // 1) create order
            const orderRes = await fetch("/.netlify/functions/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: 19900, currency: "INR" }), // ₹199
            });
            const { order } = await orderRes.json();

            // 2) load checkout sdk
            const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
            if (!ok) throw new Error("Failed to load Razorpay SDK");

            // 3) open checkout
            const options = {
                key: KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "facestyle.fun",
                description: "20 Credits",
                order_id: order.id,
                prefill: {
                    name: "Sri",
                    email: "sri@example.com",
                    contact: "9999999999",
                },
                notes: {
                    plan: "20_credits",
                },
                handler: async (response: any) => {
                    // 4) verify signature with backend
                    const verifyRes = await fetch("/.netlify/functions/verify-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    const result = await verifyRes.json();
                    if (result.ok) {
                        alert("Payment successful — credits added!");
                    } else {
                        alert("Verification failed. Please contact support.");
                    }
                },
                theme: { color: "#0b72e7" },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (res: any) => {
                console.error(res.error);
                alert("Payment failed. Please try again.");
            });
            rzp.open();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button disabled={loading} onClick={handlePay} className="btn">
            {loading ? "Processing..." : "Pay ₹199 for 20 credits"}
        </button>
    );
}
