import React, { useEffect, useRef } from "react";

declare global {
    interface Window { paypal?: any; }
}

type Props = {
    email: string;
    pack: "5" | "20";                 // credits pack
    onSuccess: (newCredits: number) => void;
    onError?: (msg: string) => void;
};

export default function PayPalBuy({ email, pack, onSuccess, onError }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!email) return;

        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;
        if (!clientId) { onError?.("Missing VITE_PAYPAL_CLIENT_ID"); return; }

        const id = "paypal-sdk";
        const load = () => renderButtons();

        if (!document.getElementById(id)) {
            const s = document.createElement("script");
            s.id = id;
            s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD`;
            s.onload = load;
            s.onerror = () => onError?.("Failed to load PayPal SDK");
            document.body.appendChild(s);
        } else {
            load();
        }

        function renderButtons() {
            if (!window.paypal || !containerRef.current) return;
            const amount = pack === "20" ? "9.00" : "3.00"; // keep in sync with verify-paypal.js

            window.paypal.Buttons({
                style: { layout: "horizontal", color: "gold", shape: "pill", label: "pay" },
                createOrder: (_data: any, actions: any) =>
                    actions.order.create({ purchase_units: [{ amount: { value: amount } }] }),
                onApprove: async (_data: any, actions: any) => {
                    const details = await actions.order.capture();
                    const orderID = details.id;

                    const res = await fetch("/api/verify-paypal", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderID, email, pack }),
                    });
                    if (!res.ok) {
                        const t = await res.text();
                        onError?.(t || "Verification failed");
                        return;
                    }
                    const j = await res.json();
                    onSuccess(j.credits);
                },
                onError: (err: any) => onError?.(String(err)),
                onCancel: () => onError?.("Payment cancelled"),
            }).render(containerRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, pack]);

    return <div ref={containerRef} />;
}
