import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update request cookies so subsequent logic in this request sees the change
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Create a new response to ensure cookies are set in the headers
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh the session if it exists/is expired
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname;
  
  // 1. Define Route Categories
  const isPublicRoute = ['/login', '/signup', '/auth'].some(path => pathname.startsWith(path));
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isSuccessPage = pathname === '/onboarding/success';
  
  // 2. Authentication Gate: Redirect to login if no user
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Onboarding "Iron Gate" Funnel: Force onboarding if not completed
  if (user && !isPublicRoute && !isOnboardingRoute && !isSuccessPage) {
    const hasCompletedOnboarding = user.user_metadata?.has_completed_onboarding === true;
    if (!hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (svg, png, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}