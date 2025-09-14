import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <PayPalScriptProvider options={{ clientId, currency: "USD" }}>
            <App />
        </PayPalScriptProvider>
    </React.StrictMode>
);
