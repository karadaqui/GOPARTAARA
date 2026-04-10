/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'PARTARA'

interface Props {
  userName?: string
}

const RefundConfirmationEmail = ({ userName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your refund request has been received — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Refund Request Received</Heading>
          <Text style={text}>
            {userName ? `Hi ${userName},` : 'Hi,'} we've received your refund request and your account has been downgraded to the Free plan.
          </Text>
          <Text style={text}>
            Your refund will be processed within 5-10 business days. The refund will be returned to your original payment method.
          </Text>
          <Text style={text}>
            If you have any questions, please contact us at <a href="mailto:info@gopartara.com" style={{ color: 'hsl(0, 85%, 50%)' }}>info@gopartara.com</a>.
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RefundConfirmationEmail,
  subject: 'Your refund request has been received',
  displayName: 'Refund confirmation',
  previewData: { userName: 'John' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto', padding: '20px 0' }
const header = { backgroundColor: '#0f1117', padding: '24px 30px', borderRadius: '8px 8px 0 0' }
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const content = { padding: '30px', backgroundColor: '#f8f8f8', borderRadius: '0 0 8px 8px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f1117', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
