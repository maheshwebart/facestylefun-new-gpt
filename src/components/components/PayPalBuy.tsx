// src/components/PayPalBuy.tsx
import React, { useEffect, useRef } from "react";

declare global {
    interface Window {
        paypal?: any;
    }
}

type Props = {
    email: string;
    pack: "5" | "20";                // which credit pack to buy
    onSuccess: (newCredits: number) => void;
    onError?: (msg: string) => void;
};

export default function PayPalBuy({ email, pack, onSuccess, onError }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadSdk() {
            const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
            if (!clientId) {
                onError?.("Missing VITE_PAYPAL_CLIENT_ID. Set it in Netlify environment.");
                return;
            }

            // If already loaded once, just render
            if (window.paypal) {
                renderButtons();
                return;
            }

            // Inject the PayPal JS SDK
            const script = document.createElement("script");
            script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
                clientId
            )}&components=buttons&intent=capture&currency=USD`;
            script.async = true;
            script.onload = () => renderButtons();
            script.onerror = () => onError?.("Failed to load PayPal SDK (check Client ID)");
            document.head.appendChild(script);
        }

        function renderButtons() {
            if (!containerRef.current || !window.paypal) return;

            window.paypal
                .Buttons({
                    style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },

                    // Client-side order create (keep amounts in sync with server verify)
                    createOrder: (_: any, actions: any) => {
                        const amount = pack === "20" ? "9.00" : "3.00";
                        return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [{ amount: { value: amount, currency_code: "USD" } }],
                        });
                    },

                    // Capture on PayPal then server-verify before crediting
                    onApprove: async (data: any) => {
                        try {
                            const res = await fetch("/api/verify-paypal", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderID: data.orderID, email, pack }),
                            });
                            if (!res.ok) {
                                const txt = await res.text();
                                onError?.(`Verification failed: ${txt}`);
                                return;
                            }
                            const j = await res.json();
                            onSuccess(j.credits);
                        } catch (e: any) {
                            onError?.(String(e?.message || e));
                        }
                    },

                    onError: (err: any) => onError?.(String(err)),
                    onCancel: () => onError?.("Payment cancelled"),
                })
                .render(containerRef.current);
        }

        loadSdk();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, pack]);

    return <div ref={containerRef} />;
}
