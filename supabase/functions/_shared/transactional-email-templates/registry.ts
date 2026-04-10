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
import { template as priceAlertSeller } from './price-alert-seller.tsx'
import { template as priceDropBuyer } from './price-drop-buyer.tsx'
import { template as securityReport } from './security-report.tsx'
import { template as reviewNotification } from './review-notification.tsx'
import { template as refundConfirmation } from './refund-confirmation.tsx'
import { template as refundAdminNotification } from './refund-admin-notification.tsx'
import { template as reviewRemoved } from './review-removed.tsx'
import { template as reviewDispute } from './review-dispute.tsx'
import { template as disputeDecision } from './dispute-decision.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-notification': contactNotification,
  'contact-confirmation': contactConfirmation,
  'listing-approved': listingApproved,
  'listing-rejected': listingRejected,
  'listing-saved': listingSaved,
  'price-alert-seller': priceAlertSeller,
  'price-drop-buyer': priceDropBuyer,
  'security-report': securityReport,
  'review-notification': reviewNotification,
  'refund-confirmation': refundConfirmation,
  'refund-admin-notification': refundAdminNotification,
  'review-removed': reviewRemoved,
  'review-dispute': reviewDispute,
  'dispute-decision': disputeDecision,
}
