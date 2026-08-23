import 'server-only'

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function emailText(value: unknown, maxLength = 2_000): string {
  return escapeHtml(String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength))
}

export function emailAddress(value: unknown): string {
  return emailText(value, 254)
}

export function externalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? escapeHtml(url.toString()) : null
  } catch {
    return null
  }
}
