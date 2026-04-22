import { emailHtml } from './shared'

interface NewMessageParams {
  recipientName: string
  senderName: string
  preview: string
  ctaUrl: string
}

export function newMessageSubject(senderName: string) {
  return `New message from ${senderName}`
}

export function newMessageHtml({
  recipientName,
  senderName,
  preview,
  ctaUrl,
}: NewMessageParams): string {
  const truncated = preview.length > 180 ? preview.slice(0, 180) + '&#8230;' : preview

  const content = `
    <h1 style="margin:0 0 24px;font-size:34px;font-weight:700;color:#0a0a0a;line-height:1.2;font-family:Georgia,'Times New Roman',serif;text-align:center;">${senderName} sent you a message</h1>
    <p style="margin:0 0 6px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Hi ${recipientName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">You have a new message waiting for you on BrandCove.</p>
    <div style="background-color:#f9f5f0;border-left:3px solid #6b1d2b;padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:32px;">
      <p style="margin:0;font-size:14px;color:#444444;line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${truncated}</p>
    </div>
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" style="background-color:#6b1d2b;border-radius:100px;">
          <a href="${ctaUrl}" style="display:inline-block;padding:16px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Reply</a>
        </td>
      </tr>
    </table>
    <p style="margin:32px 0 0;font-size:14px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">If you have any questions, just reply to this email &#8212; i&#39;m here to help.</p>
    <p style="margin:20px 0 0;font-size:14px;color:#333333;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">&#8212;<br><strong>Chidera Anidiobi</strong><br>Founder &amp; CEO</p>
  `

  return emailHtml(newMessageSubject(senderName), content)
}
