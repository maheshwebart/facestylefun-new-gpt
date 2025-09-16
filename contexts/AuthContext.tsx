import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          setShowPurchaseModal(false);
          setPaymentStatus('idle');
          setShowAuthModal(true);
          setError("Authentication error. Please sign in to add credits to your account.");
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Error fetching initial session:", err);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        // Fetch profile without setting loading, as it's a background update
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error);
      console.error('Sign in error:', error);
    }
    setLoading(false);
    return { user: data?.user, error };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error);
      console.error('Sign up error:', error);
    }
    setLoading(false);
    return { user: data?.user, error };
  };

  const signOut = async () => {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates });

      if (error) throw error;

      setProfile((prev) => ({ ...prev, ...updates } as Profile));
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    error,
    signInWithPassword,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  if (!email || !password) {
    setError('Please enter your email and password.');
    return;
  }
  const { error: authError } = await signInWithPassword(email, password);
  if (authError) {
    setError(authError.message);
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
  }
};
