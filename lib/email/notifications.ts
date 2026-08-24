import 'server-only'

import { FROM, getResend } from '@/lib/email/client'
import { emailAddress, emailText, externalUrl } from '@/lib/email/sanitize'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { newCreatorApplicationHtml, newCreatorApplicationSubject } from '@/lib/email/templates/newCreatorApplication'
import { hireConfirmedCreativeSubject, hireConfirmedFounderSubject, hireCreativeHtml, hireFounderHtml } from '@/lib/email/templates/hireConfirmation'
import { newInquiryHtml, newInquirySubject } from '@/lib/email/templates/newInquiry'
import { newMessageHtml, newMessageSubject } from '@/lib/email/templates/newMessage'
import { offerAcceptedSubject, offerActionHtml, offerDeclinedSubject } from '@/lib/email/templates/offerAction'
import { reviewDecisionHtml, reviewDecisionSubject } from '@/lib/email/templates/reviewDecision'

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://brandcove.com'
const firstName = (name: unknown) => emailText(String(name ?? 'there').split(' ')[0], 80) || 'there'

async function send(data: Parameters<ReturnType<typeof getResend>['emails']['send']>[0], idempotencyKey: string) {
  const { error } = await getResend().emails.send(data, { idempotencyKey })
  if (error) throw new Error(error.message || 'Email failed to send')
}

async function profilesFor(ids: string[]) {
  const { data, error } = await getSupabaseAdmin().from('profiles').select('id, full_name').in('id', ids)
  if (error) throw error
  return new Map((data ?? []).map((profile) => [profile.id, profile.full_name]))
}

async function authEmail(userId: string) {
  const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(userId)
  if (error || !data.user?.email) throw new Error('Recipient email not found')
  return data.user.email
}

export async function notifyCreatorApplication(creativeId: string) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) throw new Error('Missing ADMIN_EMAIL')
  const admin = getSupabaseAdmin()
  const { data: profile, error } = await admin.from('profiles')
    .select('full_name, bio, review_status, role').eq('id', creativeId).single()
  if (error || !profile || profile.role !== 'creative' || profile.review_status !== 'pending') {
    throw new Error('Creator is not awaiting review')
  }
  const [{ data: creative }, creatorEmail] = await Promise.all([
    admin.from('creative_profiles').select('discipline, portfolio_links').eq('id', creativeId).single(),
    authEmail(creativeId),
  ])
  const portfolioLinks = Array.isArray(creative?.portfolio_links)
    ? creative.portfolio_links.flatMap((link: unknown) => {
        if (!link || typeof link !== 'object') return []
        const item = link as { label?: unknown; url?: unknown }
        const url = externalUrl(item.url)
        return url ? [{ label: emailText(item.label, 120), url }] : []
      })
    : []
  await send({
    from: FROM, to: adminEmail,
    subject: newCreatorApplicationSubject(String(profile.full_name ?? 'Unknown Creator').replace(/[\r\n]+/g, ' ')),
    html: newCreatorApplicationHtml({
      creatorName: emailText(profile.full_name ?? 'Unknown Creator', 160),
      creatorEmail: emailAddress(creatorEmail), bio: emailText(profile.bio, 3_000),
      discipline: emailText(creative?.discipline ?? 'Not specified', 160), portfolioLinks,
      adminUrl: `${appUrl()}/dashboard/admin`,
    }),
  }, `creator-application/${creativeId}`)
}

export async function notifyInquiry(inquiryId: string, founderId: string) {
  const admin = getSupabaseAdmin()
  const { data: inquiry, error } = await admin.from('inquiries')
    .select('project_description, timeline, budget, founder_id, creative_id').eq('id', inquiryId).single()
  if (error || !inquiry || inquiry.founder_id !== founderId) throw new Error('Inquiry not found')
  const [names, recipientEmail] = await Promise.all([profilesFor([inquiry.founder_id, inquiry.creative_id]), authEmail(inquiry.creative_id)])
  const founderName = emailText(names.get(inquiry.founder_id) ?? 'A founder', 160)
  await send({ from: FROM, to: recipientEmail, subject: newInquirySubject(founderName), html: newInquiryHtml({
    creativeName: firstName(names.get(inquiry.creative_id)), founderName,
    projectDescription: emailText(inquiry.project_description, 1_500), timeline: emailText(inquiry.timeline, 160),
    budget: inquiry.budget, ctaUrl: `${appUrl()}/dashboard/creator/messages`,
  }) }, `inquiry/${inquiryId}`)
}

export async function notifyMessage(inquiryId: string, senderId: string, preview: string) {
  const admin = getSupabaseAdmin()
  const { data: inquiry, error } = await admin.from('inquiries').select('founder_id, creative_id').eq('id', inquiryId).single()
  if (error || !inquiry || ![inquiry.founder_id, inquiry.creative_id].includes(senderId)) throw new Error('Inquiry not found')
  const recipientId = senderId === inquiry.founder_id ? inquiry.creative_id : inquiry.founder_id
  const [names, recipientEmail] = await Promise.all([profilesFor([senderId, recipientId]), authEmail(recipientId)])
  const senderName = emailText(names.get(senderId) ?? 'Someone', 160)
  await send({ from: FROM, to: recipientEmail, subject: newMessageSubject(senderName), html: newMessageHtml({
    recipientName: firstName(names.get(recipientId)), senderName, preview: emailText(preview, 200),
    ctaUrl: `${appUrl()}/${recipientId === inquiry.creative_id ? 'creator' : 'founder'}/messages`,
  }) }, `message/${inquiryId}/${senderId}`)
}

export async function notifyOffer(inquiryId: string, creativeId: string, action: 'accepted' | 'declined') {
  const admin = getSupabaseAdmin()
  const { data: inquiry, error } = await admin.from('inquiries').select('project_description, founder_id, creative_id').eq('id', inquiryId).single()
  if (error || !inquiry || inquiry.creative_id !== creativeId) throw new Error('Inquiry not found')
  const [names, recipientEmail] = await Promise.all([profilesFor([inquiry.founder_id, inquiry.creative_id]), authEmail(inquiry.founder_id)])
  const creativeName = emailText(names.get(inquiry.creative_id) ?? 'The creative', 160)
  await send({ from: FROM, to: recipientEmail, subject: action === 'accepted' ? offerAcceptedSubject(creativeName) : offerDeclinedSubject(creativeName), html: offerActionHtml({
    founderName: firstName(names.get(inquiry.founder_id)), creativeName,
    projectDescription: emailText(inquiry.project_description, 1_500), action, ctaUrl: `${appUrl()}/founder/messages`,
  }) }, `offer/${inquiryId}/${action}`)
}

export async function notifyHire(inquiryId: string, founderId: string) {
  const admin = getSupabaseAdmin()
  const { data: inquiry, error } = await admin.from('inquiries').select('project_description, founder_id, creative_id, status').eq('id', inquiryId).single()
  if (error || !inquiry || inquiry.founder_id !== founderId || inquiry.status !== 'hired') throw new Error('Inquiry not found')
  const [names, founderEmail, creativeEmail] = await Promise.all([profilesFor([inquiry.founder_id, inquiry.creative_id]), authEmail(inquiry.founder_id), authEmail(inquiry.creative_id)])
  const founderName = emailText(names.get(inquiry.founder_id) ?? 'The founder', 160)
  const creativeName = emailText(names.get(inquiry.creative_id) ?? 'The creative', 160)
  await Promise.all([
    send({ from: FROM, to: founderEmail, subject: hireConfirmedFounderSubject(creativeName), html: hireFounderHtml({ founderName: firstName(founderName), creativeName, creativeEmail: emailAddress(creativeEmail), projectDescription: emailText(inquiry.project_description, 1_500), ctaUrl: `${appUrl()}/dashboard/founder/inquiries` }) }, `hire-founder/${inquiryId}`),
    send({ from: FROM, to: creativeEmail, subject: hireConfirmedCreativeSubject(founderName), html: hireCreativeHtml({ creativeName: firstName(creativeName), founderName, founderEmail: emailAddress(founderEmail), projectDescription: emailText(inquiry.project_description, 1_500), ctaUrl: `${appUrl()}/dashboard/creator/inquiries` }) }, `hire-creative/${inquiryId}`),
  ])
}

export async function notifyReviewDecision(creativeId: string, status: 'approved' | 'rejected', denialReason?: string) {
  const [recipientEmail, names] = await Promise.all([authEmail(creativeId), profilesFor([creativeId])])
  await send({ from: FROM, to: recipientEmail, subject: reviewDecisionSubject(status), html: reviewDecisionHtml({
    creativeName: firstName(names.get(creativeId)), status, loginUrl: `${appUrl()}/login`, subscribeUrl: `${appUrl()}/subscribe`, denialReason: emailText(denialReason, 2_000) || undefined,
  }) }, `review/${creativeId}/${status}`)
}
