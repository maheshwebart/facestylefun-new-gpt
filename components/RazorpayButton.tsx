import React from 'react';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { RAZORPAY_KEY_ID } from '../config';

declare var Razorpay: any;

interface RazorpayButtonProps {
  amount: string;
  description: string;
  currency: string;
  onSuccess: (response: any) => void;
  onError: (error: string) => void;
  disabled: boolean;
}

const RazorpayLogo = () => (
  <svg width="80" height="20" viewBox="0 0 91 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <path d="M8.28 19.95L0 0H5.85L10.35 12.87L14.85 0H20.7L12.42 19.95H8.28Z" fill="white" />
    <path d="M25.7 12.57C25.7 12.57 26.54 15.3 29.5 15.3C32.46 15.3 33.3 12.57 33.3 12.57V0H38.15V13.2C38.15 17.5 34.25 20.2 29.5 20.2C24.75 20.2 20.85 17.5 20.85 13.2V0H25.7V12.57Z" fill="white" />
    <path d="M51.2 19.95L42.92 0H48.77L53.27 12.87L57.77 0H63.62L55.34 19.95H51.2Z" fill="white" />
    <path d="M72.08 19.55L69.33 16.95H64.9V19.95H60.05V0H69.43C73.43 0 75.98 2.2 75.98 6C75.98 8.85 74.33 10.65 72.18 11.4L76.58 19.55H72.08ZM69.13 4.35H64.9V12.6H69.13C71.33 12.6 72.53 11 72.53 8.5C72.53 6 71.33 4.35 69.13 4.35Z" fill="white" />
    <path d="M84.155 4.3H78.305V8.25H83.805V12.15H78.305V16H84.505V19.95H73.455V0H84.505V4.3H84.155Z" fill="white" />
  </svg>
);

const RazorpayButton: React.FC<RazorpayButtonProps> = ({ amount, description, currency, onSuccess, onError, disabled }) => {
  const { user } = useAuth();

  const handlePayment = () => {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: parseFloat(amount) * 100, // Amount in paisa for INR
      currency: currency,
      name: "facestyle.fun",
      description: description,
      handler: function (response: any) {
        onSuccess(response);
      },
      prefill: {
        email: user?.email || '',
      },
      theme: {
        color: "#06b6d4", // cyan-500
      },
      modal: {
        ondismiss: function () {
          // This is commented out as it can be annoying if a user just closes the modal
          // onError('Payment modal was closed.'); 
        }
      }
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response.error);
        onError(`Payment failed: ${response.error.description || 'An unknown error occurred.'} (Reason: ${response.error.reason || 'not specified'})`);
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay Error:", err);
      onError("Could not initialize Razorpay. Please check your connection and try again.");
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || !RAZORPAY_KEY_ID}
      className="!bg-[#02042B] hover:!bg-[#151842] focus:ring-indigo-400 w-full"
    >
      Pay with <span className="ml-2"><RazorpayLogo /></span>
    </Button>
  );
};

export default RazorpayButton;