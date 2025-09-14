import React, { useEffect, useMemo, useRef, useState } from "react";

declare global { interface Window { paypal?: any } }

type Props = {
    email: string;
    pack: "5" | "20";
    onSuccess: (newCredits: number) => void;
    onError: (msg: string) => void;
};

function loadSdk(clientId: string) {
    return new Promise<void>((resolve, reject) => {
        if (window.paypal) return resolve();
        const params = new URLSearchParams({
            "client-id": clientId,
            currency: "USD",
            intent: "capture",
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

export default function PayPalBuy({ email, pack, onSuccess, onError }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);

    const { clientId, env } = useMemo(() => {
        const envRaw = (import.meta as any).env?.VITE_PAYPAL_ENV?.toLowerCase?.() || "sandbox";
        const isLive = envRaw === "live";
        const liveId =
            (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID_LIVE || "";
        const sbId =
            (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID_SANDBOX || "";
        return { clientId: isLive ? liveId : sbId, env: isLive ? "live" : "sandbox" };
    }, []);

    useEffect(() => {
        (async () => {
            try {
                if (!clientId) throw new Error(`Missing VITE_PAYPAL_CLIENT_ID_${env.toUpperCase()}`);
                await loadSdk(clientId);
                setReady(true);
                console.log(`[PayPal] SDK ready (${env}) client=${clientId.slice(0, 8)}…`);
            } catch (e: any) {
                onError(e?.message || "Failed to init PayPal");
            }
        })();
    }, [clientId, env, onError]);

    useEffect(() => {
        if (!ready || !ref.current || !window.paypal) return;
        ref.current.innerHTML = "";

        window.paypal.Buttons({
            createOrder: async () => {
                try {
                    const r = await fetch("/api/create-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ pack }),
                    });
                    const j = await r.json();
                    if (!r.ok || !j.id) {
                        throw new Error(`create-order failed ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
                    }
                    return j.id;
                } catch (err: any) {
                    onError(err?.message || "Could not create PayPal order");
                    throw err;
                }
            },

            onApprove: async (data: any) => {
                try {
                    const cap = await fetch("/api/capture-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderID: data.orderID }),
                    });
                    const details = await cap.json();
                    if (!cap.ok) {
                        throw new Error(`capture-order failed ${cap.status}: ${JSON.stringify(details).slice(0, 200)}`);
                    }

                    // now verify + add credits in your backend
                    const vr = await fetch("/api/verify-paypal", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderID: data.orderID, email, pack }),
                    });
                    const vj = await vr.json();
                    if (!vr.ok || !vj?.ok) {
                        throw new Error(`verify-paypal failed ${vr.status}: ${JSON.stringify(vj).slice(0, 200)}`);
                    }
                    onSuccess(vj.credits);
                } catch (err: any) {
                    onError(err?.message || "Payment capture/verification failed");
                    throw err;
                }
            },

            onCancel: () => onError("Payment canceled by the buyer."),
            onError: (err: any) => {
                console.error("PayPal Buttons error:", err);
                onError("PayPal experienced an error. Try again.");
            },
        }).render(ref.current);
    }, [ready, email, pack, onSuccess, onError]);

    if (!ready) {
        return (
            <div className="text-center p-2 border rounded opacity-80">
                Initializing PayPal…
            </div>
        );
    }
    return <div ref={ref} />;
}
