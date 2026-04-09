import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ForgotPassword from "@/components/ForgotPassword";
import { lovable } from "@/integrations/lovable/index";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Capture referral code from URL
  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) {
      localStorage.setItem("partara_ref", refCode);
    }
  }, [refCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, displayName);

    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (isLogin) {
      // Process referral on login too (in case they signed up via OAuth with ref)
      processReferral();
      const redirectTo = searchParams.get("redirect") || "/";
      navigate(redirectTo);
    } else {
      toast({
        title: "Account created",
        description: "Check your email to confirm your account.",
      });
    }
  };

  const processReferral = async () => {
    const storedRef = localStorage.getItem("partara_ref");
    if (!storedRef) return;
    try {
      await supabase.functions.invoke("process-referral", {
        body: { referral_code: storedRef },
      });
    } catch {
      // silently fail
    } finally {
      localStorage.removeItem("partara_ref");
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const redirectTo = searchParams.get("redirect") || "/";
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}${redirectTo}`,
      });
      if (result.error) {
        toast({ title: "Error", description: String(result.error), variant: "destructive" });
      } else if (result.redirected) {
        return;
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "OAuth sign in failed", variant: "destructive" });
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <div className="glass rounded-2xl p-8 glow-red">
          {showForgot ? (
            <ForgotPassword onBack={() => setShowForgot(false)} />
          ) : (
            <>
              <div className="text-center mb-8">
                <a href="/" className="font-display text-2xl font-bold tracking-tight inline-block mb-2">
                  <span className="text-primary">PART</span>
                  <span className="text-foreground">ARA</span>
                </a>
                <h1 className="font-display text-xl font-semibold">
                  {isLogin ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {isLogin ? "Sign in to your account" : "Start finding parts faster"}
                </p>
              </div>

              {/* Social login buttons */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={!!oauthLoading}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-3 bg-white text-gray-700 font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {oauthLoading === "google" ? (
                    "Connecting..."
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth("apple")}
                  disabled={!!oauthLoading}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-3 bg-black text-white font-medium text-sm border border-black hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {oauthLoading === "apple" ? (
                    "Connecting..."
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or continue with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 bg-secondary border-border h-12 rounded-xl"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-secondary border-border h-12 rounded-xl"
                  />
                </div>

                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 pr-10 bg-secondary border-border h-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl text-sm font-semibold">
                  {submitting ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span className="text-primary font-medium">{isLogin ? "Sign up" : "Sign in"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
