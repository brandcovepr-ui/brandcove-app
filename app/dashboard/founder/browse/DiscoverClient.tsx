'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { CreativeCard } from '@/app/components/ui/CreativesCard'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { getCreativesAction, type GetCreativesResponse } from '@/app/actions/founder'

const ROLES = [
  'Social Media Manager',
  'Graphic Designer',
  'Sales Representative',
  'Customer Service Specialist',
  'Operations Manager',
  'Marketing Associate',
]

const BUDGETS = [
  { label: 'Under ₦50k', value: 50000 },
  { label: 'Under ₦100k', value: 100000 },
  { label: 'Under ₦200k', value: 200000 },
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
  const currentLabel = options.find((o) => o.value === selected)?.label

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 border rounded-lg px-4 py-2 text-sm transition-colors font-medium ${
          active
            ? 'border-[#6b1d2b] bg-[#fdf4f5] text-[#6b1d2b]'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {active ? currentLabel : label}
        {active ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onSelect(undefined)
            }}
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
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                onSelect(opt.value)
                setOpen(false)
              }}
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

export function DiscoverClient({
  initialData,
}: {
  initialData: GetCreativesResponse
}) {
  const [data, setData] = useState<GetCreativesResponse>(initialData)
  const [role, setRole] = useState<string | undefined>(undefined)
  const [maxRate, setMaxRate] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(0)
  const [isPending, startTransition] = useTransition()

  const shortlistedSet = new Set(data.shortlistedIds)

  function fetchFilteredData(
    nextRole: string | undefined,
    nextMaxRate: number | undefined,
    nextPage: number
  ) {
    startTransition(async () => {
      const res = await getCreativesAction({
        role: nextRole,
        maxRate: nextMaxRate,
        page: nextPage,
      })
      setData(res)
    })
  }

  function handleRoleSelect(v: string | number | undefined) {
    const val = v as string | undefined
    setRole(val)
    setPage(0)
    fetchFilteredData(val, maxRate, 0)
  }

  function handleRateSelect(v: string | number | undefined) {
    const val = v as number | undefined
    setMaxRate(val)
    setPage(0)
    fetchFilteredData(role, val, 0)
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
    fetchFilteredData(role, maxRate, nextPage)
  }

  function clearFilters() {
    setRole(undefined)
    setMaxRate(undefined)
    setPage(0)
    fetchFilteredData(undefined, undefined, 0)
  }

  const hasActiveFilters = role !== undefined || maxRate !== undefined
  const creatives = data.items
  const total = data.total
  const pageSize = data.pageSize
  const totalPages = Math.ceil(total / pageSize)
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-editorial font-regular text-gray-900 mb-6">
        Browse Talent
      </h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <FilterDropdown
          label="Role: Any"
          options={ROLES.map((r) => ({ label: r, value: r }))}
          selected={role}
          onSelect={handleRoleSelect}
        />
        <FilterDropdown
          label="Budget: Any"
          options={BUDGETS}
          selected={maxRate}
          onSelect={handleRateSelect}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400">
          {total === 0 ? '0 results' : `${from}–${to} of ${total}`}
        </span>
      </div>

      {/* Grid */}
      {isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-52"
            />
          ))}
        </div>
      ) : creatives.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {creatives.map((creative) => (
              <CreativeCard
                key={creative.id}
                creative={creative}
                initialShortlisted={shortlistedSet.has(creative.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(0, page - 1))}
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
                    type="button"
                    onClick={() => handlePageChange(i)}
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
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : hasActiveFilters ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#f5eeee] flex items-center justify-center mb-6">
            <Search size={32} className="text-[#6b1d2b]" />
          </div>
          <h2 className="font-editorial text-3xl text-gray-900 mb-3">
            No results found.
          </h2>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-7">
            No one matches your current filters. Try adjusting or clearing them to see more talent.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="bg-[#6b1d2b] text-white px-7 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4e1520] transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#f5eeee] flex items-center justify-center mb-6">
            <Search size={32} className="text-[#6b1d2b]" />
          </div>
          <h2 className="font-editorial text-3xl text-gray-900 mb-3">
            No talent available yet.
          </h2>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            Creatives are being reviewed and approved. Check back soon — your perfect match is on the way.
          </p>
        </div>
      )}
    </div>
  )
}