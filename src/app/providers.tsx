'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,   // 5 min — prevents refetch on every navigation
        gcTime: 10 * 60 * 1000,     // 10 min — keep data in cache longer
        retry: 1,
        refetchOnWindowFocus: true, // don't refetch just because user switched tabs
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
