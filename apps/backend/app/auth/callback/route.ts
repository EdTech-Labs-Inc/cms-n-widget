import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { profileService } from '@/lib/services/profile.service'
import { buildOrgUrl } from '@/lib/context/org-context'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
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
        // Redirect to their org's dashboard (or preserve path if it's a special route)
        if (next.startsWith('/join/')) {
          // Preserve join token redirects
          // (handled by onboarding if they don't have org yet)
        } else {
          next = buildOrgUrl(userOrg.slug, '/dashboard')
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
