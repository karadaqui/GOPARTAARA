/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'PARTARA'

interface Props {
  userName?: string
  userEmail?: string
  plan?: string
  stripeCustomerId?: string
}

const RefundAdminNotificationEmail = ({ userName, userEmail, plan, stripeCustomerId }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Refund request from {userEmail || 'a user'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME} Admin</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Refund Request Received 💰</Heading>
          <Text style={text}>A user has requested a refund. Please process this manually in Stripe.</Text>
          <Section style={detailsBox}>
            <Text style={detailText}><strong>User:</strong> {userName || 'N/A'}</Text>
            <Text style={detailText}><strong>Email:</strong> {userEmail || 'N/A'}</Text>
            <Text style={detailText}><strong>Plan:</strong> {plan || 'N/A'}</Text>
            <Text style={detailText}><strong>Stripe Customer:</strong> {stripeCustomerId || 'N/A'}</Text>
          </Section>
          <Text style={text}>
            The user's account has been automatically downgraded to Free. Please process the refund in the Stripe dashboard.
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} System Notification</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RefundAdminNotificationEmail,
  subject: (data: Record<string, any>) => `Refund request from ${data.userEmail || 'a user'}`,
  displayName: 'Refund admin notification',
  previewData: { userName: 'John', userEmail: 'john@example.com', plan: 'Pro', stripeCustomerId: 'cus_abc123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto', padding: '20px 0' }
const header = { backgroundColor: '#0f1117', padding: '24px 30px', borderRadius: '8px 8px 0 0' }
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const content = { padding: '30px', backgroundColor: '#f8f8f8', borderRadius: '0 0 8px 8px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f1117', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const detailsBox = { backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px', margin: '0 0 24px' }
const detailText = { fontSize: '14px', color: '#333', lineHeight: '1.8', margin: '0' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
