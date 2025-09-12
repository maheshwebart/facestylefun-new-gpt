// src/App.tsx
import { useCallback, useMemo, useState } from "react";

/** ——— small helper to load the Razorpay script ——— */
async function loadScript(src: string): Promise<boolean> {
    return new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
}

/** ——— THIS is your existing app area. Replace content inside <Studio/> ——— */
function Studio() {
    return (
        <section>
            <h2 style={{ margin: "0 0 8px" }}>Your App</h2>
            <p style={{ margin: 0, opacity: 0.8 }}>
                Replace this block with your original app UI (file upload, previews, etc.).
            </p>
            {/* Paste your previous App.tsx JSX here */}
        </section>
    );
}

/** ——— Razorpay Pay Button (₹199 for 20 credits) ——— */
function RazorpayButton() {
    const [loading, setLoading] = useState(false);
    const keyId = useMemo(
        () => String(import.meta.env.VITE_RAZORPAY_KEY_ID ?? "").trim(),
        []
    );
    const canPay = keyId.length > 0;

    const handlePay = useCallback(async () => {
        setLoading(true);
        try {
            const orderRes = await fetch("/.netlify/functions/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: 19900, currency: "INR" }), // ₹199 → 19900 paise
            });
            if (!orderRes.ok) throw new Error(`Create order failed: ${await orderRes.text()}`);
            const { order } = (await orderRes.json()) as {
                order: { id: string; amount: number; currency: string };
            };

            const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
            if (!ok) throw new Error("Failed to load Razorpay SDK");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const RazorpayCtor = (window as any).Razorpay;
            if (!RazorpayCtor) throw new Error("Razorpay SDK not available on window");

            const rzp = new RazorpayCtor({
                key: keyId,
                amount: order.amount,
                currency: order.currency,
                name: "facestyle.fun",
                description: "20 Credits",
                order_id: order.id,
                prefill: { name: "Sri", email: "sri@example.com", contact: "9999999999" },
                notes: { plan: "20_credits" },
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    const verifyRes = await fetch("/.netlify/functions/verify-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(response),
                    });
                    const result = await verifyRes.json();
                    if (verifyRes.ok && result?.ok) {
                        alert("Payment successful — credits added!");
                    } else {
                        alert("Verification failed. Please contact support.");
                    }
                },
                theme: { color: "#0b72e7" },
            });

            rzp.on("payment.failed", (res: unknown) => {
                console.error("Payment failed:", res);
                alert("Payment failed. Please try again.");
            });
            rzp.open();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(msg);
            alert(msg);
        } finally {
            setLoading(false);
        }
    }, [keyId]);

    return (
        <button
            onClick={handlePay}
            disabled={!canPay || loading}
            style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
                cursor: canPay && !loading ? "pointer" : "not-allowed",
                opacity: canPay && !loading ? 1 : 0.6,
            }}
            title={!canPay ? "Set VITE_RAZORPAY_KEY_ID in Netlify env to enable" : undefined}
        >
            {loading ? "Processing..." : "Pay ₹199 for 20 credits"}
        </button>
    );
}

/** ——— Layout that shows your app + a payment panel ——— */
export default function App() {
    return (
        <main style={{ minHeight: "100vh", padding: 24, color: "#dff7ff", background: "#0b0f14" }}>
            <header style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <h1 style={{ margin: 0, fontSize: 42, letterSpacing: 0.2 }}>Buy Credits</h1>
                <span style={{ opacity: 0.8 }}>Secure checkout with Razorpay. Test mode supported.</span>
            </header>

            <hr style={{ borderColor: "#1b2430", margin: "16px 0" }} />

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1fr) 320px",
                    gap: 24,
                    alignItems: "start",
                }}
            >
                {/* Left: your full app */}
                <div
                    style={{
                        padding: 16,
                        background: "#0f1520",
                        border: "1px solid #1b2430",
                        borderRadius: 12,
                    }}
                >
                    <Studio />
                </div>

                {/* Right: payment panel */}
                <aside
                    style={{
                        padding: 16,
                        background: "#0f1520",
                        border: "1px solid #1b2430",
                        borderRadius: 12,
                        position: "sticky",
                        top: 16,
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Credits</h3>
                    <p style={{ marginTop: 0, opacity: 0.8 }}>Get 20 credits for ₹199</p>
                    <RazorpayButton />
                    <p style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>
                        Tip: set <code>VITE_RAZORPAY_KEY_ID</code> in Netlify env to enable the button.
                    </p>
                </aside>
            </div>
        </main>
    );
}
export function Studio() {
    return <section>{/* your UI */}</section>;
}