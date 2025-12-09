import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { profileService } from '@/lib/services/profile.service'
import { buildOrgUrl } from '@/lib/context/org-context'
import { cookies } from 'next/headers'

// Helper to decode JWT payload (for debugging)
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
  } catch {
    return null
  }
}

function getAppBaseUrl(request: Request) {
  // Prefer explicit env in all non-dev environments
  const envUrl =
    process.env.FRONTEND_URL ??
    process.env.NEXT_PUBLIC_API_URL

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

  // === DEBUG LOGGING START ===
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const anonKeyPayload = anonKey ? decodeJwtPayload(anonKey) : null

  console.log('[Auth Callback] === SUPABASE CONFIG DEBUG ===')
  console.log('[Auth Callback] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.log('[Auth Callback] Anon key project ref:', anonKeyPayload?.ref)
  console.log('[Auth Callback] Code received:', code ? `${code.substring(0, 20)}...` : 'NONE')

  // Check for PKCE code_verifier cookie
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const codeVerifierCookies = allCookies.filter(c => c.name.includes('code-verifier'))
  console.log('[Auth Callback] All cookies:', allCookies.map(c => c.name))
  console.log('[Auth Callback] Code verifier cookies:', codeVerifierCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
  // === DEBUG LOGGING END ===

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    // Log exchange result
    if (error) {
      console.error('[Auth Callback] exchangeCodeForSession FAILED:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
    } else {
      console.log('[Auth Callback] exchangeCodeForSession SUCCESS, user:', data?.user?.email)
    }

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
