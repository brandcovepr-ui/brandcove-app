interface ReviewDecisionParams {
  creativeName: string
  status: 'approved' | 'rejected'
  loginUrl: string
}

export function reviewDecisionSubject(status: 'approved' | 'rejected') {
  return status === 'approved'
    ? 'You've been approved on BrandCove 🎉'
    : 'Your BrandCove application update'
}

export function reviewDecisionHtml({ creativeName, status, loginUrl }: ReviewDecisionParams): string {
  const isApproved = status === 'approved'

  const heading = isApproved
    ? `You're in, ${creativeName}.`
    : `Application not approved`

  const body = isApproved
    ? `Great news — your BrandCove profile has been reviewed and approved. You can now log in and set up your subscription to start receiving inquiries from founders.`
    : `Thank you for applying to BrandCove, ${creativeName}. After reviewing your profile, we're unable to approve your application at this time. You're welcome to reapply once you've had a chance to build out your portfolio further.`

  const ctaLabel = isApproved ? 'Log in & get started' : 'Visit BrandCove'
  const accentColor = isApproved ? '#166534' : '#6b1d2b'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${reviewDecisionSubject(status)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:28px;">
              <span style="font-size:12px;font-weight:700;letter-spacing:0.14em;color:#1a1a1a;text-transform:uppercase;">BRANDCOVE</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px;border:1px solid #ebe9e4;">

              <p style="margin:0 0 6px;font-size:13px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">
                Application ${isApproved ? 'Approved' : 'Update'}
              </p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.3;">
                ${heading}
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#555;line-height:1.7;">
                ${body}
              </p>

              ${isApproved ? `
              <div style="background:#f0fdf4;border-radius:10px;padding:16px 20px;border:1px solid #bbf7d0;margin-bottom:28px;">
                <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
                  <strong>Next steps:</strong> Log in with your email and password, then complete your subscription to unlock full access to the platform.
                </p>
              </div>` : ''}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:100px;background:${accentColor};">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bbb;">You're receiving this because you applied to join BrandCove as a creative.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
