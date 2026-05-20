import { emailHtml } from './shared'

export function hireConfirmedFounderSubject(creativeName: string) {
  return `You hired ${creativeName} — here are their contact details`
}

export function hireConfirmedCreativeSubject(founderName: string) {
  return `${founderName} confirmed your hire on BrandCove`
}

export function hireFounderHtml({
  founderName,
  creativeName,
  creativeEmail,
  projectDescription,
  ctaUrl,
}: {
  founderName: string
  creativeName: string
  creativeEmail: string
  projectDescription: string
  ctaUrl: string
}): string {
  const first = founderName.split(' ')[0] || 'there'
  const preview = projectDescription.length > 200
    ? projectDescription.slice(0, 200) + '&#8230;'
    : projectDescription
  const subject = hireConfirmedFounderSubject(creativeName)

  const content = `
    <h1 style="margin:0 0 24px;font-size:34px;font-weight:700;color:#0a0a0a;line-height:1.2;font-family:Georgia,'Times New Roman',serif;text-align:center;">You hired ${creativeName}</h1>
    <p style="margin:0 0 6px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Hi ${first},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">You&#39;ve confirmed your hire of ${creativeName}. Here is their contact so you can take things forward.</p>
    <div style="background-color:#f9f5f0;border-left:3px solid #6b1d2b;padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.05em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${creativeName}&#39;s Email</p>
      <a href="mailto:${creativeEmail}" style="font-size:15px;font-weight:600;color:#6b1d2b;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${creativeEmail}</a>
    </div>
    <div style="background-color:#f9f5f0;border-left:3px solid #cccccc;padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:32px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.05em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Project</p>
      <p style="margin:0;font-size:14px;color:#444444;line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${preview}</p>
    </div>
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" style="background-color:#6b1d2b;border-radius:100px;">
          <a href="${ctaUrl}" style="display:inline-block;padding:16px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Open Conversation</a>
        </td>
      </tr>
    </table>
    <p style="margin:32px 0 0;font-size:14px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">If you have any questions, just reply to this email &#8212; i&#39;m here to help.</p>
    <p style="margin:20px 0 0;font-size:14px;color:#333333;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">&#8212;<br><strong>Chidera Anidiobi</strong><br>Founder &amp; CEO</p>
  `

  return emailHtml(subject, content)
}

export function hireCreativeHtml({
  creativeName,
  founderName,
  founderEmail,
  projectDescription,
  ctaUrl,
}: {
  creativeName: string
  founderName: string
  founderEmail: string
  projectDescription: string
  ctaUrl: string
}): string {
  const first = creativeName.split(' ')[0] || 'there'
  const preview = projectDescription.length > 200
    ? projectDescription.slice(0, 200) + '&#8230;'
    : projectDescription
  const subject = hireConfirmedCreativeSubject(founderName)

  const content = `
    <h1 style="margin:0 0 24px;font-size:34px;font-weight:700;color:#0a0a0a;line-height:1.2;font-family:Georgia,'Times New Roman',serif;text-align:center;">You&#39;ve been hired!</h1>
    <p style="margin:0 0 6px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Hi ${first},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${founderName} has confirmed your hire on BrandCove. Here is their contact so you can coordinate next steps.</p>
    <div style="background-color:#f9f5f0;border-left:3px solid #6b1d2b;padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.05em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${founderName}&#39;s Email</p>
      <a href="mailto:${founderEmail}" style="font-size:15px;font-weight:600;color:#6b1d2b;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${founderEmail}</a>
    </div>
    <div style="background-color:#f9f5f0;border-left:3px solid #cccccc;padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:32px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.05em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Project</p>
      <p style="margin:0;font-size:14px;color:#444444;line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${preview}</p>
    </div>
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" style="background-color:#6b1d2b;border-radius:100px;">
          <a href="${ctaUrl}" style="display:inline-block;padding:16px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Open Conversation</a>
        </td>
      </tr>
    </table>
    <p style="margin:32px 0 0;font-size:14px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Congratulations &#8212; wishing you a great working relationship!</p>
    <p style="margin:20px 0 0;font-size:14px;color:#333333;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">&#8212;<br><strong>Chidera Anidiobi</strong><br>Founder &amp; CEO</p>
  `

  return emailHtml(subject, content)
}
