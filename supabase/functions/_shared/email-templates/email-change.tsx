/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for PARTARA</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoRow}>
          <span style={logoPart}>PART</span>
          <span style={logoAra}>ARA</span>
        </div>
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your PARTARA email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', 'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logoRow = { marginBottom: '30px' } as React.CSSProperties
const logoPart = { fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(0, 85%, 50%)' }
const logoAra = { fontSize: '28px', fontWeight: 'bold' as const, color: '#1a1a2e' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 25px' }
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(0, 85%, 50%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '30px 0 0' }
