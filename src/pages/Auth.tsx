import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
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
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [resending, setResending] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) {
      localStorage.setItem("partara_ref", refCode);
    }
  }, [refCode]);

  const handleResendConfirmation = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast({ title: "Email sent!", description: "Check your inbox for the confirmation link." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to resend email", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlreadyRegistered(false);

    if (isLogin) {
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        processReferral();
        const redirectTo = searchParams.get("redirect") || "/";
        navigate(redirectTo);
      }
    } else {
      const { error } = await signUp(email, password, displayName);
      setSubmitting(false);

      if (error) {
        // Handle "User already registered" specifically
        if (error.message?.includes("already registered") || error.message?.includes("already_exists")) {
          setAlreadyRegistered(true);
        } else {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
      } else {
        // Email confirmation required - redirect to verify page
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }
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
      if (redirectTo !== "/") {
        localStorage.setItem("partara_auth_redirect", redirectTo);
      }
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: "Error", description: String(result.error), variant: "destructive" });
      } else if (result.redirected) {
        return;
      } else {
        const storedRedirect = localStorage.getItem("partara_auth_redirect") || "/";
        localStorage.removeItem("partara_auth_redirect");
        navigate(storedRedirect);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "OAuth sign in failed", variant: "destructive" });
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#080808" }}>
      <SEOHead title="Sign In — GOPARTARA" description="Sign in or create your free GOPARTARA account." path="/auth" noindex />
      {/* LEFT BRAND PANEL — desktop only */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{
          width: "40%",
          background: "#080808",
          padding: "48px",
          borderRight: "1px solid #1a1a1a",
        }}
      >
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Soft red glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "30%",
            left: "-20%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(204,17,17,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Logo */}
        <a href="/" className="relative z-10 inline-block">
          <span className="logo-text" style={{ fontSize: "28px" }}>
            <span className="logo-go">GO</span>
            <span className="logo-part">PART</span>
            <span className="logo-ara">ARA</span>
          </span>
        </a>

        {/* Headline + bullets */}
        <div className="relative z-10">
          <h2
            className="font-display"
            style={{
              fontSize: "42px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "white",
            }}
          >
            Find any car part.
            <br />
            <span style={{ color: "#cc1111" }}>Save every time.</span>
          </h2>

          <ul className="flex flex-col" style={{ marginTop: "24px", gap: "12px" }}>
            {[
              "Search 1,000,000+ parts instantly",
              "Compare prices across 7 UK suppliers",
              "Price alerts when parts drop",
            ].map((line) => (
              <li
                key={line}
                className="flex items-start gap-3"
                style={{ fontSize: "15px", color: "#a1a1aa", lineHeight: 1.5 }}
              >
                <span
                  className="shrink-0"
                  style={{
                    color: "#4ade80",
                    fontSize: "15px",
                    fontWeight: 700,
                    marginTop: "1px",
                  }}
                >
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div
          className="relative z-10"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#d4d4d8",
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            "Saved £40 on brake pads in minutes."
          </p>
          <p style={{ fontSize: "12px", color: "#71717a", marginTop: "8px" }}>
            — James T., Leeds UK <span style={{ color: "#fbbf24" }}>★★★★★</span>
          </p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors"
          style={{ color: "#71717a" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <div className="w-full" style={{ maxWidth: "380px" }}>
          {showForgot ? (
            <ForgotPassword onBack={() => setShowForgot(false)} />
          ) : (
            <>
              {/* Mobile-only logo */}
              <a href="/" className="lg:hidden inline-block mb-8">
                <span className="logo-text text-2xl">
                  <span className="logo-go">GO</span>
                  <span className="logo-part">PART</span>
                  <span className="logo-ara">ARA</span>
                </span>
              </a>

              <div className="mb-8">
                <h1
                  className="font-display"
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "white",
                  }}
                >
                  {isLogin ? "Sign in" : "Create your account"}
                </h1>
                <p style={{ fontSize: "14px", color: "#71717a", marginTop: "8px" }}>
                  {isLogin
                    ? "Welcome back. Find parts and track prices."
                    : "Free forever. No credit card needed."}
                </p>
              </div>

              {/* Already registered banner */}
              {alreadyRegistered && !isLogin && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-foreground mb-3">
                    This email is already registered. Please check your inbox for a confirmation email, or click below to resend it.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg"
                    disabled={resending}
                    onClick={handleResendConfirmation}
                  >
                    {resending ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} />
                        Resend confirmation email
                      </span>
                    )}
                  </Button>
                </div>
              )}

              {/* Social login buttons */}
              <div className="space-y-2.5 mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={!!oauthLoading}
                  className="w-full flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                  style={{
                    height: "44px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid #27272a",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => !oauthLoading && (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                >
                  {oauthLoading === "google" ? (
                    "Connecting..."
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24">
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
                  className="w-full flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                  style={{
                    height: "44px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid #27272a",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => !oauthLoading && (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                >
                  {oauthLoading === "apple" ? (
                    "Connecting..."
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ background: "#1f1f1f" }} />
                <span style={{ fontSize: "12px", color: "#52525b" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "#1f1f1f" }} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {!isLogin && (
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
                    <Input
                      type="text"
                      placeholder="Display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="auth-input pl-10"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setAlreadyRegistered(false); }}
                    required
                    className="auth-input pl-10"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="auth-input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#52525b" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="transition-colors"
                      style={{ fontSize: "12px", color: "#71717a" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#cc1111")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full transition-opacity disabled:opacity-60"
                  style={{
                    height: "44px",
                    borderRadius: "8px",
                    background: "#cc1111",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginTop: "4px",
                  }}
                >
                  {submitting ? "Please wait..." : isLogin ? "Sign In →" : "Create Account →"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setIsLogin(!isLogin); setAlreadyRegistered(false); }}
                  className="transition-colors"
                  style={{ fontSize: "13px", color: "#71717a" }}
                >
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span style={{ color: "#cc1111", fontWeight: 600 }}>{isLogin ? "Sign up" : "Sign in"}</span>
                </button>
              </div>

              <p
                className="text-center mt-6"
                style={{ fontSize: "11px", color: "#52525b", lineHeight: 1.5 }}
              >
                By continuing, you agree to our{" "}
                <a href="/terms" style={{ color: "#71717a", textDecoration: "underline" }}>Terms</a>
                {" "}&{" "}
                <a href="/privacy" style={{ color: "#71717a", textDecoration: "underline" }}>Privacy Policy</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
