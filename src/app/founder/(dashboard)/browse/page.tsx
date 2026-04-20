'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useCreatives } from '@/lib/hooks/useCreatives'
import { CreativeCard } from '@/components/creatives/CreativeCard'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

const ROLES = [
  'Social Media Manager', 'Web Designer', 'Graphic Designer', 'Sales Rep',
  'Customer Service Rep', 'Creative Assistant', 'Copywriter', 'Video Editor',
]
const BUDGETS = [
  { label: 'Under ₦50k', value: 50000 },
  { label: 'Under ₦100k', value: 100000 },
  { label: 'Under ₦200k', value: 200000 },
]
const AVAILABILITY_OPTIONS = [
  { label: 'Available Now', value: 'available' },
  { label: 'Open to Offers', value: 'open_to_offers' },
  { label: 'Busy', value: 'busy' },
]

function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: { label: string; value: string | number }[]
  selected: string | number | undefined
  onSelect: (value: string | number | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const active = selected !== undefined
  const currentLabel = options.find(o => o.value === selected)?.label

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 border rounded-lg px-4 py-2 text-sm transition-colors font-medium ${
          active
            ? 'border-[#6b1d2b] bg-[#fdf4f5] text-[#6b1d2b]'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {active ? currentLabel : label}
        {active ? (
          <span
            onClick={e => { e.stopPropagation(); onSelect(undefined) }}
            className="ml-0.5 hover:text-[#4e1520]"
          >
            <X size={12} />
          </span>
        ) : (
          <ChevronDown size={14} className="text-gray-500" />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-52 py-1.5">
          {options.map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => { onSelect(opt.value); setOpen(false) }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700"
            >
              {opt.label}
              {opt.value === selected && <Check size={14} className="text-[#6b1d2b]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BrowsePage() {
  const { profile } = useUser()
  const [role, setRole] = useState<string | undefined>(undefined)
  const [availability, setAvailability] = useState<string | undefined>(undefined)
  const [maxRate, setMaxRate] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(0)

  const { data: shortlistedIds } = useQuery({
    queryKey: ['shortlist-ids', profile?.id],
    staleTime: 0,
    queryFn: async () => {
      if (!profile?.id) return new Set<string>()
      const supabase = createClient()
      const { data } = await supabase
        .from('shortlists')
        .select('creative_id')
        .eq('founder_id', profile.id)
      return new Set((data || []).map((r: any) => r.creative_id as string))
    },
    enabled: !!profile?.id,
  })

  function setRoleFilter(v: string | undefined) { setRole(v); setPage(0) }
  function setAvailFilter(v: string | undefined) { setAvailability(v as string | undefined); setPage(0) }
  function setRateFilter(v: number | undefined) { setMaxRate(v as number | undefined); setPage(0) }

  const hasActiveFilters = role !== undefined || availability !== undefined || maxRate !== undefined

  function clearFilters() {
    setRole(undefined)
    setAvailability(undefined)
    setMaxRate(undefined)
    setPage(0)
  }

  const { data, isLoading, isFetching } = useCreatives({
    discipline: role,
    availability,
    maxRate,
    page,
  })

  const creatives = data?.items ?? []
  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 9
  const totalPages = Math.ceil(total / pageSize)
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)

  const showSkeleton = isLoading || (isFetching && creatives.length === 0)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-editorial  font-regular text-gray-900 mb-6">Browse Talent</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <FilterDropdown
          label="Role: Any"
          options={ROLES.map(r => ({ label: r, value: r }))}
          selected={role}
          onSelect={v => setRoleFilter(v as string | undefined)}
        />
        <FilterDropdown
          label="Budget: Any"
          options={BUDGETS}
          selected={maxRate}
          onSelect={v => setRateFilter(v as number | undefined)}
        />
        <FilterDropdown
          label="Availability: Any"
          options={AVAILABILITY_OPTIONS}
          selected={availability}
          onSelect={v => setAvailFilter(v as string | undefined)}
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        )}

        {!isLoading && data && (
          <span className="ml-auto text-xs text-gray-400">
            {total === 0 ? '0 results' : `${from}–${to} of ${total}`}
          </span>
        )}
      </div>

      {/* Grid */}
      {showSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-52" />
          ))}
        </div>
      ) : creatives.length > 0 ? (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            {creatives.map((creative: any) => (
              <CreativeCard
                key={creative.id}
                creative={creative}
                initialShortlisted={shortlistedIds?.has(creative.id) ?? false}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      i === page
                        ? 'bg-[#6b1d2b] text-white'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search size={22} className="text-gray-300" />
          </div>
          <p className="text-gray-700 font-medium mb-1">No creatives found</p>
          <p className="text-sm text-gray-400 mb-5">
            {hasActiveFilters
              ? 'No one matches your current filters. Try adjusting or clearing them.'
              : 'No creatives have joined yet.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="bg-[#6b1d2b] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#4e1520] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
