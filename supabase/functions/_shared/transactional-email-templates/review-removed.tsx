/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'PARTARA'

interface Props {
  listingTitle?: string
  reason?: string
}

const ReviewRemovedEmail = ({ listingTitle, reason }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Your review on "${listingTitle ?? 'a listing'}" was removed by our moderation team`}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Review Removed</Heading>
          <Text style={text}>
            Your review on <strong>"{listingTitle || 'a listing'}"</strong> was removed by our moderation team.
          </Text>
          {reason && (
            <Section style={reasonBox}>
              <Text style={reasonLabel}>Reason:</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>
          )}
          <Text style={text}>
            If you believe this was a mistake, please contact us at info@gopartara.com.
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReviewRemovedEmail,
  subject: (data: Record<string, any>) => `Your review on "${data.listingTitle || 'a listing'}" was removed`,
  displayName: 'Review removed notification',
  previewData: { listingTitle: 'BMW E46 Headlight Assembly', reason: 'Review contained inappropriate language.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto', padding: '20px 0' }
const header = { backgroundColor: '#0f1117', padding: '24px 30px', borderRadius: '8px 8px 0 0' }
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const content = { padding: '30px', backgroundColor: '#f8f8f8', borderRadius: '0 0 8px 8px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f1117', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const reasonBox = { backgroundColor: '#fff3f3', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', margin: '0 0 24px' }
const reasonLabel = { fontSize: '12px', color: '#991b1b', fontWeight: '600' as const, margin: '0 0 4px', textTransform: 'uppercase' as const }
const reasonText = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
