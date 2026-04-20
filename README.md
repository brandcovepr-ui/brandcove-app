# BrandCove — Frontend

Next.js 14 frontend for the BrandCove two-sided marketplace connecting Founders with Creatives.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui**
- **Supabase JS** (`@supabase/supabase-js`, `@supabase/ssr`) — auth + realtime chat
- **TanStack Query** — server state / data fetching
- **Zustand** — client state
- **React Hook Form + Zod** — forms and validation
- **Lucide React** — icons
- **Paystack Inline JS** — subscription checkout

## Setup

```bash
npm install
cp .env.local .env.local.bak  # back up, then edit .env.local
npm run dev
```

## Environment Variables (`.env.local`)

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack dashboard → Settings → API Keys & Webhooks |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` for local dev |

## Folder Structure

```
src/
├── app/
│   ├── (auth)/              # login, signup, forgot-password, reset-password
│   ├── (onboarding)/        # founder onboarding (3-step wizard) + complete page
│   ├── (protected)/         # dashboard, browse, profile/[id], shortlist,
│   │                        # inquiries, inquiries/[id], messages, settings
│   └── subscribe/           # Paystack subscription paywall
├── components/
│   ├── auth/                # LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm, AuthCard
│   ├── onboarding/          # FounderOnboardingForm
│   ├── layout/              # Sidebar
│   ├── creatives/           # CreativeCard
│   ├── inquiries/           # SendInquiryModal
│   └── chat/                # ChatWindow, ChatMessage, ChatInput
├── lib/
│   ├── supabase/            # client.ts (browser), server.ts (RSC)
│   ├── api/                 # Fetch wrapper for FastAPI backend
│   ├── hooks/               # useUser, useChat, useCreatives
│   ├── stores/              # Zustand global store
│   ├── types/               # TypeScript interfaces
│   └── paystack/            # Paystack inline popup helper
└── middleware.ts             # Auth + onboarding + subscription gate (Next.js Edge)
```

## Key User Flows

1. **Sign up** → 3-step onboarding (company info, stage, roles) → subscribe → dashboard
2. **Browse Talent** — filter by role, budget, availability
3. **View creative profile** → Send inquiry → real-time chat via Supabase Realtime
4. **Shortlist** creatives for later comparison
5. **Settings** — edit profile, manage subscription, change password, cancel

## Middleware Logic

`src/middleware.ts` runs on every request and:
1. Checks Supabase session — if none, redirects to `/login`
2. Checks `onboarding_complete` — if false, redirects to `/founder`
3. Checks `subscription_status` — if not `active`, redirects to `/subscribe`
4. Lets public routes through (`/`, `/login`, `/signup`, etc.)

## Running with Docker

From the parent folder:
```bash
docker-compose up --build
```
# brandcove-app
