import React, { useCallback } from "react";
import { PayPalButtons, FUNDING, usePayPalScriptReducer } from "@paypal/react-paypal-js";

export default function PayPalBuy({ amount, description }: { amount: string; description?: string }) {
    const [{ isPending }] = usePayPalScriptReducer();

    const createOrder = useCallback(async (): Promise<string> => {
        const res = await fetch("/.netlify/functions/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, description })
        });
        if (!res.ok) throw new Error(`Create order failed: ${res.status}`);
        const { id } = await res.json();
        return id;
    }, [amount, description]);

    const onApprove = useCallback(async (data: any) => {
        const res = await fetch("/.netlify/functions/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID })
        });
        if (!res.ok) throw new Error(`Capture failed: ${res.status}`);
        alert("Payment successful!");
    }, []);

    return (
        <div className="paypal">
            {isPending && <div>Loading payment…</div>}
            <PayPalButtons
                style={{ layout: "vertical", shape: "rect", label: "pay" }}
                fundingSource={FUNDING.PAYPAL}
                createOrder={createOrder}
                onApprove={onApprove}
            />
        </div>
    );
}
