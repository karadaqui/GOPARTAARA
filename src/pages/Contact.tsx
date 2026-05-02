import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Twitter, Youtube, CheckCircle, Phone, MessageCircle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DEPARTMENTS = [
  { value: "General enquiry", subjectPrefix: "General Enquiry" },
  { value: "Technical support", subjectPrefix: "Technical Support" },
  { value: "Partnership / supplier enquiry", subjectPrefix: "Partnership Enquiry" },
  { value: "Press & media", subjectPrefix: "Press & Media" },
  { value: "Business / trade account", subjectPrefix: "Business / Trade Account" },
  { value: "Report an issue", subjectPrefix: "Issue Report" },
] as const;

const DEPARTMENT_NOTES: Record<string, string> = {
  "Partnership / supplier enquiry":
    "For supplier partnerships, email partnerships@gopartara.com directly for faster response.",
  "Press & media":
    "For press enquiries, email press@gopartara.com with your publication name.",
};

const SUBJECTS = DEPARTMENTS.map((d) => d.value);

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  color: "#cc1111",
  textTransform: "uppercase",
  marginBottom: "12px",
  display: "inline-block",
};

const Contact = () => {
  const [form, setForm] = useState<{ name: string; email: string; subject: string; message: string }>({
    name: "",
    email: "",
    subject: DEPARTMENTS[0].value,
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSending(true);
    try {
      const dept = DEPARTMENTS.find((d) => d.value === result.data.subject);
      const subjectPrefix = dept?.subjectPrefix || result.data.subject;
      const composedSubject = `${subjectPrefix} — ${result.data.message.slice(0, 60)}${result.data.message.length > 60 ? "…" : ""}`;

      const { error: dbError } = await supabase.from("contact_messages" as any).insert({
        name: result.data.name,
        email: result.data.email,
        subject: composedSubject,
        message: result.data.message,
      } as any);

      if (dbError) throw dbError;

      const submissionId = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-notification",
          recipientEmail: "info@gopartara.com",
          idempotencyKey: `contact-notify-${submissionId}`,
          replyTo: result.data.email,
          templateData: {
            name: result.data.name,
            email: result.data.email,
            message: `[${composedSubject}] ${result.data.message}`,
          },
        },
      });

      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: result.data.email,
          idempotencyKey: `contact-confirm-${submissionId}`,
          templateData: { name: result.data.name },
        },
      });

      setSent(true);
      setForm({ name: "", email: "", subject: DEPARTMENTS[0].value, message: "" });
    } catch {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Us | GOPARTARA"
        description="Get in touch with the GOPARTARA team. We respond within 24 hours. Email info@gopartara.com or use our contact form."
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact GOPARTARA",
          "url": "https://gopartara.com/contact",
        }}
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container px-4 max-w-5xl mx-auto">
          {/* Header */}
          <div style={{ paddingTop: "20px", paddingBottom: "48px" }}>
            <Breadcrumbs
              className="mb-6"
              items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
            />
            <span style={SECTION_LABEL}>Contact</span>
            <h1
              className="font-display"
              style={{
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "white",
                lineHeight: 1.05,
              }}
            >
              Get in Touch
            </h1>
            <p style={{ fontSize: "16px", color: "#71717a", marginTop: "16px" }}>
              We respond within 24 hours.
            </p>
          </div>

          {/* Two columns */}
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
            {/* LEFT — contact methods */}
            <div>
              <span style={SECTION_LABEL}>Reach Us</span>
              <div className="mt-2">
                <ContactMethod
                  icon={<Mail size={18} style={{ color: "#cc1111" }} />}
                  label="Email"
                  value="info@gopartara.com"
                  href="mailto:info@gopartara.com"
                />
                <ContactMethod
                  icon={<Phone size={18} style={{ color: "#cc1111" }} />}
                  label="Phone / WhatsApp Business"
                  value="07423 753090"
                  href="tel:+447423753090"
                />
                <div style={{ padding: "0 0 16px 56px", marginTop: "-8px" }}>
                  <p style={{ fontSize: "13px", color: "#a1a1aa", lineHeight: 1.5, marginBottom: "6px" }}>
                    Calls may not always be answered. For a faster response, please message us on WhatsApp.
                  </p>
                  <p style={{ fontSize: "12px", color: "#71717a", marginBottom: "12px" }}>
                    Available Monday–Friday, 9am–5pm (UK time)
                  </p>
                  <a
                    href="https://wa.me/447423753090"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
                    style={{
                      background: "#25D366",
                      color: "white",
                      fontSize: "13px",
                      fontWeight: 600,
                      padding: "8px 14px",
                      borderRadius: "8px",
                    }}
                  >
                    <MessageCircle size={15} />
                    Message on WhatsApp
                  </a>
                </div>
                <ContactMethod
                  icon={<Twitter size={18} style={{ color: "#cc1111" }} />}
                  label="X (Twitter)"
                  value="@gopartara"
                  href="https://x.com/gopartara"
                />
                <ContactMethod
                  icon={<Youtube size={18} style={{ color: "#cc1111" }} />}
                  label="YouTube"
                  value="@gopartara"
                  href="https://www.youtube.com/@gopartara"
                />
              </div>

              <p
                style={{
                  fontSize: "13px",
                  color: "#71717a",
                  lineHeight: 1.6,
                  marginTop: "32px",
                  paddingTop: "24px",
                  borderTop: "1px solid #1f1f1f",
                }}
              >
                For business enquiries and partnerships, email{" "}
                <a
                  href="mailto:partnerships@gopartara.com"
                  style={{ color: "#cc1111", textDecoration: "none", fontWeight: 600 }}
                >
                  partnerships@gopartara.com
                </a>
                .
              </p>
            </div>

            {/* RIGHT — form */}
            <div>
              {sent ? (
                <div
                  className="text-center"
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid #1f1f1f",
                    borderRadius: "16px",
                    padding: "40px 32px",
                  }}
                >
                  <CheckCircle size={40} className="mx-auto mb-4" style={{ color: "#4ade80" }} />
                  <h3 className="font-display text-white" style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
                    Message sent
                  </h3>
                  <p style={{ fontSize: "14px", color: "#71717a", marginBottom: "20px" }}>
                    We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    style={{
                      fontSize: "13px",
                      color: "#cc1111",
                      fontWeight: 600,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Send another message →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Field label="Name" error={errors.name}>
                    <Input
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      maxLength={100}
                      className="auth-input"
                    />
                  </Field>

                  <Field label="Email" error={errors.email}>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      maxLength={255}
                      className="auth-input"
                    />
                  </Field>

                  <Field label="Subject" error={errors.subject}>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="auth-input w-full px-3 appearance-none cursor-pointer"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: "36px",
                      }}
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s} style={{ background: "#0a0a0a" }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Message" error={errors.message}>
                    <Textarea
                      placeholder="How can we help?"
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      maxLength={2000}
                      className="auth-input"
                      style={{ height: "auto", paddingTop: "12px", paddingBottom: "12px", resize: "vertical" }}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full transition-opacity disabled:opacity-60"
                    style={{
                      height: "44px",
                      borderRadius: "8px",
                      background: "#cc1111",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      marginTop: "8px",
                    }}
                  >
                    {sending ? "Sending…" : "Send Message →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────── */

const ContactMethod = ({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) => (
  <a
    href={href}
    target={href.startsWith("http") ? "_blank" : undefined}
    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
    className="flex items-center gap-4 group"
    style={{
      padding: "20px 0",
      borderBottom: "1px solid #1f1f1f",
    }}
  >
    <div
      className="shrink-0 flex items-center justify-center rounded-lg"
      style={{ width: "40px", height: "40px", background: "rgba(204,17,17,0.1)" }}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p style={{ fontSize: "12px", color: "#52525b", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </p>
      <p
        className="group-hover:text-[#cc1111] transition-colors"
        style={{ fontSize: "15px", color: "white", fontWeight: 500, marginTop: "2px" }}
      >
        {value}
      </p>
    </div>
    <span
      className="text-zinc-700 group-hover:text-zinc-400 transition-colors"
      style={{ fontSize: "16px" }}
    >
      →
    </span>
  </a>
);

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label
      className="block"
      style={{
        fontSize: "12px",
        fontWeight: 500,
        color: "#a1a1aa",
        marginBottom: "6px",
      }}
    >
      {label}
    </label>
    {children}
    {error && (
      <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>{error}</p>
    )}
  </div>
);

export default Contact;
