import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import Button from './Button';
import Spinner from './Spinner';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { signInWithPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitted(false);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    const { error: authError } = await signInWithPassword(email);
    if (authError) {
      setError(authError.message);
    } else {
      setIsSubmitted(true);
    }
  };

  return (
    <Modal title="Sign In or Create Account" onClose={onClose}>
      <div className="text-center">
        {isSubmitted ? (
          <div className="p-4">
            <h3 className="text-xl font-bold text-green-400">Check your inbox!</h3>
            <p className="text-slate-300 mt-2">
              We've sent a magic link to <span className="font-semibold text-cyan-400">{email}</span>.
            </p>
            <p className="text-slate-400 text-sm mt-1">Click the link in the email to sign in automatically.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-slate-400 mb-2">
              Enter your email to receive a secure "magic link" to sign in. No password needed!
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors"
              aria-label="Email for sign in"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner /> : 'Send Magic Link'}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;