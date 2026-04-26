/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'PARTARA'
const PRIMARY = 'hsl(0, 85%, 50%)'

interface SecurityReportProps {
  date?: string
  issueCount?: number
  findings?: string[]
  summary?: string
}

const SecurityReportEmail = ({ date, issueCount = 0, findings = [], summary }: SecurityReportProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${SITE_NAME} Daily Security Report — ${issueCount} issue${issueCount !== 1 ? 's' : ''} found`}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>

        <Section style={content}>
          <Heading style={h1}>🔒 Daily Security Report</Heading>
          <Text style={dateText}>{date || new Date().toLocaleDateString('en-GB')}</Text>

          <Section style={statusBox}>
            <Text style={statusText}>
              {issueCount === 0 ? '✅ All checks passed — no issues detected.' : `⚠️ ${issueCount} issue${issueCount !== 1 ? 's' : ''} detected`}
            </Text>
          </Section>

          {findings.length > 0 && (
            <Section style={findingsSection}>
              <Text style={sectionTitle}>Findings:</Text>
              {findings.map((f, i) => (
                <Text key={i} style={findingItem}>• {f}</Text>
              ))}
            </Section>
          )}

          {summary && (
            <>
              <Hr style={divider} />
              <Text style={summaryText}>{summary}</Text>
            </>
          )}

          <Hr style={divider} />
          <Text style={footer}>
            This is an automated security report from {SITE_NAME}. Review any findings promptly.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SecurityReportEmail,
  subject: (data: Record<string, any>) =>
    `[${data.issueCount || 0} issues] PARTARA Daily Security Report — ${data.date || new Date().toLocaleDateString('en-GB')}`,
  to: 'info@gopartara.com',
  displayName: 'Daily Security Report',
  previewData: {
    date: '09/04/2026',
    issueCount: 2,
    findings: [
      'Table "test_table" has RLS disabled',
      '3 failed login attempts from IP 192.168.1.1',
    ],
    summary: 'All other checks passed. Database RLS policies are properly configured on 18/19 tables.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const wrapper = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#111111', padding: '24px 32px', borderRadius: '12px 12px 0 0' }
const logoText = { color: '#ffffff', fontSize: '20px', fontWeight: '800' as const, letterSpacing: '2px', margin: '0', textTransform: 'uppercase' as const }
const content = { padding: '32px', border: '1px solid #e5e5e5', borderTop: 'none', borderRadius: '0 0 12px 12px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#111111', margin: '0 0 8px' }
const dateText = { fontSize: '13px', color: '#888888', margin: '0 0 24px' }
const statusBox = { backgroundColor: '#f8f8f8', padding: '16px', borderRadius: '8px', marginBottom: '24px' }
const statusText = { fontSize: '15px', color: '#111111', margin: '0', fontWeight: '600' as const }
const findingsSection = { marginBottom: '16px' }
const sectionTitle = { fontSize: '14px', fontWeight: '600' as const, color: '#111111', margin: '0 0 8px' }
const findingItem = { fontSize: '13px', color: '#333333', margin: '0 0 6px', lineHeight: '1.5' }
const divider = { borderColor: '#eeeeee', margin: '24px 0' }
const summaryText = { fontSize: '13px', color: '#666666', lineHeight: '1.5', margin: '0' }
const footer = { fontSize: '11px', color: '#999999', margin: '0' }
