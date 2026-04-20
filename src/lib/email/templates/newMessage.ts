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
  const truncated = preview.length > 180 ? preview.slice(0, 180) + '…' : preview

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${newMessageSubject(senderName)}</title>
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

              <p style="margin:0 0 6px;font-size:13px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">New Message</p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.3;">
                ${senderName} sent you a message
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#777;">Hi ${recipientName}, you have a new message waiting for you.</p>

              <!-- Message preview -->
              <div style="background:#faf9f7;border-radius:10px;padding:20px;border-left:3px solid #6b1d2b;margin-bottom:28px;">
                <p style="margin:0;font-size:14px;color:#444;line-height:1.7;">${truncated}</p>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:100px;background:#6b1d2b;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;">
                      Reply
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bbb;">You're receiving this because you have a Brandcove account.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
