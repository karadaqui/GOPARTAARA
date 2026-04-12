import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, Send, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SUBJECTS = [
  "General Enquiry",
  "Technical Support",
  "Billing",
  "Partnership / Business",
  "Report an Issue",
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
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
      // Save to contact_messages table
      const { error: dbError } = await supabase.from("contact_messages" as any).insert({
        name: result.data.name,
        email: result.data.email,
        subject: result.data.subject,
        message: result.data.message,
      } as any);

      if (dbError) throw dbError;

      // Send notification emails
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
            message: `[${result.data.subject}] ${result.data.message}`,
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
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Us | PARTARA"
        description="Get in touch with the PARTARA team. Have a question about car parts, pricing, or our platform? We'd love to hear from you."
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact PARTARA",
          "url": "https://gopartara.com/contact"
        }}
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container px-4 max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
              Contact Us
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Have a question, suggestion, or need help finding a part? Drop us a message and we'll get back to you.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-10">
            <div className="md:col-span-2 space-y-5">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Mail size={20} />
                </div>
                <h3 className="font-semibold mb-1">Email Us</h3>
                <a href="mailto:info@gopartara.com" className="text-sm text-primary hover:underline">
                  info@gopartara.com
                </a>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Clock size={20} />
                </div>
                <h3 className="font-semibold mb-1">Response Time</h3>
                <p className="text-sm text-muted-foreground">We typically respond within 24 hours on business days.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <MessageSquare size={20} />
                </div>
                <h3 className="font-semibold mb-1">Feedback Welcome</h3>
                <p className="text-sm text-muted-foreground">We're always improving — your feedback helps us build a better PARTARA.</p>
              </div>
            </div>

            <div className="md:col-span-3">
              {sent ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">Message sent!</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    ✅ We'll get back to you within 24 hours.
                  </p>
                  <Button variant="outline" className="rounded-xl" onClick={() => setSent(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="How can we help?" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>
                  <Button type="submit" disabled={sending} className="w-full gap-2">
                    <Send size={16} />
                    {sending ? "Sending…" : "Send Message"}
                  </Button>
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

export default Contact;
