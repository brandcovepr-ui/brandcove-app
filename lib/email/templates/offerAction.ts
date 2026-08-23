import { emailHtml } from './shared'

export function offerAcceptedSubject(creativeName: string) {
  return `${creativeName} accepted your offer 🎉`
}

export function offerDeclinedSubject(creativeName: string) {
  return `${creativeName} declined your offer`
}

interface OfferActionEmailProps {
  founderName: string
  creativeName: string
  projectDescription: string
  action: 'accepted' | 'declined'
  ctaUrl: string
}

export function offerActionHtml({
  founderName,
  creativeName,
  projectDescription,
  action,
  ctaUrl,
}: OfferActionEmailProps): string {
  const first = founderName.split(' ')[0] || 'there'
  const isAccepted = action === 'accepted'

  const heading = isAccepted
    ? `${creativeName} accepted your offer`
    : `${creativeName} declined your offer`

  const bodyText = isAccepted
    ? `Great news &#8212; ${creativeName} has accepted your offer. You can now continue the conversation and coordinate next steps.`
    : `${creativeName} has declined your offer. You can send a revised offer to reopen the conversation, or browse other talent on BrandCove.`

  const ctaText = isAccepted ? 'Open Conversation' : 'Send a New Offer'
  const preview = projectDescription.length > 200
    ? projectDescription.slice(0, 200) + '&#8230;'
    : projectDescription

  const subject = isAccepted ? offerAcceptedSubject(creativeName) : offerDeclinedSubject(creativeName)

  const content = `
    <h1 style="margin:0 0 24px;font-size:34px;font-weight:700;color:#0a0a0a;line-height:1.2;font-family:Georgia,'Times New Roman',serif;text-align:center;">${heading}</h1>
    <p style="margin:0 0 6px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Hi ${first},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${bodyText}</p>
    <div style="background-color:#f9f5f0;border-left:3px solid #6b1d2b;padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:32px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.05em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Project</p>
      <p style="margin:0;font-size:14px;color:#444444;line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${preview}</p>
    </div>
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" style="background-color:#6b1d2b;border-radius:100px;">
          <a href="${ctaUrl}" style="display:inline-block;padding:16px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${ctaText}</a>
        </td>
      </tr>
    </table>
    <p style="margin:32px 0 0;font-size:14px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">If you have any questions, just reply to this email &#8212; i&#39;m here to help.</p>
    <p style="margin:20px 0 0;font-size:14px;color:#333333;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">&#8212;<br><strong>Chidera Anidiobi</strong><br>Founder &amp; CEO</p>
  `

  return emailHtml(subject, content)
}
