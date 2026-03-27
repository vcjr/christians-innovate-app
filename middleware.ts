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
          // Pillar: Maintenance - Use native Next.js delete method
          request.cookies.delete(name)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.delete(name)
        },
      },
    }
  )

  // Refresh the session if it exists/is expired
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname;

  // 1. Define Route Categories
  const isPublicAuthPage = ['/login', '/signup', '/forgot-password'].some(path => pathname.startsWith(path));
  const isPublicRoute = isPublicAuthPage || pathname.startsWith('/auth/confirm');
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isSuccessPage = pathname === '/onboarding/success';
  // Reset password requires a valid session (set by exchangeCodeForSession) but bypasses the onboarding gate
  const isResetPasswordRoute = pathname.startsWith('/reset-password');

  // 2. Authentication Gate: Redirect to login if no user
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2b. Redirect logged-in users away from auth pages (login, signup, forgot-password)
  if (user && isPublicAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Onboarding "Iron Gate" Funnel: Force onboarding if not completed
  // Reset password is exempt — users arrive here mid-session from an email link
  if (user && !isPublicRoute && !isOnboardingRoute && !isSuccessPage && !isResetPasswordRoute) {
    const hasCompletedOnboarding = user.user_metadata?.has_completed_onboarding === true;
    if (!hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // 4. Step Resumption: If on onboarding root without a step, redirect to the last known step
  if (isOnboardingRoute && !isSuccessPage && !request.nextUrl.searchParams.has('step')) {
    const stepCookie = request.cookies.get('onboarding_step')?.value;
    if (stepCookie) {
      const step = parseInt(stepCookie, 10);
      if (!isNaN(step) && step >= 0) {
        const url = request.nextUrl.clone();
        url.searchParams.set('step', stepCookie);
        return NextResponse.redirect(url);
      }
    }
  }

  // 5. Unified Completion Guard (Iron Gate): Seal the funnel once finished
  if (user && isOnboardingRoute) {
    const hasCompletedOnboarding = user.user_metadata?.has_completed_onboarding === true;
    const hasSuccessAuth = request.cookies.get('sb_success_auth')?.value === 'true';

    // Scenario A: Attempting to access success page without a valid one-time token
    // Scenario B: Attempting to access any other onboarding route after completion
    const isUnauthorizedSuccess = isSuccessPage && !hasSuccessAuth;
    const isReenteringFunnel = !isSuccessPage && hasCompletedOnboarding;

    if (isUnauthorizedSuccess || isReenteringFunnel) {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
      
      // Pillar: Reliability - Sync Supabase cookies to the redirect response
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });

      // Pillar: Security - Use a server-set cookie instead of forgeable URL params
      redirectResponse.cookies.set('next_notice', 'onboarding_complete', { path: '/', sameSite: 'lax', httpOnly: false });
      return redirectResponse;
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