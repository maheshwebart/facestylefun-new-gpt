// src/App.tsx
import { useCallback, useMemo, useState } from "react";

/** Lightweight script loader (resolves true/false) */
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

/** Razorpay Pay Button (₹199 for 20 credits by default) */
function RazorpayButton() {
  const [loading, setLoading] = useState(false);

  // Only the key ID is exposed to the client. Keep secrets in functions.
  const keyId = useMemo(
    () => String(import.meta.env.VITE_RAZORPAY_KEY_ID ?? "").trim(),
    []
  );

  const canPay = keyId.length > 0;

  const handlePay = useCallback(async () => {
    setLoading(true);
    try {
      // 1) Create order on your Netlify Function
      const orderRes = await fetch("/.netlify/functions/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Amount is in paise. ₹199 => 19900
        body: JSON.stringify({ amount: 19900, currency: "INR" }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.text();
        throw new Error(`Create order failed: ${err}`);
      }
      const { order } = (await orderRes.json()) as {
        order: { id: string; amount: number; currency: string };
      };

      // 2) Load Razorpay Checkout SDK
      const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!ok) throw new Error("Failed to load Razorpay SDK");

      // 3) Open checkout
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "facestyle.fun",
        description: "20 Credits",
        order_id: order.id,
        prefill: {
          name: "Sri",
          email: "sri@example.com",
          contact: "9999999999",
        },
        notes: { plan: "20_credits" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 4) Verify signature on your backend
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
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) throw new Error("Razorpay SDK not available on window");

      const rzp = new RazorpayCtor(options);
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
    >
      {loading ? "Processing..." : "Pay ₹199 for 20 credits"}
    </button>
  );
}

/** App root — minimal, safe JSX */
export default function App() {
  return (
    <main className="page" style={{ minHeight: "100vh", padding: 24 }}>
      <header className="brand" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Buy Credits</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.8 }}>
          Secure checkout with Razorpay. Test mode supported.
        </p>
      </header>

      <RazorpayButton />

      <footer style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>
        Tip: set <code>VITE_RAZORPAY_KEY_ID</code> in Netlify env for this button to enable.
      </footer>
    </main>
  );
}
