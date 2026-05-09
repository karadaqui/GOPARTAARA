/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'

function OrderReceivedSeller(d: any) {
  const isCollection = d.fulfillment_method === 'collection'
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: 600, margin: '0 auto', backgroundColor: '#ffffff' }}>
      <div style={{ background: '#16a34a', padding: '32px 24px', textAlign: 'center' as const, borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#fff', fontSize: 24, margin: 0 }}>New order! 🎉</h1>
        <p style={{ color: '#dcfce7', fontSize: 14, marginTop: 8 }}>Order #{d.order_number}</p>
      </div>
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 14 }}>You just received a new order on GOPARTARA.</p>
        <div style={{ margin: '16px 0', padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{d.product_title}</p>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>Buyer: <strong>{d.buyer_name}</strong> {d.buyer_email && <span style={{ color: '#64748b' }}>· {d.buyer_email}</span>}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>Order total: £{Number(d.total_amount || 0).toFixed(2)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Your payout (after fee): £{Number(d.payout_amount || 0).toFixed(2)}</p>
          {d.is_new_account && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#b45309', fontWeight: 600 }}>⚠️ New account (less than 7 days)</p>
          )}
        </div>
        {isCollection ? (
          <div style={{ margin: '16px 0', padding: 16, background: '#fef3c7', borderRadius: 8 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>🏪 Collection requested</p>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>The buyer will collect from your store.</p>
          </div>
        ) : (
          <div style={{ margin: '16px 0', padding: 16, background: '#f1f5f9', borderRadius: 8 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>📦 Ship to</p>
            {d.shipping_address && (
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                {d.shipping_address.name}<br />
                {[d.shipping_address.street1, d.shipping_address.street2, d.shipping_address.city, d.shipping_address.zip, d.shipping_address.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        )}
        <div style={{ textAlign: 'center' as const, marginTop: 24 }}>
          <a href="https://gopartara.com/my-market" style={{ display: 'inline-block', padding: '12px 28px', background: '#0a1628', color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 600 }}>
            Go to My Orders
          </a>
        </div>
      </div>
    </div>
  )
}

export const template: TemplateEntry = {
  component: OrderReceivedSeller,
  subject: (d) => `New order ${d.order_number} — £${Number(d.total_amount || 0).toFixed(2)}`,
  displayName: 'Order Received (Seller)',
  previewData: { order_number: 'GP-ABC123', product_title: 'Brake pads', buyer_name: 'Jane Doe', buyer_email: 'jane@x.com', total_amount: 54.98, payout_amount: 47.23, fulfillment_method: 'delivery', shipping_address: { name: 'Jane Doe', street1: '12 High St', city: 'London', zip: 'SW1A 1AA', country: 'GB' } },
}
