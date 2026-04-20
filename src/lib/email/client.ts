import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM = process.env.EMAIL_FROM ?? 'Brandcove <hello@brandcove.co>'
