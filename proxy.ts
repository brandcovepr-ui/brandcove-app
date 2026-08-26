import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function logProxyInfo(action: string, details: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      level: 'INFO',
      scope: 'proxy_middleware',
      action,
      timestamp: new Date().toISOString(),
      ...details,
    })
  )
}

function logProxyError(action: string, error: unknown, details: Record<string, unknown> = {}) {
  const errMessage = error instanceof Error ? error.message : String(error)
  const errStack = error instanceof Error ? error.stack : undefined
  console.error(
    JSON.stringify({
      level: 'ERROR',
      scope: 'proxy_middleware',
      action,
      error: errMessage,
      stack: errStack,
      timestamp: new Date().toISOString(),
      ...details,
    })
  )
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { searchParams, pathname } = request.nextUrl
  const code = searchParams.get('code')
  const flowId = searchParams.get('sb_flow_id') ?? undefined

  logProxyInfo('request_received', { pathname, searchParams: Object.fromEntries(searchParams.entries()) })

  // 1. Intercept PKCE Auth Code (handles password reset / OAuth redirects)
  if (code) {
    logProxyInfo('pkce_code_detected', { code, flowId })

    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    )

    if (exchangeError) {
      logProxyError('pkce_exchange_failed', exchangeError, { code, flowId })

      // Redirect to login page with error state if code exchange fails
      const errorRedirectUrl = new URL('/login', request.url)
      errorRedirectUrl.searchParams.set('error', 'Invalid or expired auth code')
      return NextResponse.redirect(errorRedirectUrl)
    }

    logProxyInfo('pkce_exchange_success', { userId: exchangeData.user?.id, email: exchangeData.user?.email })

    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/reset-password'
    redirectUrl.searchParams.delete('code')
    redirectUrl.searchParams.delete('type')
    redirectUrl.searchParams.delete('sb_flow_id')

    logProxyInfo('redirecting_to_reset_password', { targetUrl: redirectUrl.toString() })

    const redirectResponse = NextResponse.redirect(redirectUrl)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })

    return redirectResponse
  }

  // 2. Fetch authenticated user (getUser validates token authenticity server-side)
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError && userError.message !== 'Auth session missing!') {
    logProxyError('get_user_failed', userError, { pathname })
  }

  const isFounderRoute = pathname.startsWith('/founder')
  const isCreatorRoute = pathname.startsWith('/creator')
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')
  const isProtectedRoute = isFounderRoute || isCreatorRoute || isAdminRoute

  // Redirect unauthenticated users hitting protected routes to login
  if (!user && isProtectedRoute) {
    logProxyInfo('unauthenticated_access_blocked', { pathname })
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Role-Based Access Control (RBAC)
  if (user) {
    const userRole = (user.app_metadata?.role || user.user_metadata?.role) as string | undefined
    logProxyInfo('user_authenticated', { userId: user.id, role: userRole, pathname })

    if (isFounderRoute && userRole !== 'founder') {
      const target = userRole === 'creative' || userRole === 'creator' ? '/creator' : '/'
      logProxyInfo('rbac_redirect_founder_denied', { userId: user.id, role: userRole, target })
      return NextResponse.redirect(new URL(target, request.url))
    }

    if (isCreatorRoute && userRole !== 'creative' && userRole !== 'creator') {
      const target = userRole === 'founder' ? '/founder' : '/'
      logProxyInfo('rbac_redirect_creator_denied', { userId: user.id, role: userRole, target })
      return NextResponse.redirect(new URL(target, request.url))
    }

    // if (isAdminRoute && userRole !== 'admin') {
    //   const target = userRole === 'founder' ? '/founder' : userRole === 'creative' || userRole === 'creator' ? '/creator' : '/'
    //   logProxyInfo('rbac_redirect_admin_denied', { userId: user.id, role: userRole, target })
    //   return NextResponse.redirect(new URL(target, request.url))
    // }
  }

  return response
}