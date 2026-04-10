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
  rating?: number
  reviewText?: string
}

const ReviewNotificationEmail = ({ listingTitle, rating, reviewText }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Someone left a {rating || 5} star review on "{listingTitle}" on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>New Review on Your Listing! ⭐</Heading>
          <Text style={text}>
            Someone left a <strong>{rating || 5} star</strong> review on your listing <strong>"{listingTitle || 'your part'}"</strong>.
          </Text>
          {reviewText && (
            <Section style={reviewBox}>
              <Text style={reviewTextStyle}>"{reviewText}"</Text>
            </Section>
          )}
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
  component: ReviewNotificationEmail,
  subject: (data: Record<string, any>) => `New ${data.rating || 5} star review on "${data.listingTitle || 'your listing'}"`,
  displayName: 'Review notification',
  previewData: { listingTitle: 'BMW E46 Headlight Assembly', rating: 5, reviewText: 'Great quality part, exactly as described!' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto', padding: '20px 0' }
const header = { backgroundColor: '#0f1117', padding: '24px 30px', borderRadius: '8px 8px 0 0' }
const logoText = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const content = { padding: '30px', backgroundColor: '#f8f8f8', borderRadius: '0 0 8px 8px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f1117', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const reviewBox = { backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px', margin: '0 0 24px' }
const reviewTextStyle = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0', fontStyle: 'italic' as const }
const button = { backgroundColor: PRIMARY, color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
