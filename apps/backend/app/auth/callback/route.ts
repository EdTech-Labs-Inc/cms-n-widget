import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { profileService } from '@/lib/services/profile.service'
import { buildOrgUrl } from '@/lib/context/org-context'

function getAppBaseUrl(request: Request) {
  // Prefer explicit env in all non-dev environments
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL

  if (envUrl) return envUrl.replace(/\/+$/, '') // trim trailing slash

  // Fallback: derive from forwarded headers / host
  const headers = request.headers
  const forwardedHost = headers.get('x-forwarded-host')
  const forwardedProto = headers.get('x-forwarded-proto') ?? 'https'
  const host = forwardedHost ?? headers.get('host') ?? 'localhost:3000'

  return `${forwardedProto}://${host}`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  const baseUrl = getAppBaseUrl(request) // <-- always a public-facing URL

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Auto-create/update user profile
      await profileService.upsertProfile(data.user)

      // Check if user has an organization
      const userOrg = await profileService.getUserOrganization(data.user.id)

      // Determine redirect path based on org membership
      if (!userOrg) {
        // No organization - redirect to onboarding
        next = '/onboarding'
      } else if (next === '/' || !next.startsWith('/org/')) {
        // Has org, but next path is not org-scoped
        if (next.startsWith('/join/')) {
          // Preserve join token redirects
          // (handled by onboarding if they don't have org yet)
        } else {
          next = buildOrgUrl(userOrg.slug, '/dashboard')
        }
      }

      // Use baseUrl instead of origin / internal host
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // Error case: also use baseUrl
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}
