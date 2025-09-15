import React, { useEffect, useRef, useState } from 'react';
import { PAYPAL_CLIENT_ID } from '../config';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  amount: string;
  description: string;
  onSuccess: (details: any) => void;
  onError: (error: string) => void;
  onProcessing: () => void;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, description, onSuccess, onError, onProcessing }) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      console.error("PayPal Client ID is not configured. Set VITE_PAYPAL_CLIENT_ID_... in your environment.");
      setSdkError(true);
      return;
    }

    if (window.paypal) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;

    script.onload = () => {
      setSdkReady(true);
    };
    script.onerror = () => {
      console.error("Failed to load PayPal SDK script.");
      setSdkError(true);
    };

    document.body.appendChild(script);

  }, []);

  useEffect(() => {
    if (sdkReady && paypalRef.current) {
      // Clear previous buttons before rendering new ones to avoid duplicates.
      paypalRef.current.innerHTML = '';

      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          onProcessing();
          try {
            return actions.order.create({
              purchase_units: [{
                description: description,
                amount: {
                  value: amount,
                  currency_code: 'USD',
                },
              }],
              application_context: {
                shipping_preference: 'NO_SHIPPING',
              }
            });
          } catch (err) {
            onError('Failed to create PayPal order.');
            console.error('PayPal createOrder error:', err);
            throw err;
          }
        },

        onApprove: async (data: any, actions: any) => {
          try {
            const details = await actions.order.capture();
            onSuccess(details);
          } catch (err) {
            onError('Failed to capture PayPal transaction.');
            console.error('PayPal onApprove error:', err);
            throw err;
          }
        },

        onError: (err: any) => {
          onError('An error occurred during the PayPal transaction.');
          console.error('PayPal SDK Error:', err);
        },
      }).render(paypalRef.current).catch((err: any) => {
        console.error('Failed to render PayPal Buttons:', err);
        setSdkError(true);
      });
    }
  }, [sdkReady, amount, description, onSuccess, onError, onProcessing]);

  if (sdkError || !PAYPAL_CLIENT_ID) {
    return (
      <div className="text-center p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg">
        <p className="font-semibold text-yellow-300">PayPal Payments Unavailable</p>
        <p className="text-sm text-slate-400 mt-1">
          The application is not configured for payments. The app owner needs to set this up.
        </p>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="text-center p-4">
        <p className="text-slate-400 animate-pulse">Loading payment options...</p>
      </div>
    );
  }

  return <div ref={paypalRef} className="z-10 w-full flex justify-center"></div>;
};

export default PayPalButton;