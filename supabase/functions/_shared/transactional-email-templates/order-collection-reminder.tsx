/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'

function CollectionReminder(d: any) {
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: 600, margin: '0 auto', backgroundColor: '#fff' }}>
      <div style={{ background: '#fbbf24', padding: '28px 24px', textAlign: 'center' as const, borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#0a1628', fontSize: 22, margin: 0 }}>Collection reminder ⏱</h1>
        <p style={{ color: '#0a1628', fontSize: 14, marginTop: 6 }}>Order #{d.order_number}</p>
      </div>
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 14 }}>{d.recipient_role === 'seller' ? 'A buyer hasn\'t collected their order yet.' : 'Your order is still waiting to be collected.'}</p>
        <div style={{ margin: '16px 0', padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{d.product_title}</p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#475569' }}>Placed on {d.created_date}</p>
        </div>
        <p style={{ fontSize: 13, color: '#475569' }}>Please coordinate collection as soon as possible.</p>
        <div style={{ textAlign: 'center' as const, marginTop: 20 }}>
          <a href="https://gopartara.com/messages" style={{ display: 'inline-block', padding: '10px 24px', background: '#0a1628', color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 600 }}>
            Open Messages
          </a>
        </div>
      </div>
    </div>
  )
}

export const template: TemplateEntry = {
  component: CollectionReminder,
  subject: (d) => `Collection reminder — Order ${d.order_number}`,
  displayName: 'Collection Reminder',
  previewData: { order_number: 'GP-ABC123', product_title: 'Brake pads', created_date: '2 May 2026', recipient_role: 'buyer' },
}
