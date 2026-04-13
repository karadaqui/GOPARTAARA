/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'PARTARA'
const PRIMARY = 'hsl(0, 85%, 50%)'

interface Props {
  name?: string
  listingTitle?: string
  listingPrice?: string
  reason?: string
}

const ListingRemovedEmail = ({ name, listingTitle, listingPrice, reason }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your listing "{listingTitle}" has been removed from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Your Listing Has Been Removed</Heading>
          <Text style={text}>
            Hi {name || 'there'},
          </Text>
          <Text style={text}>
            Your listing <strong>"{listingTitle || 'your part'}"</strong>
            {listingPrice ? ` (£${listingPrice})` : ''} has been removed by the {SITE_NAME} moderation team.
          </Text>
          {reason && (
            <Section style={reasonBox}>
              <Text style={reasonLabel}>Reason:</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>
          )}
          <Text style={text}>
            If you believe this was done in error, please contact our support team at info@gopartara.com or use the link below.
          </Text>
          <Button style={button} href="https://gopartara.com/contact">
            Contact Support
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ListingRemovedEmail,
  subject: (data: Record<string, any>) => `Your PARTARA listing has been removed`,
  displayName: 'Listing removed by admin',
  previewData: { name: 'John', listingTitle: 'BMW E46 Headlight Assembly', listingPrice: '49.99', reason: 'Prohibited item - replica parts are not allowed.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto', padding: '20px 0' }
const header = { backgroundColor: '#0f1117', padding: '24px 30px', borderRadius: '8px 8px 0 0' }
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const content = { padding: '30px', backgroundColor: '#f8f8f8', borderRadius: '0 0 8px 8px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f1117', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const reasonBox = { backgroundColor: '#fff3f3', border: '1px solid #fecaca', borderRadius: '6px', padding: '16px', margin: '0 0 24px' }
const reasonLabel = { fontSize: '12px', fontWeight: '600' as const, color: '#991b1b', margin: '0 0 4px', textTransform: 'uppercase' as const }
const reasonText = { fontSize: '14px', color: '#7f1d1d', margin: '0', lineHeight: '1.5' }
const button = { backgroundColor: PRIMARY, color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
