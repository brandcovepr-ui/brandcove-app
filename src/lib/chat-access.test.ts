import { computeChatAccess } from './chat-access'

describe('computeChatAccess', () => {
  it('locks when inquiry is pending', () => {
    const result = computeChatAccess({ inquiryStatus: 'pending', latestOfferStatus: null })
    expect(result.isOpen).toBe(false)
    expect(result.status).toBe('locked_pending')
    expect(result.showSendOfferButton).toBe(false)
    expect(result.showNewInquiryButton).toBe(false)
  })

  it('opens when inquiry is accepted with no offer', () => {
    const result = computeChatAccess({ inquiryStatus: 'accepted', latestOfferStatus: null })
    expect(result.isOpen).toBe(true)
    expect(result.status).toBe('open')
  })

  it('stays open when offer is pending', () => {
    const result = computeChatAccess({ inquiryStatus: 'accepted', latestOfferStatus: 'pending' })
    expect(result.isOpen).toBe(true)
    expect(result.status).toBe('open')
  })

  it('stays open when offer is accepted', () => {
    const result = computeChatAccess({ inquiryStatus: 'accepted', latestOfferStatus: 'accepted' })
    expect(result.isOpen).toBe(true)
    expect(result.status).toBe('open')
  })

  it('locks when offer is declined', () => {
    const result = computeChatAccess({ inquiryStatus: 'accepted', latestOfferStatus: 'declined' })
    expect(result.isOpen).toBe(false)
    expect(result.status).toBe('locked_offer_declined')
    expect(result.showSendOfferButton).toBe(true)
  })

  it('reopens when new offer is sent after declined (offer now pending)', () => {
    const result = computeChatAccess({ inquiryStatus: 'accepted', latestOfferStatus: 'pending' })
    expect(result.isOpen).toBe(true)
  })

  it('locks when inquiry is cancelled', () => {
    const result = computeChatAccess({ inquiryStatus: 'cancelled', latestOfferStatus: null })
    expect(result.isOpen).toBe(false)
    expect(result.status).toBe('locked_cancelled')
    expect(result.showSendOfferButton).toBe(false)
  })

  it('locks when inquiry is declined', () => {
    const result = computeChatAccess({ inquiryStatus: 'declined', latestOfferStatus: null })
    expect(result.isOpen).toBe(false)
    expect(result.status).toBe('locked_inquiry_declined')
    expect(result.showNewInquiryButton).toBe(true)
  })

  it('stays open when hired with no offer', () => {
    const result = computeChatAccess({ inquiryStatus: 'hired', latestOfferStatus: null })
    expect(result.isOpen).toBe(true)
  })

  it('stays open when hired with accepted offer', () => {
    const result = computeChatAccess({ inquiryStatus: 'hired', latestOfferStatus: 'accepted' })
    expect(result.isOpen).toBe(true)
  })

  it('locks when hired but offer declined', () => {
    const result = computeChatAccess({ inquiryStatus: 'hired', latestOfferStatus: 'declined' })
    expect(result.isOpen).toBe(false)
    expect(result.showSendOfferButton).toBe(true)
  })

  it('locks when inquiry is completed', () => {
    const result = computeChatAccess({ inquiryStatus: 'completed', latestOfferStatus: null })
    expect(result.isOpen).toBe(false)
    expect(result.status).toBe('locked_completed')
    expect(result.showSendOfferButton).toBe(false)
    expect(result.showNewInquiryButton).toBe(false)
  })

  it('shows correct founder vs creative messages when offer declined', () => {
    const result = computeChatAccess({ inquiryStatus: 'accepted', latestOfferStatus: 'declined' })
    expect(result.founderMessage).toContain('Send a new offer')
    expect(result.creativeMessage).toContain('declined this offer')
  })

  it('shows correct messages when inquiry cancelled', () => {
    const result = computeChatAccess({ inquiryStatus: 'cancelled', latestOfferStatus: null })
    expect(result.founderMessage).toContain('You ended')
    expect(result.creativeMessage).toContain('ended by the founder')
  })
})
