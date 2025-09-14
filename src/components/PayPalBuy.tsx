// src/components/PayPalBuy.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

declare global {
    interface Window {
        paypal?: any;
    }
}

type Props = {
    email: string;
    pack: "5" | "20";
    onSuccess: (newCredits: number) => void;
    onError: (message: string) => void;
};

function loadPayPalSdk(clientId: string, currency = "USD", intent = "capture") {
    return new Promise<void>((resolve, reject) => {
        if (window.paypal) return resolve();

        const params = new URLSearchParams({
            "client-id": clientId,
            currency,
            intent,
            components: "buttons",
            commit: "true",
        });

        const s = document.createElement("script");
        s.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
        s.async = true;
        s.onload = () => (window.paypal ? resolve() : reject(new Error("PayPal SDK failed to load")));
        s.onerror = () => reject(new Error("Failed to load PayPal SDK <script>"));
        document.head.appendChild(s);
    });
}

const PayPalBuy: React.FC<Props> = ({ email, pack, onSuccess, onError }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);

    const { clientId, env, price, label } = useMemo(() => {
        // Env + client id
        const envRaw = (import.meta as any).env?.VITE_PAYPAL_ENV?.toLowerCase?.() || "sandbox";
        const isLive = envRaw === "live";

        const liveId =
            (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID_LIVE ||
            (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || // optional fallback
            "";
        const sbId =
            (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID_SANDBOX ||
            (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || // optional fallback
            "";

        const cid = isLive ? liveId : sbId;

        // Pack → price mapping that matches verify-paypal.js
        const price = pack === "20" ? "9.00" : "3.00";
        const label = pack === "20" ? "20 credits" : "5 credits";

        return { clientId: cid, env: isLive ? "live" : "sandbox", price, label };
    }, [pack]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                if (!clientId) {
                    throw new Error(
                        `Missing PayPal client ID for ${env.toUpperCase()}. Set VITE_PAYPAL_CLIENT_ID_${env === "live" ? "LIVE" : "SANDBOX"}.`
                    );
                }
                await loadPayPalSdk(clientId);
                if (!cancelled) setReady(true);
            } catch (e: any) {
                setReady(false);
                onError(e?.message || "Failed to initialize PayPal");
            }
        })();
        return () => { cancelled = true; };
    }, [clientId, env, onError]);

    useEffect(() => {
        if (!ready || !mountRef.current || !window.paypal) return;

        mountRef.current.innerHTML = ""; // clear previous buttons

        window.paypal.Buttons({
            createOrder: (_data: any, actions: any) => {
                try {
                    return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                            {
                                description: label,
                                amount: { currency_code: "USD", value: price },
                            },
                        ],
                        application_context: { shipping_preference: "NO_SHIPPING" },
                    });
                } catch (err) {
                    onError("Failed to create PayPal order.");
                    throw err;
                }
            },

            onApprove: async (data: any, actions: any) => {
                try {
                    const details = await actions.order.capture();
                    const orderID = details?.id || data?.orderID;
                    if (!orderID) {
                        onError("Missing PayPal order ID after capture.");
                        return;
                    }

                    const r = await fetch("/api/verify-paypal", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderID, email, pack }),
                    });

                    if (!r.ok) {
                        const t = await r.text().catch(() => "");
                        onError(`Verification failed: ${t.slice(0, 200)}`);
                        return;
                    }

                    const j = await r.json();
                    if (j?.ok && typeof j.credits === "number") {
                        onSuccess(j.credits);
                    } else {
                        onError("Payment captured, but could not update credits.");
                    }
                } catch (err) {
                    onError("Failed to capture/verify PayPal transaction.");
                    throw err;
                }
            },

            onCancel: () => {
                onError("Payment canceled by the buyer.");
            },

            onError: (err: any) => {
                console.error("PayPal error", err);
                onError("An error occurred during the PayPal flow.");
            },
        })
            .render(mountRef.current)
            .catch((err: any) => {
                console.error("Render error:", err);
                onError("Failed to render PayPal buttons.");
                setReady(false);
            });
    }, [ready, label, price, email, pack, onSuccess, onError]);

    if (!ready) {
        return (
            <div className="text-center p-3 bg-yellow-900/40 border border-yellow-600/60 rounded">
                <div className="font-medium">PayPal not ready</div>
                <div className="text-xs opacity-80">Check {env.toUpperCase()} client ID in env.</div>
            </div>
        );
    }

    return <div ref={mountRef} className="w-full flex justify-center" />;
};

export default PayPalBuy;
