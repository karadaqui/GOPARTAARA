/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'

const PLAN_FEATURES: Record<string, string[]> = {
  pro: ["Unlimited searches", "Photo search (AI-powered)", "Price alerts", "Unlimited garage vehicles", "Full search history"],
  elite: ["Everything in Pro", "CSV export", "30-day price tracking", "Vehicle notes", "Priority support", "Early access"],
  basic_seller: ["Seller profile", "Up to 20 listings", "Basic analytics"],
  featured_seller: ["Up to 100 listings", "Featured placement", "Advanced analytics"],
  pro_seller: ["Unlimited listings", "Top placement", "Verified badge"],
}

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro", elite: "Elite", basic_seller: "Basic Seller", featured_seller: "Featured Seller", pro_seller: "Pro Seller",
}

function WelcomePurchaseEmail({ plan_name, display_name, next_billing_date, billing_amount }: {
  plan_name: string; display_name: string; next_billing_date: string; billing_amount: string;
}) {
  const label = PLAN_LABELS[plan_name] || plan_name
  const features = PLAN_FEATURES[plan_name] || PLAN_FEATURES.pro

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: 600, margin: '0 auto', backgroundColor: '#ffffff' }}>
      <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', padding: '40px 30px', textAlign: 'center' as const, borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#ffffff', fontSize: 28, margin: 0, fontWeight: 700 }}>Welcome to PARTARA {label}! 🎉</h1>
        <p style={{ color: '#fecaca', fontSize: 14, marginTop: 8 }}>Thank you for subscribing, {display_name || 'there'}!</p>
      </div>

      <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#111' }}>Features unlocked:</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <tbody>
            {features.map((f, i) => (
              <tr key={i}>
                <td style={{ padding: '6px 0', verticalAlign: 'top' as const, width: 24, color: '#ef4444', fontSize: 16 }}>✓</td>
                <td style={{ padding: '6px 0', fontSize: 14, color: '#333' }}>{f}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ margin: '24px 0', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
            <strong style={{ color: '#111' }}>Next billing date:</strong> {next_billing_date || 'See dashboard'}
          </p>
          <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
            <strong style={{ color: '#111' }}>Amount:</strong> {billing_amount || 'See dashboard'}
          </p>
        </div>

        <div style={{ margin: '16px 0', padding: 16, backgroundColor: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
          <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
            <strong>Refund Policy:</strong> You have 7 days from today to request a full refund if you're not satisfied.
          </p>
        </div>

        <div style={{ textAlign: 'center' as const, marginTop: 24 }}>
          <a href="https://gopartara.com/dashboard" style={{ display: 'inline-block', padding: '12px 32px', backgroundColor: '#ef4444', color: '#ffffff', textDecoration: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            Go to Dashboard
          </a>
        </div>

        <p style={{ fontSize: 12, color: '#999', textAlign: 'center' as const, marginTop: 24 }}>
          Questions? Contact us at <a href="mailto:info@gopartara.com" style={{ color: '#ef4444' }}>info@gopartara.com</a>
        </p>
      </div>
    </div>
  )
}

export const template: TemplateEntry = {
  component: WelcomePurchaseEmail,
  subject: (data) => `Welcome to PARTARA ${PLAN_LABELS[data.plan_name] || data.plan_name}! 🎉`,
  displayName: 'Welcome Purchase',
  previewData: { plan_name: 'pro', display_name: 'John', next_billing_date: '10 May 2026', billing_amount: '£9.99' },
}
