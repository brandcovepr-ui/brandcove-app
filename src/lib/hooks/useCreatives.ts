'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const PAGE_SIZE = 9

interface CreativeFilters {
  discipline?: string
  availability?: string
  maxRate?: number
  page?: number
}

export function useCreatives(filters: CreativeFilters = {}) {
  const page = filters.page ?? 0
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  return useQuery({
    queryKey: ['creatives', filters],
    staleTime: 0,
    queryFn: async () => {
      const supabase = createClient()
      const hasFilters = filters.discipline || filters.availability || filters.maxRate

      // !inner excludes profiles with no matching creative_profiles row when filtering
      const joinType = hasFilters ? 'creative_profiles!inner(*)' : 'creative_profiles(*)'

      let query = supabase
        .from('profiles')
        .select(`*, ${joinType}`, { count: 'exact' })
        .eq('role', 'creative')
        .eq('review_status', 'approved')
        .eq('subscription_status', 'active')

      if (filters.discipline) {
        query = query.eq('creative_profiles.discipline', filters.discipline)
      }
      if (filters.availability) {
        query = query.eq('creative_profiles.availability', filters.availability)
      }
      if (filters.maxRate) {
        query = query.lte('creative_profiles.hourly_rate', filters.maxRate)
      }

      const { data, error, count } = await query.range(from, to)
      if (error) throw error
      return { items: data || [], total: count ?? 0, pageSize: PAGE_SIZE }
    },
  })
}

export function useCreative(id: string) {
  return useQuery({
    queryKey: ['creative', id],
    staleTime: 0,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*, creative_profiles(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
