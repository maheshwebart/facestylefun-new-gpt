import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
// FIX: Import AuthError as a value for `instanceof` checks, and other types as type-only.
import { AuthError } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
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

  useEffect(() => {
    if (!supabase) {
        setLoading(false);
        return;
    }
    
    // The onAuthStateChange listener is called once on attachment, handling the initial session check.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      } catch (e) {
          console.error("Error in onAuthStateChange handler:", e);
      } finally {
        setLoading(false); // Ensure loading is false after initial check and any auth changes.
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
  
  const refreshProfile = async () => {
    if (user && supabase) {
        setLoading(true);
        try {
          await fetchProfile(user.id);
        } finally {
          setLoading(false);
        }
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) return { error: null };
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
          setError(error);
          console.error('Sign in error:', error);
      } else {
          setError(null);
      }
      return { error };
    } catch (e) {
      const caughtError = e instanceof AuthError ? e : new AuthError('An unexpected error occurred during sign-in.');
      setError(caughtError);
      console.error('Unexpected Sign in error:', caughtError);
      return { error: caughtError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { user: null, error: null };
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email,
        password
      });
      if (error) {
          setError(error);
          console.error('Sign up error:', error);
      } else {
          setError(null);
      }
      return { user: data.user, error };
    } catch (e) {
      const caughtError = e instanceof AuthError ? e : new AuthError('An unexpected error occurred during sign-up.');
      setError(caughtError);
      console.error('Unexpected Sign up error:', caughtError);
      return { user: null, error: caughtError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    // Loading state will be set to false by the onAuthStateChange listener
  };
  
  const updateProfile = async (updates: Partial<Profile>) => {
      if (!supabase || !user) {
        throw new Error("Authentication error: Cannot update profile. User is not logged in.");
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();
            
        if (error) throw error;
        if (data) setProfile(data);
      } finally {
          setLoading(false);
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};