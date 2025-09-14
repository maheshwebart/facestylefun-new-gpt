// src/components/PayPalBuy.tsx
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
        const url = `https://www.paypal.com/sdk/js?${params.toString()}`;
        console.log("[PayPal SDK]", url);
        const s = document.createElement("script");
        s.src = url;
        s.async = true;
        s.onload = () => (window.paypal ? resolve() : reject(new Error("PayPal SDK failed to load")));
        s.onerror = () => reject(new Error("Failed to load PayPal SDK <script>"));
        document.head.appendChild(s);
    });
}

async function callFn(name: string, payload: any) {
    const bodies = JSON.stringify(payload);
    const headers = { "Content-Type": "application/json" };
    const paths = [
        `/.netlify/functions/${name}`,
        `/api/${name}`,      // fallback if you have a redirect rule
    ];
    let last: { status: number; text: string } | null = null;

    for (const path of paths) {
        try {
            const r = await fetch(path, { method: "POST", headers, body: bodies });
            const text = await r.text();
            if (r.ok) return JSON.parse(text || "{}");
            last = { status: r.status, text };
        } catch (e: any) {
            last = { status: 0, text: e?.message || String(e) };
        }
    }
    throw new Error(`${name} failed: ${last?.status} ${String(last?.text).slice(0, 400)}`);
}

export default function PayPalBuy({ email, pack, onSuccess, onError }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);

    const { clientId, env } = useMemo(() => {
        const envRaw = (import.meta as any).env?.VITE_PAYPAL_ENV?.toLowerCase?.() || "sandbox";
        const isLive = envRaw === "live";
        const liveId = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID_LIVE || "";
        const sbId = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID_SANDBOX || "";
        return { clientId: isLive ? liveId : sbId, env: isLive ? "live" : "sandbox" };
    }, []);

    useEffect(() => {
        (async () => {
            try {
                if (!clientId) throw new Error(`Missing VITE_PAYPAL_CLIENT_ID_${env.toUpperCase()}`);
                await loadSdk(clientId);
                setReady(true);
            } catch (e: any) {
                console.error(e);
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
                    const j = await callFn("create-order", { pack });
                    if (!j?.id) throw new Error("No order ID returned");
                    return j.id;
                } catch (err: any) {
                    console.error("[create-order]", err);
                    onError(err?.message || "Could not create PayPal order");
                    throw err;
                }
            },

            onApprove: async (data: any) => {
                try {
                    const details = await callFn("capture-order", { orderID: data.orderID });
                    if (!details?.id) throw new Error("Capture failed (no details.id)");

                    const vj = await callFn("verify-paypal", { orderID: data.orderID, email, pack });
                    if (!vj?.ok || typeof vj.credits !== "number") {
                        throw new Error(`verify-paypal failed: ${JSON.stringify(vj).slice(0, 200)}`);
                    }
                    onSuccess(vj.credits);
                } catch (err: any) {
                    console.error("[approve/capture/verify]", err);
                    onError(err?.message || "Payment capture/verification failed");
                    throw err;
                }
            },

            onCancel: () => onError("Payment canceled by the buyer."),
            onError: (err: any) => {
                console.error("[PayPal Buttons error]", err);
                onError("PayPal experienced an error. See console for details.");
            },
        }).render(ref.current);
    }, [ready, email, pack, onSuccess, onError]);

    if (!ready) return <div className="text-center p-2 border rounded opacity-80">Initializing PayPal…</div>;
    return <div ref={ref} />;
}
