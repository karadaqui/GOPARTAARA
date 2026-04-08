/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ContactNotificationProps {
  name?: string
  email?: string
  message?: string
}

const ContactNotificationEmail = ({ name, email, message }: ContactNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission from {name || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Contact Form Submission</Heading>
        <Text style={label}>Name</Text>
        <Text style={value}>{name || 'Not provided'}</Text>
        <Text style={label}>Email</Text>
        <Text style={value}>{email || 'Not provided'}</Text>
        <Hr style={hr} />
        <Text style={label}>Message</Text>
        <Text style={value}>{message || 'No message'}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This message was sent via the PARTARA contact form.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) => `New contact: ${data.name || 'Website visitor'}`,
  to: 'info@gopartara.com',
  displayName: 'Contact form notification',
  previewData: { name: 'Jane Smith', email: 'jane@example.com', message: 'I need help finding brake pads for my 2019 Ford Focus.' },
} satisfies TemplateEntry
