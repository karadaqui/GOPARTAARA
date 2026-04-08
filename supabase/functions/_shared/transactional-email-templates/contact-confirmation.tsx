/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'PARTARA'
const PRIMARY = 'hsl(0, 85%, 50%)'

interface ContactConfirmationProps {
  name?: string
}

const ContactConfirmationEmail = ({ name }: ContactConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your message — the {SITE_NAME} team will be in touch soon.</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        {/* Header */}
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>

        {/* Content */}
        <Section style={content}>
          <Heading style={h1}>
            {name ? `Thanks, ${name}!` : 'Thanks for reaching out!'}
          </Heading>
          <Text style={text}>
            We've received your message and a member of our team will get back to you within 24 hours.
          </Text>

          <Hr style={divider} />

          <Text style={text}>
            In the meantime, you can search for the part you need right away:
          </Text>

          <Section style={buttonWrapper}>
            <Button style={button} href="https://gopartara.com/#search">
              Search for Parts
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={signoff}>
            Best regards,
          </Text>
          <Text style={teamName}>The {SITE_NAME} Team</Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            © {SITE_NAME} · Your smarter way to find car parts
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'We received your message — PARTARA',
  displayName: 'Contact confirmation',
  previewData: { name: 'Jane' },
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
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#111111',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#3f3f46',
  lineHeight: '1.7',
  margin: '0 0 20px',
}
const divider = {
  borderColor: '#e4e4e7',
  margin: '24px 0',
}
const buttonWrapper = {
  textAlign: 'center' as const,
}
const button = {
  backgroundColor: PRIMARY,
  color: '#ffffff',
  borderRadius: '10px',
  padding: '14px 32px',
  fontSize: '15px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const signoff = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0 0 2px',
  lineHeight: '1.5',
}
const teamName = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#18181b',
  margin: '0',
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
