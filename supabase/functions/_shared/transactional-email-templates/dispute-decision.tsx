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
  decision?: string
  adminNote?: string
  sellerName?: string
}

const DisputeDecisionEmail = ({ listingTitle, decision, adminNote, sellerName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Dispute decision for "{listingTitle}": {decision}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Dispute Decision</Heading>
          <Text style={text}>
            Hi {sellerName || 'there'},
          </Text>
          <Text style={text}>
            Your dispute for <strong>"{listingTitle || 'a listing'}"</strong> has been reviewed by our team.
          </Text>
          <Section style={decisionBox}>
            <Text style={decisionLabel}>Decision</Text>
            <Text style={decisionValue}>{decision === 'Remove' ? '✅ Review Removed' : '⚠️ Review Kept'}</Text>
          </Section>
          {adminNote && (
            <Section style={noteBox}>
              <Text style={noteLabel}>Admin Note</Text>
              <Text style={noteText}>{adminNote}</Text>
            </Section>
          )}
          <Text style={text}>
            {decision === 'Remove'
              ? 'The review has been removed from your listing.'
              : 'After careful review, we have decided to keep the review on your listing.'}
          </Text>
          <Hr style={hr} />
          <Text style={contactText}>
            If you believe this decision is incorrect, please contact us:
          </Text>
          <Button style={button} href="https://car-part-search.lovable.app/contact">
            Contact Us
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DisputeDecisionEmail,
  subject: (data: Record<string, any>) => `Dispute decision for "${data.listingTitle || 'your listing'}": ${data.decision || 'Reviewed'}`,
  displayName: 'Dispute decision (seller)',
  previewData: { listingTitle: 'BMW E46 Headlight', decision: 'Remove', adminNote: 'The review violated our guidelines.', sellerName: 'AutoParts UK' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto', padding: '20px 0' }
const header = { backgroundColor: '#0f1117', padding: '24px 30px', borderRadius: '8px 8px 0 0' }
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const content = { padding: '30px', backgroundColor: '#f8f8f8', borderRadius: '0 0 8px 8px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f1117', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const decisionBox = { backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px', margin: '0 0 16px' }
const decisionLabel = { fontSize: '11px', color: '#999', fontWeight: '600' as const, margin: '0 0 4px', textTransform: 'uppercase' as const }
const decisionValue = { fontSize: '18px', fontWeight: '700' as const, color: '#0f1117', margin: '0' }
const noteBox = { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px', margin: '0 0 16px' }
const noteLabel = { fontSize: '11px', color: '#0369a1', fontWeight: '600' as const, margin: '0 0 4px', textTransform: 'uppercase' as const }
const noteText = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0' }
const contactText = { fontSize: '13px', color: '#777', lineHeight: '1.6', margin: '0 0 12px' }
const button = { backgroundColor: PRIMARY, color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
