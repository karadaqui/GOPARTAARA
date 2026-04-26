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
  reviewerName?: string
  reviewText?: string
  rating?: number
  disputeReason?: string
  sellerName?: string
}

const ReviewDisputeEmail = ({ listingTitle, reviewerName, reviewText, rating, disputeReason, sellerName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Review dispute from ${sellerName ?? 'a seller'} on "${listingTitle ?? 'a listing'}"`}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Review Dispute Filed ⚠️</Heading>
          <Text style={text}>
            <strong>{sellerName || 'A seller'}</strong> has disputed a review on <strong>"{listingTitle || 'a listing'}"</strong>.
          </Text>
          <Section style={infoBox}>
            <Text style={infoLabel}>Reviewer</Text>
            <Text style={infoValue}>{reviewerName || 'Anonymous'}</Text>
            <Text style={infoLabel}>Rating</Text>
            <Text style={infoValue}>{rating || '?'} stars</Text>
            {reviewText && (
              <>
                <Text style={infoLabel}>Review</Text>
                <Text style={infoValue}>"{reviewText}"</Text>
              </>
            )}
          </Section>
          <Section style={disputeBox}>
            <Text style={disputeLabel}>Seller's Dispute Reason:</Text>
            <Text style={disputeText}>{disputeReason || 'No reason provided.'}</Text>
          </Section>
          <Button style={button} href="https://car-part-search.lovable.app/admin">
            Review in Admin Panel
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReviewDisputeEmail,
  subject: (data: Record<string, any>) => `Review dispute: "${data.listingTitle || 'a listing'}" from ${data.sellerName || 'a seller'}`,
  to: 'info@gopartara.com',
  displayName: 'Review dispute (admin)',
  previewData: { listingTitle: 'BMW E46 Headlight', reviewerName: 'John', reviewText: 'Terrible part', rating: 1, disputeReason: 'Customer never purchased', sellerName: 'AutoParts UK' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto', padding: '20px 0' }
const header = { backgroundColor: '#0f1117', padding: '24px 30px', borderRadius: '8px 8px 0 0' }
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const content = { padding: '30px', backgroundColor: '#f8f8f8', borderRadius: '0 0 8px 8px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f1117', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const infoBox = { backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px', margin: '0 0 16px' }
const infoLabel = { fontSize: '11px', color: '#999', fontWeight: '600' as const, margin: '8px 0 2px', textTransform: 'uppercase' as const }
const infoValue = { fontSize: '14px', color: '#333', margin: '0' }
const disputeBox = { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', margin: '0 0 24px' }
const disputeLabel = { fontSize: '12px', color: '#92400e', fontWeight: '600' as const, margin: '0 0 4px', textTransform: 'uppercase' as const }
const disputeText = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0' }
const button = { backgroundColor: PRIMARY, color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
