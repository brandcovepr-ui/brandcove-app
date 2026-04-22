import { emailHtml } from './shared'

interface NewInquiryParams {
  creativeName: string
  founderName: string
  projectDescription: string
  timeline?: string | null
  budget?: number | null
  ctaUrl: string
}

export function newInquirySubject(founderName: string) {
  return `${founderName} sent you an inquiry on Brandcove`
}

export function newInquiryHtml({
  creativeName,
  founderName,
  projectDescription,
  timeline,
  budget,
  ctaUrl,
}: NewInquiryParams): string {
  const preview = projectDescription.length > 200
    ? projectDescription.slice(0, 200) + '&#8230;'
    : projectDescription

  const metaRows = [
    budget ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0ede8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><span style="font-size:12px;color:#999999;display:inline-block;width:80px;">Budget</span><span style="font-size:13px;color:#1a1a1a;font-weight:600;">&#8358;${Number(budget).toLocaleString()} / month</span></td></tr>` : '',
    timeline ? `<tr><td style="padding:8px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><span style="font-size:12px;color:#999999;display:inline-block;width:80px;">Timeline</span><span style="font-size:13px;color:#1a1a1a;font-weight:600;">${timeline}</span></td></tr>` : '',
  ].filter(Boolean).join('')

  const metaTable = metaRows
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">${metaRows}</table>`
    : ''

  const content = `
    <h1 style="margin:0 0 24px;font-size:34px;font-weight:700;color:#0a0a0a;line-height:1.2;font-family:Georgia,'Times New Roman',serif;text-align:center;">${founderName} sent you an inquiry</h1>
    <p style="margin:0 0 6px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Hi ${creativeName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">A new inquiry is waiting for your response on BrandCove. Here&#39;s what ${founderName} is looking for:</p>
    <div style="background-color:#f9f5f0;border-left:3px solid #6b1d2b;padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#444444;line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${preview}</p>
    </div>
    ${metaTable}
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:32px auto 0;">
      <tr>
        <td align="center" style="background-color:#6b1d2b;border-radius:100px;">
          <a href="${ctaUrl}" style="display:inline-block;padding:16px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">View Inquiry</a>
        </td>
      </tr>
    </table>
    <p style="margin:32px 0 0;font-size:14px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">If you have any questions, just reply to this email &#8212; i&#39;m here to help you get started smoothly.</p>
    <p style="margin:20px 0 0;font-size:14px;color:#333333;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">&#8212;<br><strong>Chidera Anidiobi</strong><br>Founder &amp; CEO</p>
  `

  return emailHtml(newInquirySubject(founderName), content)
}
