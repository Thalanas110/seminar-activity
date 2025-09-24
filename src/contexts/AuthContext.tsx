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

    // If env credentials are set, validate locally and don't call Supabase.
    if (envEmail && envPass) {
      if (email === envEmail && password === envPass) {
        // Create a minimal local session/user to mirror expected shape
        const fakeUser = { id: 'local-admin', email } as unknown as User;
        setUser(fakeUser);
        setSession({} as Session); // leave minimal session object
        setLoading(false);
        return { error: null };
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