export type Tab = 'all' | 'replied' | 'declined'

export interface FounderProfile {
  company_name: string | null
  industry: string | null
  website_url: string | null
  company_description: string | null
}

export interface Founder {
  id: string
  full_name: string | null
  avatar_url: string | null
  founder_profiles: FounderProfile | FounderProfile[] | null
}

export interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
}

export interface Offer {
  id: string
  rate: number | null
  terms: string | null
  start_date: string | null
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface Inquiry {
  id: string
  status: 'pending' | 'accepted' | 'hired' | 'declined' | 'cancelled'
  updated_at: string
  created_at: string
  project_description: string
  timeline: string | null
  budget: number | null
  founder: Founder | null
  messages: Message[]
  offers: Offer[]
}

export type ModalType = 'accept' | 'decline' | 'accept_offer' | 'decline_offer'

export interface ConfirmModalState {
  type?: ModalType
  offerId?: string
}