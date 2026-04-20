import { AuthTransition } from '@/components/auth/AuthTransition'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-bg h-screen">
      <AuthTransition>{children}</AuthTransition>
    </div>
  )
}
