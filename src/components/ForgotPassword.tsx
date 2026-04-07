import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <h2 className="font-display text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-muted-foreground text-sm mb-6">
          We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>
        </p>
        <button onClick={onBack} className="text-sm text-primary hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </button>
      <h2 className="font-display text-xl font-semibold mb-1">Reset your password</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl text-sm font-semibold">
          {submitting ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassword;
