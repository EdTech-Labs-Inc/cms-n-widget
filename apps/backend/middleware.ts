import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { extractOrgSlugFromPath, buildOrgUrl } from "@/lib/context/org-context";
import { profileService } from "@/lib/services/profile.service";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/webhooks") ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/api/health") ||
    request.nextUrl.pathname.startsWith("/api/admin/backfill-thumbnails") ||
    request.nextUrl.pathname.startsWith("/api/submissions") ||
    request.nextUrl.pathname.startsWith("/api/tags/bulk") ||
    request.nextUrl.pathname.startsWith("/api/articles/upload") || // Skip middleware for file uploads
    request.nextUrl.pathname.includes("/upload-thumbnail") || // Skip for all thumbnail uploads
    request.nextUrl.pathname.startsWith("/api/organizations") || // Skip for org management (has own auth)
    request.nextUrl.pathname.startsWith("/api/join") || // Skip for join workflows
    request.nextUrl.pathname.startsWith("/api/join-requests") || // Skip for join request management (has own auth)
    request.nextUrl.pathname.startsWith("/api/auth/user-with-org") || // Skip for auth checks
    request.nextUrl.pathname.startsWith("/api/org") || // Skip for org-scoped API routes (have own auth)
    request.nextUrl.pathname.startsWith("/api/heygen") || // Skip for HeyGen avatar/character APIs (public data)
    request.nextUrl.pathname.startsWith("/api/feature-flags") || // Skip for feature flags (public endpoint)
    request.nextUrl.pathname.startsWith("/api/support") || // Skip for support widget (handles own auth)
    request.nextUrl.pathname.startsWith("/api/test/submagic")
  ) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/api") ||
      request.headers.get("accept")?.includes("application/json"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protected routes - redirect to login if not authenticated
  // Allow landing page (/) for unauthenticated users
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ============================================
  // ORGANIZATION-BASED ROUTING
  // ============================================

  // Skip organization checks for these paths
  const skipOrgCheck =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/onboarding" ||
    request.nextUrl.pathname.startsWith("/join/") ||
    request.nextUrl.pathname.startsWith("/admin"); // Platform admin routes

  if (user && !skipOrgCheck) {
    // Get user's organization membership
    const userOrg = await profileService.getUserOrganization(user.id);

    // Extract org slug from current path
    const currentOrgSlug = extractOrgSlugFromPath(request.nextUrl.pathname);

    // If user is not in any organization, redirect to onboarding
    if (!userOrg) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Check if user is trying to access org-scoped routes
    if (currentOrgSlug) {
      // Validate user has access to this org
      // Since users can only be in one org, just check if it's their org
      if (currentOrgSlug !== userOrg.slug) {
        // Check if user is platform admin (can access any org)
        const isAdmin = await profileService.isAdmin(user.id);

        if (!isAdmin) {
          // Redirect to their own org
          const url = request.nextUrl.clone();
          const pathAfterOrg = request.nextUrl.pathname.replace(
            `/org/${currentOrgSlug}`,
            ""
          );
          url.pathname = buildOrgUrl(
            userOrg.slug,
            pathAfterOrg || "/dashboard"
          );
          return NextResponse.redirect(url);
        }
      }
    } else {
      // User is accessing a non-org route (e.g., /, /settings)
      // Redirect to their org's dashboard
      const url = request.nextUrl.clone();

      // Map old routes to new org-scoped routes
      const pathMapping: Record<string, string> = {
        "/": "/dashboard",
        "/dashboard": "/dashboard",
        "/articles": "/articles",
        "/create": "/create",
        "/library": "/library",
        "/submissions": "/submissions",
        "/settings": "/settings",
      };

      const targetPath =
        pathMapping[request.nextUrl.pathname] || "/dashboard";
      url.pathname = buildOrgUrl(userOrg.slug, targetPath);
      return NextResponse.redirect(url);
    }
  }

  // If user is logged in and tries to access login page, redirect to their org dashboard
  if (user && request.nextUrl.pathname === "/login") {
    const userOrg = await profileService.getUserOrganization(user.id);
    const url = request.nextUrl.clone();

    if (userOrg) {
      url.pathname = buildOrgUrl(userOrg.slug, "/dashboard");
    } else {
      url.pathname = "/onboarding";
    }

    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

export const config = {
  runtime: "nodejs", // important because we use prisma in the middleware
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
