const INSTAGRAM_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="#1a1a1a"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`

const TIKTOK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="#1a1a1a"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z"/></svg>`

const FACEBOOK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="#1a1a1a"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`

/**
 * Wraps email content in the standard BrandCove email shell:
 * logo → divider → content → branded footer.
 *
 * Update the social media hrefs below once handles are confirmed.
 */
export function emailHtml(title: string, content: string): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://brandcove.com'}/BrandCovePr.png`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 16px;background-color:#f9f5f0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:40px 44px 24px;">
              <img src="${logoUrl}" alt="BrandCove" width="130" style="display:block;border:0;height:auto;max-width:130px;">
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td height="2" style="background-color:#1a1a1a;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:44px 44px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#8fa3b0;padding:40px 44px;text-align:center;">
              <img src="${logoUrl}" alt="BrandCove" width="110" style="display:block;border:0;height:auto;max-width:110px;margin:0 auto 14px;">
              <p style="margin:0 0 20px;font-size:13px;color:#1a1a1a;line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Helping creatives connect with founders and get hired.</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
                <tr>
                  <td style="padding:0 10px;"><a href="#" target="_blank" style="text-decoration:none;display:inline-block;">${INSTAGRAM_ICON}</a></td>
                  <td style="padding:0 10px;"><a href="#" target="_blank" style="text-decoration:none;display:inline-block;">${TIKTOK_ICON}</a></td>
                  <td style="padding:0 10px;"><a href="#" target="_blank" style="text-decoration:none;display:inline-block;">${FACEBOOK_ICON}</a></td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-size:12px;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">&#169; BrandCove 2026</p>
              <a href="#" style="font-size:12px;color:#1a1a1a;text-decoration:underline;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Unsubscribe</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
