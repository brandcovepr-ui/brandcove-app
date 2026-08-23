import { emailHtml } from './shared'

interface PortfolioLink {
  label: string
  url: string
}

interface NewCreatorApplicationParams {
  creatorName: string
  creatorEmail: string
  bio: string | null
  discipline: string
  portfolioLinks: PortfolioLink[]
  adminUrl: string
}

export function newCreatorApplicationSubject(creatorName: string): string {
  return `New creator application — ${creatorName} is awaiting approval`
}

export function newCreatorApplicationHtml({
  creatorName,
  creatorEmail,
  bio,
  discipline,
  portfolioLinks,
  adminUrl,
}: NewCreatorApplicationParams): string {
  const linksHtml =
    portfolioLinks.length > 0
      ? portfolioLinks
          .map(
            (link) =>
              `<li style="margin-bottom:8px;">
                <span style="font-size:13px;color:#666666;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${link.label}: </span>
                <a href="${link.url}" target="_blank" style="font-size:13px;color:#6b1d2b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;word-break:break-all;">${link.url}</a>
              </li>`
          )
          .join('')
      : '<li style="font-size:13px;color:#999999;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;">No portfolio links provided</li>'

  const content = `
    <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#0a0a0a;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">New creator application</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">A new creator has completed onboarding and is awaiting your review.</p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9f5f0;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.08em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Name</p>
          <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${creatorName}</p>

          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.08em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Email</p>
          <p style="margin:0 0 16px;font-size:15px;color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${creatorEmail}</p>

          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.08em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Specialty</p>
          <p style="margin:0 0 16px;font-size:15px;color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${discipline}</p>

          ${
            bio
              ? `<p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.08em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Bio</p>
          <p style="margin:0 0 16px;font-size:14px;color:#333333;line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${bio}</p>`
              : ''
          }

          <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.08em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Portfolio Links</p>
          <ul style="margin:0;padding-left:16px;">
            ${linksHtml}
          </ul>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 32px;">
      <tr>
        <td align="center" style="background-color:#6b1d2b;border-radius:100px;">
          <a href="${adminUrl}" style="display:inline-block;padding:16px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Review Application</a>
        </td>
      </tr>
    </table>
  `

  return emailHtml(newCreatorApplicationSubject(creatorName), content)
}
