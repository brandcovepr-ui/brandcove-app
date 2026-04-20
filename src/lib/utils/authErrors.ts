export function getAuthErrorMessage(error: { message: string }): string {
  const msg = error.message.toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'The email or password you entered is incorrect.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Your email address has not been confirmed yet. Check your inbox for a verification code.'
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (msg.includes('email rate limit') || msg.includes('email_rate_limit')) {
    return "Too many emails sent to this address. Please wait a few minutes before trying again."
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a few minutes before trying again.'
  }
  if (msg.includes('token has expired') || msg.includes('otp expired')) {
    return 'This code has expired. Use the resend button to get a new one.'
  }
  if (msg.includes('token is invalid') || msg.includes('invalid otp') || msg.includes('otp_invalid')) {
    return 'That code is incorrect. Please double-check and try again.'
  }
  if (msg.includes('user not found')) {
    return 'No account found with that email address.'
  }
  if (msg.includes('signup_disabled') || msg.includes('signups not allowed')) {
    return 'New sign-ups are currently unavailable. Please try again later.'
  }
  if (msg.includes('weak password') || msg.includes('password should be')) {
    return 'Your password is too weak. Use at least 8 characters with a mix of letters and numbers.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'A network error occurred. Please check your connection and try again.'
  }

  // Fallback: capitalise first letter and strip trailing period for consistency
  return error.message.charAt(0).toUpperCase() + error.message.slice(1)
}
