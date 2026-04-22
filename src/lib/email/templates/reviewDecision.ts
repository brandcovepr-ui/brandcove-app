import { emailHtml } from './shared'

interface ReviewDecisionParams {
  creativeName: string
  status: 'approved' | 'rejected'
  loginUrl: string
}

export function reviewDecisionSubject(status: 'approved' | 'rejected') {
  return status === 'approved'
    ? `You've been approved on BrandCove 🎉`
    : 'Your BrandCove application update'
}

export function reviewDecisionHtml({ creativeName, status, loginUrl }: ReviewDecisionParams): string {
  const isApproved = status === 'approved'

  const content = isApproved ? `
    <h1 style="margin:0 0 24px;font-size:34px;font-weight:700;color:#0a0a0a;line-height:1.2;font-family:Georgia,'Times New Roman',serif;text-align:center;">Complete your setup to start receiving opportunities from founders</h1>
    <p style="margin:0 0 12px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">You&#39;re approved, ${creativeName}!</p>
    <p style="margin:0 0 12px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">We&#39;ve reviewed your profile and you&#39;re officially approved to join BrandCove.</p>
    <p style="margin:0 0 12px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Founders can now discover you but before your profile goes live, there&#39;s one final step to complete your setup.</p>
    <p style="margin:0 0 12px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">This unlocks your access to the full dashboard where you can:</p>
    <ul style="margin:0 0 28px;padding-left:20px;">
      <li style="font-size:15px;color:#333333;line-height:1.9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Receive inquiries from founders</li>
      <li style="font-size:15px;color:#333333;line-height:1.9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Track conversations</li>
      <li style="font-size:15px;color:#333333;line-height:1.9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Manage your profile and visibility</li>
    </ul>
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 32px;">
      <tr>
        <td align="center" style="background-color:#6b1d2b;border-radius:100px;">
          <a href="${loginUrl}" style="display:inline-block;padding:16px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Finish Setup &amp; Activate Profile</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">If you have any questions, just reply to this email &#8212; i&#39;m here to help you get started smoothly.</p>
    <p style="margin:0;font-size:14px;color:#333333;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">&#8212;<br><strong>Chidera Anidiobi</strong><br>Founder &amp; CEO</p>
  ` : `
    <h1 style="margin:0 0 24px;font-size:34px;font-weight:700;color:#0a0a0a;line-height:1.2;font-family:Georgia,'Times New Roman',serif;text-align:center;">Thank you for applying to BrandCove</h1>
    <p style="margin:0 0 12px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Hi ${creativeName},</p>
    <p style="margin:0 0 12px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Thank you for applying to join BrandCove as a creative. After carefully reviewing your profile, we&#39;re unable to approve your application at this time.</p>
    <p style="margin:0 0 28px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">You&#39;re welcome to strengthen your portfolio and reapply in the future. We&#39;d love to have you on the platform when the time is right.</p>
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 32px;">
      <tr>
        <td align="center" style="background-color:#6b1d2b;border-radius:100px;">
          <a href="${loginUrl}" style="display:inline-block;padding:16px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Visit BrandCove</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">If you have any questions, feel free to reply to this email.</p>
    <p style="margin:0;font-size:14px;color:#333333;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">&#8212;<br><strong>Chidera Anidiobi</strong><br>Founder &amp; CEO</p>
  `

  return emailHtml(reviewDecisionSubject(status), content)
}
