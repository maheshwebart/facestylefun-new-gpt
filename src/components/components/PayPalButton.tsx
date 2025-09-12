import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  amount: string;
  description: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onProcessing: () => void;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, description, onSuccess, onError, onProcessing }) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);

  useEffect(() => {
    // Check if the PayPal SDK script has loaded.
    if (window.paypal) {
      setIsSdkReady(true);
    }
    // Note: A more complex implementation could poll for the script or use the `onLoad` callback
    // on the script tag, but for this app's structure, a simple check on mount is sufficient.
  }, []);

  useEffect(() => {
    if (isSdkReady && paypalRef.current) {
      // Clear previous buttons before rendering new ones to avoid duplicates.
      paypalRef.current.innerHTML = '';
      
      const renderButtons = () => {
          if (!window.paypal) {
              setIsSdkReady(false);
              return;
          }
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
              // If rendering fails (e.g., invalid client ID), show the error message.
              setIsSdkReady(false);
          });
      };
      
      renderButtons();
    }
  }, [isSdkReady, amount, description, onSuccess, onError, onProcessing]);

  if (!isSdkReady) {
    return (
      <div className="text-center p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg">
        <p className="font-semibold text-yellow-300">PayPal Payments Unavailable</p>
        <p className="text-sm text-slate-400 mt-1">
          This could be due to an invalid PayPal Client ID. The app owner needs to configure this to enable payments.
        </p>
      </div>
    );
  }

  return <div ref={paypalRef} className="z-10 w-full flex justify-center"></div>;
};

export default PayPalButton;
