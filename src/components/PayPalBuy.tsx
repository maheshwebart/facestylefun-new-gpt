import React from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";

type Props = {
    email: string;
    pack: "5" | "20";
    onSuccess: (newCredits: number) => void;
    onError: (message: string) => void;
};

export default function PayPalBuy({ email, pack, onSuccess, onError }: Props) {
    return (
        <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={async () => {
                const res = await fetch("/.netlify/functions/create-order", { method: "POST" });
                if (!res.ok) throw new Error("Failed to create order");
                const { id } = await res.json();
                return id;
            }}
            onApprove={async (data) => {
                const res = await fetch("/.netlify/functions/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderID: data.orderID, email, pack }),
                });
                if (!res.ok) {
                    const t = await res.text();
                    onError(t || "Payment capture failed");
                    return;
                }
                const { creditsAdded, credits } = await res.json();
                // Prefer the server's new total; fallback to add pack locally if missing
                onSuccess(typeof credits === "number" ? credits : creditsAdded);
            }}
            onError={(err) => {
                console.error(err);
                onError("Payment failed. Please try again.");
            }}
        />
    );
}
