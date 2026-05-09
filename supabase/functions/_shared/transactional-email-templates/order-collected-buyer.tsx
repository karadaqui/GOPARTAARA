/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'

function OrderCollected(d: any) {
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: 600, margin: '0 auto', backgroundColor: '#fff' }}>
      <div style={{ background: '#16a34a', padding: '28px 24px', textAlign: 'center' as const, borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#fff', fontSize: 22, margin: 0 }}>Marked as collected ✅</h1>
        <p style={{ color: '#fff', fontSize: 14, marginTop: 6 }}>Order #{d.order_number}</p>
      </div>
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 14 }}>Hi {d.buyer_name || 'there'},</p>
        <p style={{ fontSize: 14 }}>The seller has confirmed that you collected your order in store. Thanks for shopping on GOPARTARA!</p>
        <div style={{ margin: '16px 0', padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{d.product_title}</p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#475569' }}>Total: £{d.total}</p>
        </div>
        <p style={{ fontSize: 13, color: '#475569' }}>If something isn't right, please reply to this email or message the seller directly.</p>
      </div>
    </div>
  )
}

export const template: TemplateEntry = {
  component: OrderCollected,
  subject: (d) => `Collection confirmed — Order ${d.order_number}`,
  displayName: 'Order Collected (Buyer)',
  previewData: { order_number: 'GP-ABC123', product_title: 'Brake pads', total: '49.99', buyer_name: 'Sam' },
}
