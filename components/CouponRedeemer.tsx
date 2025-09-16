import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import Spinner from './Spinner';

const CouponRedeemer: React.FC = () => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { refreshProfile, user } = useAuth();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !supabase || !user) return;

    setLoading(true);
    setMessage(null);

    try {
        const rpcPromise = supabase.rpc('redeem_coupon', {
            coupon_code: couponCode.trim(),
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. Please try again later.')), 15000)
        );

        // Race the RPC call against the timeout
        // Fix: Cast the result of Promise.race to satisfy TypeScript's type inference.
        const result: { data: any; error: any; } = await Promise.race<any>([rpcPromise, timeoutPromise]);
        
        const { data, error } = result;

        if (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
            console.error('RPC Error:', error);
        } else if (data) {
            const responseText = data as string;
            if (responseText.startsWith('Success')) {
                setMessage({ type: 'success', text: responseText });
                await refreshProfile(); // Refresh user profile to show new credits
                setCouponCode('');
            } else {
                setMessage({ type: 'error', text: responseText.replace('Error: ', '') });
            }
        }
    } catch (err) {
        if (err instanceof Error) {
            setMessage({ type: 'error', text: `Error: ${err.message}` });
        } else {
            setMessage({ type: 'error', text: 'An unknown error occurred.' });
        }
        console.error('Coupon redemption error:', err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-700">
      <h4 className="text-lg font-semibold text-center text-slate-300 mb-3">Have a Coupon Code?</h4>
      <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row items-stretch gap-3 max-w-md mx-auto">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="ENTER COUPON CODE"
          className="flex-grow bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors disabled:opacity-50 text-center sm:text-left tracking-widest"
          disabled={loading || !user}
          aria-label="Coupon Code"
        />
        <Button type="submit" variant="secondary" disabled={loading || !couponCode.trim() || !user}>
          {loading ? <Spinner /> : 'Redeem'}
        </Button>
      </form>
      {!user && <p className="text-center text-yellow-400 text-xs mt-2">You must be logged in to redeem a coupon.</p>}
      {message && (
        <p className={`text-center text-sm mt-3 font-semibold ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default CouponRedeemer;