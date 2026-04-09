/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as contactNotification } from './contact-notification.tsx'
import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as listingApproved } from './listing-approved.tsx'
import { template as listingRejected } from './listing-rejected.tsx'
import { template as listingSaved } from './listing-saved.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-notification': contactNotification,
  'contact-confirmation': contactConfirmation,
  'listing-approved': listingApproved,
  'listing-rejected': listingRejected,
  'listing-saved': listingSaved,
}
