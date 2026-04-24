import { createBrowserClient } from '@supabase/ssr'

const isDev = process.env.NODE_ENV === 'development'

function loggingFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const method = init?.method ?? 'GET'
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Strip the base URL and highlight the table/auth path
  const path = url.startsWith(base) ? url.slice(base.length) : url
  const start = performance.now()

  return fetch(input, init).then(res => {
    const ms = (performance.now() - start).toFixed(0)
    const status = res.status
    const ok = status >= 200 && status < 300
    const style = ok ? 'color:#16a34a;font-weight:600' : 'color:#dc2626;font-weight:600'
    // Clone so the body can still be consumed by the caller
    console.log(`%c[supabase] ${method} ${status} %c${path} %c${ms}ms`, style, 'color:inherit', 'color:#6b7280')
    return res
  }).catch(err => {
    const ms = (performance.now() - start).toFixed(0)
    console.error(`[supabase] ${method} ERR ${path} ${ms}ms`, err)
    throw err
  })
}

// Singleton — one instance owns the auto-refresh timer.
// Multiple instances each set up competing timers, which can race on expiry
// and cause 401s when one timer wins the refresh but others still hold the
// stale token. A single shared instance eliminates the race entirely.
let _client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (_client) return _client
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    isDev ? { global: { fetch: loggingFetch } } : undefined
  )
  return _client
}
