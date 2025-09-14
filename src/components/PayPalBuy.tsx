import React, { useEffect, useMemo, useRef, useState } from "react";

declare global { interface Window { paypal?: any } }

type Props = {
    email: string;
    pack: "5" | "20";
    onSuccess: (newCredits: number) => void;
    onError: (msg: string) => void;
};

function ensureSdk(clientId: string) {
    return new Promise<void>((resolve, reject) => {
        if (window.paypal) return resolve();

        const existing = document.getElementById("paypal-sdk") as HTMLScriptElement | null;
        if (existing) {
            const onLoad = () => (window.paypal ? resolve() : reject(new Error("PayPal SDK failed after existing script load")));
            existing.addEventListener("load", onLoad, { once: true });
            existing.addEventListener("error", () => reject(new Error("PayPal SDK <script> error")), { once: true });
            return;
        }

        const params = new URLSearchParams({
            "client-id": clientId,
            currency: "USD",
            intent: "capture",
            components: "buttons",
            commit: "true",
        });

        const s = document.createElement("script");
        s.id = "paypal-sdk";
        s.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
        s.async = true;
        s.onload = () => (window.paypal ? resolve() : reject(new Error("PayPal SDK failed to load")));
        s.onerror = () => reject(new Error("Failed to load PayPal SDK <script>"));
        document.head.appendChild(s);
    });
}

async function callFn(name: string, payload: any) {
    const body = JSON.stringify(payload);
    const headers = { "Content-Type": "application/json" };
    const paths = [
        "/.netlify/functions/" + name,
        "/api/" + name, // optional redirect fallback
    ];
    let last = "";

    for (const url of paths) {
        try {
            const r = await fetch(url, { method: "POST", headers, body });
            const text = await r.text();
            if (r.ok) return text ? JSON.parse(text) : {};
            last = `${r.status}: ${text}`;
        } catch (e: any) {
            last = e?.message || String(e);
        }
    }
    throw new Error(`${name} failed: ${last.slice(0, 400)}`);
}

export default function PayPalBuy({ email, pack, onSuccess, onError }: Props) {
    const mountRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<any>(null);
    const successRef = useRef(onSuccess);
    const errorRef = useRef(onError);
    const busyRef = useRef(false);
    const [ready, setReady] = useState(false);

    // keep latest callbacks in refs (so we don't depend on them)
    useEffect(() => { successRef.current = onSuccess; }, [onSuccess]);
    useEffect(() => { errorRef.current = onError; }, [onError]);

    const { clientId, env } = useMemo(() => {
        const envRaw = (import.meta as any).env?.VITE_PAYPAL_ENV?.toLowerCase?.() || "sandbox";
        const isLive = envRaw === "live";
        const liveId = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID_LIVE || "";
        const sbId = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID_SANDBOX || "";
        return { clientId: isLive ? liveId : sbId, env: isLive ? "live" : "sandbox" };
    }, []);

    // Load SDK once
    useEffect(() => {
        (async () => {
            try {
                if (!clientId) throw new Error(`Missing VITE_PAYPAL_CLIENT_ID_${env.toUpperCase()}`);
                await ensureSdk(clientId);
                setReady(true);
            } catch (e: any) {
                console.error("[PayPal SDK]", e);
                errorRef.current(e?.message || "Failed to init PayPal");
            }
        })();
    }, [clientId, env]); // stable

    // Render buttons — keep deps minimal to avoid re-inits
    useEffect(() => {
        if (!ready || !mountRef.current || !window.paypal) return;

        let destroyed = false;
        mountRef.current.innerHTML = "";

        const instance = window.paypal.Buttons({
            // onClick runs before createOrder - good place to block duplicates
            onClick: () => {
                if (busyRef.current) {
                    return window.paypal.Actions.reject();
                }
                busyRef.current = true;
                return window.paypal.Actions.resolve();
            },

            createOrder: async () => {
                try {
                    const j = await callFn("create-order", { pack });
                    if (!j?.id) throw new Error("No order ID returned from create-order");
                    return j.id;
                } catch (err: any) {
                    busyRef.current = false;
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
                    if (!destroyed) successRef.current(vj.credits);
                } catch (err: any) {
                    if (!destroyed) errorRef.current(err?.message || "Payment capture/verification failed");
                    throw err;
                } finally {
                    busyRef.current = false;
                }
            },

            onCancel: () => {
                busyRef.current = false;
                if (!destroyed) errorRef.current("Payment canceled by the buyer.");
            },

            onError: (err: any) => {
                busyRef.current = false;
                console.error("[PayPal Buttons error]", err);
                if (!destroyed) errorRef.current("PayPal experienced an error. See console for details.");
            },
        });

        buttonsRef.current = instance;

        instance.render(mountRef.current).catch((err: any) => {
            console.error("[Buttons.render] error", err);
            busyRef.current = false;
            if (!destroyed) errorRef.current(err?.message || "Failed to render PayPal buttons");
        });

        return () => {
            destroyed = true;
            try { buttonsRef.current?.close?.(); } catch { }
            buttonsRef.current = null;
        };
    }, [ready, pack, email]); // <-- no onSuccess/onError here

    if (!ready) return <div className="text-center p-2 border rounded opacity-80">Initializing PayPal…</div>;
    return <div ref={mountRef} />;
}
