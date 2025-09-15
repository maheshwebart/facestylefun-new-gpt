import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import Button from './Button';
import Spinner from './Spinner';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { signInWithPassword, signUp, loading } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    const { error: authError } = await signInWithPassword(email, password);
    if (authError) {
      if (authError.message === 'Email not confirmed') {
        setError('Please check your email to confirm your account before signing in.');
      } else {
        setError('Invalid login credentials. Please try again.');
      }
    } else {
      onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const { error: authError } = await signUp(email, password);
    if (authError) {
      setError(authError.message);
    } else {
      setIsSubmitted(true);
    }
  };

  return (
    <Modal title={authMode === 'signIn' ? 'Sign In' : 'Create Account'} onClose={onClose}>
      <div className="text-center">
        {isSubmitted ? (
          <div className="p-4">
            <h3 className="text-xl font-bold text-green-400">Confirm your email!</h3>
            <p className="text-slate-300 mt-2">
              We've sent a confirmation link to <span className="font-semibold text-cyan-400">{email}</span>.
            </p>
            <p className="text-slate-400 text-sm mt-1">Click the link in the email to activate your account.</p>
          </div>
        ) : (
          <form onSubmit={authMode === 'signIn' ? handleSignIn : handleSignUp} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors"
              required
              aria-label="Email address"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors"
              required
              aria-label="Password"
            />
            {authMode === 'signUp' && (
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors"
                required
                aria-label="Confirm Password"
              />
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner /> : (authMode === 'signIn' ? 'Sign In' : 'Create Account')}
            </Button>
            <p className="text-sm text-slate-400 mt-2">
              {authMode === 'signIn' ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signIn' ? 'signUp' : 'signIn');
                  setError('');
                }}
                className="font-semibold text-cyan-400 hover:text-cyan-300 ml-2"
              >
                {authMode === 'signIn' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;
