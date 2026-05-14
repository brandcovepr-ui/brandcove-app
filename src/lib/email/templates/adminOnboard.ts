import { emailHtml } from './shared'

interface AdminOnboardParams {
  name: string
  email: string
  password: string
  role: 'creative' | 'founder'
  loginUrl: string
}

export function adminOnboardSubject(): string {
  return 'Your BrandCove account is ready'
}

export function adminOnboardHtml({ name, email, password, role, loginUrl }: AdminOnboardParams): string {
  const roleLabel = role === 'creative' ? 'creative' : 'founder'

  const content = `
    <h1 style="margin:0 0 24px;font-size:34px;font-weight:700;color:#0a0a0a;line-height:1.2;font-family:Georgia,'Times New Roman',serif;text-align:center;">Welcome to BrandCove, ${name}!</h1>
    <p style="margin:0 0 12px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Your BrandCove ${roleLabel} account has been set up by our team. Your profile is live and ready to go.</p>
    <p style="margin:0 0 20px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Here are your login credentials:</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;background:#f9f5f0;border-radius:8px;border:1px solid #e5e0d8;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:13px;color:#888888;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:0.05em;">Login details</p>
          <p style="margin:0 0 10px;font-size:15px;color:#333333;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><strong>Email:</strong> ${email}</p>
          <p style="margin:0;font-size:15px;color:#333333;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><strong>Temporary password:</strong>&nbsp;<span style="font-family:monospace;background:#ebe6de;padding:3px 8px;border-radius:4px;font-size:14px;">${password}</span></p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px;font-size:15px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      ${role === 'creative'
        ? 'Your profile is already approved. Log in and subscribe to activate your account and start receiving inquiries from founders.'
        : 'Log in and subscribe to activate your account and start browsing and hiring talented creatives.'}
    </p>

    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
      <tr>
        <td align="center" style="background-color:#6b1d2b;border-radius:100px;">
          <a href="${loginUrl}" style="display:inline-block;padding:16px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Log In to BrandCove</a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;font-size:13px;color:#888888;line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-align:center;">We recommend changing your password after your first login via Account Settings.</p>
    <p style="margin:0 0 20px;font-size:14px;color:#333333;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">If you have any questions, just reply to this email.</p>
    <p style="margin:0;font-size:14px;color:#333333;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">&#8212;<br><strong>Chidera Anidiobi</strong><br>Founder &amp; CEO</p>
  `

  return emailHtml(adminOnboardSubject(), content)
}
