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
  const headingColor = isAccepted ? '#16a34a' : '#6b1d2b'
  const headingText = isAccepted
    ? `${creativeName} accepted your offer!`
    : `${creativeName} declined your offer`
  const bodyText = isAccepted
    ? `Great news — ${creativeName} has accepted your offer. You can now continue the conversation and coordinate next steps.`
    : `${creativeName} has declined your offer. You can send a revised offer to reopen the chat, or browse other talent on Brandcove.`
  const ctaText = isAccepted ? 'Open conversation' : 'Send a new offer'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <!-- Header -->
        <tr><td style="background:#6b1d2b;padding:28px 36px;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:2px;">BRANDCOVE</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 36px 28px;">
          <p style="margin:0 0 12px;font-size:15px;color:#374151;">Hi ${first},</p>
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${headingColor};">${headingText}</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">${bodyText}</p>

          <!-- Project preview -->
          <div style="background:#f9fafb;border-left:3px solid #6b1d2b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Project</p>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">${projectDescription.slice(0, 200)}${projectDescription.length > 200 ? '…' : ''}</p>
          </div>

          <!-- CTA -->
          <a href="${ctaUrl}" style="display:inline-block;background:#6b1d2b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">${ctaText}</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 36px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">You're receiving this because you have an active inquiry on Brandcove.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
