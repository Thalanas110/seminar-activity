import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // First, check for local credentials shipped via Vite env vars.
    // Vite exposes env vars prefixed with VITE_ via import.meta.env
    const envEmail = (import.meta.env.VITE_USER_EMAIL as string) || '';
    const envPass = (import.meta.env.VITE_PASSWORD as string) || '';

    // If env credentials are set, validate and authenticate via Supabase
    // so that we obtain a real session (required for Row Level Security).
    if (envEmail && envPass) {
      if (email === envEmail && password === envPass) {
        try {
          const res = await supabase.auth.signInWithPassword({ email, password });
          // Log full response for debugging (includes HTTP status when available)
          console.debug('supabase.signInWithPassword response:', res);

          const { data, error } = res;
          if (error) {
            // If invalid credentials and auto-create is enabled, attempt signUp (dev-only)
            const autoCreate = (import.meta.env.VITE_AUTO_CREATE_LOCAL_USER as string) === 'true';
            const isInvalidCredentials = (error as any).status === 400 || (error as any).message?.toLowerCase?.().includes('invalid');
            if (autoCreate && isInvalidCredentials) {
              console.info('Attempting to auto-create local user (VITE_AUTO_CREATE_LOCAL_USER=true)');
              try {
                const signup = await supabase.auth.signUp({ email, password });
                console.debug('supabase.signUp response:', signup);
              } catch (suErr) {
                console.error('Error during auto signUp:', suErr);
              }

              // Try signing in again
              const retry = await supabase.auth.signInWithPassword({ email, password });
              console.debug('Retry signIn response:', retry);
              if ((retry as any).error) {
                console.error('Retry signIn failed:', (retry as any).error);
                return { error: (retry as any).error };
              }
              setSession(((retry as any).data as any)?.session ?? null);
              setUser(((retry as any).data as any)?.user ?? null);
              setLoading(false);
              return { error: null };
            }

            // Otherwise surface the original error
            console.error('Supabase auth error:', error);
            return { error };
          }

          setSession((data as any).session ?? null);
          setUser((data as any).user ?? null);
          setLoading(false);
          return { error: null };
        } catch (err) {
          // Unexpected network/parse errors
          console.error('Unexpected error during signInWithPassword:', err);
          return { error: { message: 'Unexpected authentication error', details: err } };
        }
      }

      // Credentials provided but do not match env — return error immediately.
      return { error: { message: 'Invalid credentials' } };
    }

    // Fallback: no local env credentials — use Supabase authentication
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Clear local state for env-based login
    setUser(null);
    setSession(null);

    // Attempt to sign out of Supabase as well (no-op if not signed in)
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore errors during sign out
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};