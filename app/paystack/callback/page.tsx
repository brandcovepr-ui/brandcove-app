import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { getSupabaseAdmin } from '@/lib/supabase/admin' // Imported from server-only module

interface SearchParams {
  reference?: string
  trxref?: string
}

export default async function PaystackCallbackPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const reference = params.reference || params.trxref

  if (!reference) {
    return <CallbackError message="No payment reference found. Please contact support." />
  }

  // 1. Authenticate user on the server
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect('/login')
  }

  let userRole = 'founder'

  // 2. Verify payment directly with Paystack API
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        cache: 'no-store',
      }
    )

    const data = await response.json()

    if (!response.ok || !data.status || data.data?.status !== 'success') {
      return <CallbackError message="Payment verification failed or transaction was not successful." />
    }

    const paystackEmail = data.data.customer?.email?.toLowerCase()
    const paystackMetadataUserId = data.data.metadata?.user_id

    // CRITICAL SECURITY FIX: Verify transaction ownership
    const isOwnerByEmail = paystackEmail && paystackEmail === user.email.toLowerCase()
    const isOwnerByMetadata = paystackMetadataUserId && paystackMetadataUserId === user.id

    if (!isOwnerByEmail && !isOwnerByMetadata) {
      console.error('[paystack/callback] Transaction ownership mismatch:', {
        authUser: user.id,
        authEmail: user.email,
        paystackEmail,
        paystackMetadataUserId,
      })
      return <CallbackError message="Unauthorized transaction reference." />
    }

    const customerCode = data.data.customer?.customer_code
    const planCode = data.data.plan?.plan_code || data.data.plan

    // 3. Admin client update to write subscription status
    const adminClient = getSupabaseAdmin()
    const { error: dbError } = await adminClient
      .from('profiles')
      .update({
        subscription_status: 'active',
        paystack_customer_code: customerCode ?? null,
        paystack_subscription_code: planCode ?? null,
      })
      .eq('id', user.id)

    if (dbError) {
      console.error('[paystack/callback] DB update error:', dbError)
      return <CallbackError message="Failed to update account status. Please contact support." />
    }

    // Fetch profile role to build target route
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role) {
      userRole = profile.role
    }
  } catch (err) {
    console.error('[paystack/callback] Verification error:', err)
    return <CallbackError message="Network error during verification. Please contact support." />
  }

  // 4. Server-side redirect executed OUTSIDE try/catch
  const destination = userRole === 'creative' ? '/dashboard/creator' : '/dashboard/founder'
  redirect(destination)
}

function CallbackError({ message }: { message: string }) {
  return (
    <div className="auth-bg flex h-screen flex-col items-center justify-center gap-4 font-poppins">
      <p className="max-w-sm text-center text-sm text-red-500">{message}</p>
      <Link href="/subscribe" className="text-sm text-gray-600 underline">
        Go back and try again
      </Link>
    </div>
  )
}