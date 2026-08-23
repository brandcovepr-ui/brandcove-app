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


export interface ComputeChatAccessParams {
  inquiryStatus: string
  latestOfferStatus?: string | null
}

export interface ChatAccessResult {
  isOpen: boolean
  status: string
  founderMessage: string
  creativeMessage: string
  showSendOfferButton: boolean
  showNewInquiryButton: boolean
}

export function computeChatAccess({
  inquiryStatus,
  latestOfferStatus,
}: ComputeChatAccessParams): ChatAccessResult {
  // 1. Creative hasn't responded to initial inquiry
  if (inquiryStatus === 'pending') {
    return {
      isOpen: false,
      status: 'locked_pending',
      founderMessage: 'Waiting for the creative to respond to your inquiry.',
      creativeMessage: 'You have a new inquiry. Accept or decline to continue.',
      showSendOfferButton: false,
      showNewInquiryButton: false,
    }
  }

  // 2. Creative declined the inquiry outright
  if (inquiryStatus === 'declined') {
    return {
      isOpen: false,
      status: 'locked_inquiry_declined',
      founderMessage: 'This inquiry was declined.',
      creativeMessage: 'You declined this inquiry.',
      showSendOfferButton: false,
      showNewInquiryButton: true,
    }
  }

  // 3. Founder cancelled the inquiry
  if (inquiryStatus === 'cancelled') {
    return {
      isOpen: false,
      status: 'locked_cancelled',
      founderMessage: 'You ended this inquiry.',
      creativeMessage: 'This inquiry was ended by the founder.',
      showSendOfferButton: false,
      showNewInquiryButton: false,
    }
  }

  // 4. Project completed
  if (inquiryStatus === 'completed') {
    return {
      isOpen: false,
      status: 'locked_completed',
      founderMessage: 'This project is complete.',
      creativeMessage: 'This project is complete.',
      showSendOfferButton: false,
      showNewInquiryButton: false,
    }
  }

  // 5. Accepted, Hired, or Active Inquiry
  // Check for 'accepted' status
  if (inquiryStatus === 'accepted' || inquiryStatus === 'hired' || inquiryStatus === 'active') {
    if (latestOfferStatus === 'declined') {
      return {
        isOpen: true,
        status: 'offer_declined_negotiating',
        founderMessage: 'The offer was declined. You can message to negotiate or send a new offer.',
        creativeMessage: 'You declined the offer. You can message the founder to discuss terms.',
        showSendOfferButton: true,
        showNewInquiryButton: false,
      }
    }
  
    return {
      isOpen: true,
      status: 'open',
      founderMessage: '',
      creativeMessage: '',
      showSendOfferButton: false,
      showNewInquiryButton: false,
    }
  
  }

  // Fallback for unexpected states
  return {
    isOpen: false,
    status: 'locked_unknown',
    founderMessage: 'Chat is not available.',
    creativeMessage: 'Chat is not available.',
    showSendOfferButton: false,
    showNewInquiryButton: false,
  }
}