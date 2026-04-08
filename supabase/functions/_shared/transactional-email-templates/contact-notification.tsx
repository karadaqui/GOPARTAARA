/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'PARTARA'
const PRIMARY = 'hsl(0, 85%, 50%)'

interface ContactNotificationProps {
  name?: string
  email?: string
  message?: string
}

const ContactNotificationEmail = ({ name, email, message }: ContactNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission from {name || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        {/* Header */}
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>

        {/* Content */}
        <Section style={content}>
          <Heading style={h1}>New Contact Submission</Heading>
          <Text style={subtitle}>Someone reached out via the contact form.</Text>

          <Hr style={divider} />

          {/* Field: Name */}
          <Text style={label}>NAME</Text>
          <Text style={value}>{name || 'Not provided'}</Text>

          {/* Field: Email */}
          <Text style={label}>EMAIL</Text>
          <Text style={valueLink}>{email || 'Not provided'}</Text>

          <Hr style={divider} />

          {/* Field: Message */}
          <Text style={label}>MESSAGE</Text>
          <Section style={messageBox}>
            <Text style={messageText}>{message || 'No message provided.'}</Text>
          </Section>

          <Hr style={divider} />

          <Text style={hint}>
            Reply directly to this email to respond to the customer — the reply-to is set to their address.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            This notification was sent by {SITE_NAME} · Contact Form
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) => `New contact: ${data.name || 'Website visitor'}`,
  to: 'info@gopartara.com',
  displayName: 'Contact form notification',
  previewData: { name: 'Jane Smith', email: 'jane@example.com', message: 'I need help finding brake pads for my 2019 Ford Focus.' },
} satisfies TemplateEntry

// ─── Styles ───────────────────────────────────────────────
const main = {
  backgroundColor: '#f4f4f5',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
}
const wrapper = {
  maxWidth: '580px',
  margin: '0 auto',
  padding: '24px 16px',
}
const header = {
  backgroundColor: '#111111',
  borderRadius: '12px 12px 0 0',
  padding: '28px 32px',
  textAlign: 'center' as const,
}
const logoText = {
  fontSize: '26px',
  fontWeight: '800' as const,
  letterSpacing: '4px',
  color: '#ffffff',
  margin: '0',
  fontFamily: "'Space Grotesk', 'Inter', Arial, sans-serif",
}
const content = {
  backgroundColor: '#ffffff',
  padding: '32px 32px 24px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#111111',
  margin: '0 0 6px',
}
const subtitle = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0 0 24px',
  lineHeight: '1.5',
}
const divider = {
  borderColor: '#e4e4e7',
  margin: '20px 0',
}
const label = {
  fontSize: '11px',
  fontWeight: '600' as const,
  color: PRIMARY,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px',
}
const value = {
  fontSize: '15px',
  color: '#18181b',
  margin: '0 0 16px',
  lineHeight: '1.5',
}
const valueLink = {
  ...value,
  color: PRIMARY,
}
const messageBox = {
  backgroundColor: '#fafafa',
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 16px',
}
const messageText = {
  fontSize: '14px',
  color: '#27272a',
  lineHeight: '1.7',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}
const hint = {
  fontSize: '12px',
  color: '#a1a1aa',
  fontStyle: 'italic' as const,
  margin: '0',
  lineHeight: '1.5',
}
const footer = {
  backgroundColor: '#111111',
  borderRadius: '0 0 12px 12px',
  padding: '18px 32px',
  textAlign: 'center' as const,
}
const footerText = {
  fontSize: '11px',
  color: '#71717a',
  margin: '0',
}
