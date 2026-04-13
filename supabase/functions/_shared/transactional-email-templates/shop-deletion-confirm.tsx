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
  listingCount?: string
  confirmUrl?: string
}

const ShopDeletionConfirmEmail = ({ name, listingCount, confirmUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm deletion of your {SITE_NAME} shop</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Confirm Shop Deletion</Heading>
          <Text style={text}>
            Hi {name || 'there'},
          </Text>
          <Text style={text}>
            You requested to permanently delete your {SITE_NAME} shop
            {listingCount ? ` and all ${listingCount} listings` : ''}.
          </Text>
          <Section style={warningBox}>
            <Text style={warningText}>⚠️ This action is permanent and cannot be undone. All your listings, seller profile, and sales history will be deleted.</Text>
          </Section>
          <Text style={text}>
            Click below to confirm. This link expires in 30 minutes.
          </Text>
          <Button style={button} href={confirmUrl || 'https://gopartara.com'}>
            CONFIRM SHOP DELETION
          </Button>
          <Text style={textSmall}>
            If you didn't request this, your shop is safe — simply ignore this email.
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ShopDeletionConfirmEmail,
  subject: 'Confirm deletion of your PARTARA shop',
  displayName: 'Shop deletion confirmation',
  previewData: { name: 'John', listingCount: '5', confirmUrl: 'https://gopartara.com/confirm-shop-delete/abc123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto', padding: '20px 0' }
const header = { backgroundColor: '#0f1117', padding: '24px 30px', borderRadius: '8px 8px 0 0' }
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const content = { padding: '30px', backgroundColor: '#f8f8f8', borderRadius: '0 0 8px 8px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f1117', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const textSmall = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0 0 16px' }
const warningBox = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '16px', margin: '0 0 24px' }
const warningText = { fontSize: '13px', color: '#991b1b', margin: '0', lineHeight: '1.5' }
const button = { backgroundColor: '#dc2626', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
