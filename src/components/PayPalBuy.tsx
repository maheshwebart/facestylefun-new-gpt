import React from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";

type Props = {
    amount: string; // USD amount, e.g. "5.00"
    onPaid: (creditsAdded: number) => Promise<void> | void;
};

export default function PayPalBuy({ amount, onPaid }: Props) {
    return (
        <div style={{ maxWidth: 420 }}>
            <PayPalButtons
                style={{ layout: "vertical" }}
                forceReRender={[amount]} // ensures re-render if amount changes
                createOrder={async () => {
                    const res = await fetch("/.netlify/functions/create-order", {
                        method: "POST",
                    });
                    if (!res.ok) throw new Error("Failed to create order");
                    const { id } = await res.json();
                    return id;
                }}
                onApprove={async (data) => {
                    const res = await fetch("/.netlify/functions/capture-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderID: data.orderID }),
                    });
                    if (!res.ok) throw new Error("Failed to capture order");
                    const { creditsAdded = 10 } = await res.json(); // default fallback
                    await onPaid(creditsAdded);
                }}
                onError={(err) => {
                    console.error(err);
                    alert("Payment failed. Please try again.");
                }}
            />
        </div>
    );
}
