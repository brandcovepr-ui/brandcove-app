import { create } from 'zustand'
import { Profile } from '@/lib/types'

interface AppState {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  unreadCount: number
  setUnreadCount: (count: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}))
