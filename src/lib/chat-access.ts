export type ChatStatus =
  | 'open'
  | 'locked_pending'
  | 'locked_inquiry_declined'
  | 'locked_offer_declined'
  | 'locked_cancelled'
  | 'locked_completed'

export interface ChatAccessResult {
  isOpen: boolean
  status: ChatStatus
  founderMessage: string
  creativeMessage: string
  showSendOfferButton: boolean
  showNewInquiryButton: boolean
}

interface ComputeChatAccessParams {
  inquiryStatus: string
  latestOfferStatus: string | null
}

export function computeChatAccess({
  inquiryStatus,
  latestOfferStatus,
}: ComputeChatAccessParams): ChatAccessResult {
  // Creative hasn't responded yet
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

  // Creative declined the inquiry outright
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

  // Founder cancelled the inquiry
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

  // Project completed
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

  // Accepted or hired — check offer state
  if (inquiryStatus === 'accepted' || inquiryStatus === 'hired') {
    if (latestOfferStatus === 'declined') {
      return {
        isOpen: false,
        status: 'locked_offer_declined',
        founderMessage: 'The creative declined your offer. Send a new offer to continue chatting.',
        creativeMessage: 'You declined this offer. The founder can send a new offer to continue.',
        showSendOfferButton: true,
        showNewInquiryButton: false,
      }
    }

    // No offer yet, pending offer, or accepted offer — chat is open
    return {
      isOpen: true,
      status: 'open',
      founderMessage: '',
      creativeMessage: '',
      showSendOfferButton: false,
      showNewInquiryButton: false,
    }
  }

  // Fallback
  return {
    isOpen: false,
    status: 'locked_pending',
    founderMessage: 'Chat is not available.',
    creativeMessage: 'Chat is not available.',
    showSendOfferButton: false,
    showNewInquiryButton: false,
  }
}
