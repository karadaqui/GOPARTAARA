import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Process referral on first sign-in (after email confirmation)
      if (event === "SIGNED_IN" && session?.user) {
        // Handle post-OAuth redirect
        const pendingRedirect = localStorage.getItem("partara_auth_redirect");
        if (pendingRedirect) {
          localStorage.removeItem("partara_auth_redirect");
          setTimeout(() => navigate(pendingRedirect), 0);
        } else {
          // After email confirmation, redirect to homepage if on verify-email or auth page
          const currentPath = window.location.pathname;
          if (currentPath === "/verify-email" || currentPath === "/auth") {
            setTimeout(() => navigate("/"), 0);
          }
        }

        // Clean up hash fragment after Supabase processes it
        if (window.location.hash && window.location.hash.includes("access_token")) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }

        const storedRef = localStorage.getItem("partara_ref");
        if (storedRef) {
          try {
            await supabase.functions.invoke("process-referral", {
              body: { referral_code: storedRef },
            });
          } catch {
            // silently fail
          } finally {
            localStorage.removeItem("partara_ref");
          }
        }
      }
    });

    // Handle hash fragment from email confirmation redirect
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      // Supabase client auto-detects hash tokens during getSession(),
      // but we add a small delay to ensure the client has initialized
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setSession(session);
            setUser(session.user);
            setLoading(false);
            // Clean the URL and navigate home
            window.history.replaceState(null, "", "/");
            navigate("/");
          }
        });
      }, 500);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = window.location.hostname === 'localhost' 
      ? window.location.origin
      : 'https://gopartara.com';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { display_name: displayName },
      },
    });
    
    // If signup succeeded but user needs email confirmation,
    // sign out immediately to prevent auto-login before verification
    if (!error && data?.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
