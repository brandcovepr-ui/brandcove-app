/**
 * These templates are NOT used in code.
 * Paste each one into your Supabase dashboard:
 *   Authentication → Email Templates → [select template]
 *
 * Variables Supabase injects automatically:
 *   {{ .ConfirmationURL }}  — the magic link / reset link
 *   {{ .Token }}            — the 6-digit OTP
 *   {{ .Email }}            — the recipient's email address
 *   {{ .SiteURL }}          — your site URL (set in Auth → URL Configuration)
 */

export const SIGNUP_CONFIRMATION = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Confirm your Brandcove account</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding-bottom:28px;">
              <span style="font-size:12px;font-weight:700;letter-spacing:0.14em;color:#1a1a1a;text-transform:uppercase;">BRANDCOVE</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px;border:1px solid #ebe9e4;">
              <p style="margin:0 0 6px;font-size:13px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">Verify your email</p>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a;">Welcome to Brandcove</h1>
              <p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.7;">Use the code below to verify your email address and complete your account setup.</p>

              <div style="background:#faf9f7;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;border:1px solid #ebe9e4;">
                <p style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Your verification code</p>
                <p style="margin:0;font-size:36px;font-weight:700;color:#1a1a1a;letter-spacing:0.2em;">{{ .Token }}</p>
              </div>

              <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">This code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bbb;">Brandcove — Where founders meet creatives.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

export const PASSWORD_RESET = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Reset your Brandcove password</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding-bottom:28px;">
              <span style="font-size:12px;font-weight:700;letter-spacing:0.14em;color:#1a1a1a;text-transform:uppercase;">BRANDCOVE</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px;border:1px solid #ebe9e4;">
              <p style="margin:0 0 6px;font-size:13px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">Password reset</p>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a;">Reset your password</h1>
              <p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.7;">We received a request to reset the password for your Brandcove account. Click the button below to choose a new password.</p>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-radius:100px;background:#6b1d2b;">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#aaa;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will not change.</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bbb;">Brandcove — Where founders meet creatives.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
