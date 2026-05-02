/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface WelcomeSignupProps {
  display_name?: string
}

const WelcomeSignupEmail = ({ display_name }: WelcomeSignupProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to GOPARTARA — find car parts at the best prices</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoRow}>
          <span style={logoGo}>GO</span>
          <span style={logoPart}>PARTARA</span>
        </div>
        <Heading style={h1}>
          {display_name ? `Welcome aboard, ${display_name}! 🎉` : 'Welcome aboard! 🎉'}
        </Heading>
        <Text style={text}>
          Thanks for joining GOPARTARA — the smarter way to find car parts at the best prices.
        </Text>
        <Text style={text}>
          We simultaneously search trusted UK and global suppliers to bring you the cheapest
          car parts, with 1,000,000+ parts at your fingertips.
        </Text>
        <Button style={button} href="https://gopartara.com/search">
          Start Searching Parts
        </Button>
        <Text style={textSmall}>
          Need help? Just reply to this email or visit our help center.
        </Text>
        <Text style={footer}>The GOPARTARA Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeSignupEmail,
  subject: 'Welcome to GOPARTARA 🚗',
  displayName: 'Welcome (signup)',
  previewData: { display_name: 'Alex' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logoRow = { marginBottom: '30px' } as React.CSSProperties
const logoGo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#cc1111' }
const logoPart = { fontSize: '28px', fontWeight: 'bold' as const, color: '#0a1628' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0a1628', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const textSmall = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '24px 0 0' }
const button = {
  backgroundColor: '#0a1628',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0 16px',
}
const footer = { fontSize: '13px', color: '#94a3b8', margin: '30px 0 0' }
