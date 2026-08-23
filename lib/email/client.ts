import { Resend } from 'resend'
import 'server-only'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('Missing RESEND_API_KEY')
    _resend = new Resend(apiKey)
  }
  return _resend
}

export const FROM = process.env.EMAIL_FROM ?? 'Brandcove <hello@brandcove.co>'
