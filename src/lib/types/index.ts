export type UserRole = 'founder' | 'creative' | 'admin'

export type SubscriptionStatus = 'active' | 'inactive' | 'grace_period'

export type AvailabilityStatus = 'available' | 'busy' | 'open_to_offers'

export type InquiryStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'hired' | 'completed'

export type OfferStatus = 'pending' | 'accepted' | 'declined'

export type CreativeReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  subscription_status: SubscriptionStatus
  subscription_plan: string | null
  subscription_expires_at: string | null
  paystack_customer_code: string | null
  paystack_subscription_code: string | null
  onboarding_complete: boolean
  review_status: CreativeReviewStatus | null
  created_at: string
  updated_at: string
}

export interface FounderProfile {
  id: string
  company_name: string
  industry: string[]
  website_url: string | null
  company_description: string | null
  creative_types_wanted: string[]
  company_stage: string | null
}

export interface CreativeProfile {
  id: string
  discipline: string
  skills: string[]
  portfolio_url: string | null
  hourly_rate: number | null
  availability: AvailabilityStatus
  location: string | null
  years_experience: number | null
  review_notes: string | null
  reviewed_at: string | null
}

export interface WorkSample {
  id: string
  creative_id: string
  url: string
  title: string | null
  file_type: 'image' | 'pdf' | 'video' | 'other' | null
  created_at: string
}

export interface CreativeWithProfile extends Profile {
  creative_profiles: CreativeProfile
}

export interface Shortlist {
  id: string
  founder_id: string
  creative_id: string
  created_at: string
}

export interface Inquiry {
  id: string
  founder_id: string
  creative_id: string
  project_description: string
  timeline: string | null
  budget: number | null
  status: InquiryStatus
  created_at: string
  updated_at: string
  founder?: Profile
  creative?: Profile & { creative_profiles?: CreativeProfile }
}

export interface Message {
  id: string
  inquiry_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}

export interface Offer {
  id: string
  inquiry_id: string
  founder_id: string
  creative_id: string
  terms: string | null
  rate: number | null
  start_date: string | null
  status: OfferStatus
  created_at: string
}

export interface RecentActivity {
  id: string
  type: 'inquiry_sent' | 'message_received' | 'shortlisted' | 'payment'
  description: string
  created_at: string
  avatar_url?: string
}
