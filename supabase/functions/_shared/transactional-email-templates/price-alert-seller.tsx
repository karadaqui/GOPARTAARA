/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'PARTARA'
const PRIMARY = 'hsl(0, 85%, 50%)'

interface Props {
  listingTitle?: string
  targetPrice?: string
}

const PriceAlertSellerEmail = ({ listingTitle, targetPrice }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Someone set a price alert of £{targetPrice} on your listing "{listingTitle}"</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Price Alert Set on Your Listing 🔔</Heading>
          <Text style={text}>
            A buyer set a price alert of <strong>£{targetPrice || '0.00'}</strong> on your listing <strong>"{listingTitle || 'your part'}"</strong>.
          </Text>
          <Text style={text}>
            This means a buyer is interested in your part at this price point. Consider adjusting your price to attract more buyers.
          </Text>
          <Button style={button} href="https://car-part-search.lovable.app/my-market">
            View Your Listings
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PriceAlertSellerEmail,
  subject: (data: Record<string, any>) => `Price alert set: £${data.targetPrice || '0'} on "${data.listingTitle || 'your listing'}"`,
  displayName: 'Price alert seller notification',
  previewData: { listingTitle: 'BMW E46 Headlight Assembly', targetPrice: '45.00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto', padding: '20px 0' }
const header = { backgroundColor: '#0f1117', padding: '24px 30px', borderRadius: '8px 8px 0 0' }
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const content = { padding: '30px', backgroundColor: '#f8f8f8', borderRadius: '0 0 8px 8px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f1117', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: PRIMARY, color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
