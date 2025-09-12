import { PayPalButtons } from "@paypal/react-paypal-js";

interface Props {
    email: string;
    pack: string;
    onSuccess: (credits: number) => void;
    onError: (msg: string) => void;
}

export function PayPalBuy({ email, pack, onSuccess, onError }: Props) {
    return (
        <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={async () => {
                const res = await fetch("/.netlify/functions/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pack, email }),
                });
                const { id } = await res.json();
                return id;
            }}
            onApprove={async (data) => {
                const res = await fetch("/.netlify/functions/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderID: data.orderID, email }),
                });
                const { credits } = await res.json();
                onSuccess(credits);
            }}
            onError={(err) => onError(err?.message || "PayPal error")}
        />
    );
}
