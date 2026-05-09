/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'

function OrderConfirmationBuyer(d: any) {
  const isCollection = d.fulfillment_method === 'collection'
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: 600, margin: '0 auto', backgroundColor: '#ffffff' }}>
      <div style={{ background: '#0a1628', padding: '32px 24px', textAlign: 'center' as const, borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#fff', fontSize: 24, margin: 0 }}>Order confirmed ✅</h1>
        <p style={{ color: '#fbbf24', fontSize: 14, marginTop: 8 }}>Order #{d.order_number}</p>
      </div>
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 14, color: '#111' }}>Hi {d.buyer_name || 'there'}, thanks for your order on GOPARTARA.</p>
        <div style={{ margin: '16px 0', padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#0a1628' }}>{d.product_title}</p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#475569' }}>Item: £{Number(d.amount || 0).toFixed(2)}</p>
          {!isCollection && Number(d.shipping_fee) > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>Shipping: £{Number(d.shipping_fee).toFixed(2)}</p>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 15, fontWeight: 700, color: '#0a1628' }}>Total: £{Number(d.total_amount || 0).toFixed(2)}</p>
        </div>
        {isCollection ? (
          <div style={{ margin: '16px 0', padding: 16, background: '#fef3c7', borderRadius: 8 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>🏪 Collect from {d.seller_business || 'seller'}</p>
            {d.collection_address && (
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>{[d.collection_address.street1, d.collection_address.city, d.collection_address.postcode].filter(Boolean).join(', ')}</p>
            )}
            {d.collection_window && <p style={{ margin: '4px 0 0', fontSize: 13 }}>⏱ {d.collection_window}</p>}
            {d.collection_instructions && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>📝 {d.collection_instructions}</p>}
          </div>
        ) : (
          <div style={{ margin: '16px 0', padding: 16, background: '#f1f5f9', borderRadius: 8 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>📦 Delivering to</p>
            {d.shipping_address && (
              <>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>{d.shipping_address.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#475569' }}>
                  {[d.shipping_address.street1, d.shipping_address.street2, d.shipping_address.city, d.shipping_address.zip, d.shipping_address.country].filter(Boolean).join(', ')}
                </p>
              </>
            )}
          </div>
        )}
        <div style={{ textAlign: 'center' as const, marginTop: 24 }}>
          <a href="https://gopartara.com/messages" style={{ display: 'inline-block', padding: '12px 28px', background: '#0a1628', color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 600 }}>
            Contact Seller
          </a>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' as const, marginTop: 24 }}>Questions? info@gopartara.com</p>
      </div>
    </div>
  )
}

export const template: TemplateEntry = {
  component: OrderConfirmationBuyer,
  subject: (d) => `Order ${d.order_number} confirmed — GOPARTARA`,
  displayName: 'Order Confirmation (Buyer)',
  previewData: { order_number: 'GP-ABC123', buyer_name: 'Jane', product_title: 'Brake pads — BMW 3 Series', amount: 49.99, shipping_fee: 4.99, total_amount: 54.98, fulfillment_method: 'delivery', shipping_address: { name: 'Jane Doe', street1: '12 High Street', city: 'London', zip: 'SW1A 1AA', country: 'GB' } },
}
