
import React from 'react';
// Fix: OnApproveData and CreateOrderData are not exported from '@paypal/react-paypal-js'.
// They have been removed from the import statement.
import { PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalButtonProps {
  amount: string;
  description: string;
  onSuccess: (details: any) => void;
  onError: (error: string) => void;
  disabled: boolean;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, description, onSuccess, onError, disabled }) => {

  // Fix: Replaced the non-exported type `CreateOrderData` with `Record<string, unknown>`.
  const createOrder = (data: Record<string, unknown>, actions: any) => {
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
      console.error('PayPal createOrder error:', err);
      onError('Failed to create PayPal order. Please check the amount and try again.');
      throw err;
    }
  };

  // Fix: Replaced the non-exported type `OnApproveData` with `any`.
  const onApprove = async (data: any, actions: any) => {
    try {
      const details = await actions.order.capture();
      onSuccess(details);
    } catch (err) {
      console.error('PayPal onApprove error:', err);
      onError('Failed to capture PayPal transaction. Please try again.');
      throw err;
    }
  };

  const catchError = (err: any) => {
    console.error('PayPal SDK Error:', err);
    onError('An error occurred during the PayPal transaction. Please try again.');
  };

  return (
    <div className={`transition-opacity duration-300 ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <PayPalButtons
            style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={catchError}
            forceReRender={[amount, description]} // Re-render the button if the amount or description changes
        />
    </div>
  );
};

export default PayPalButton;
