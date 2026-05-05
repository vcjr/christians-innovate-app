/** @jest-environment node */
import { middleware } from './middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Pillar: Maintenance
 * We use requireActual to keep the real NextRequest constructor (which handles complex URL parsing),
 * while selectively mocking NextResponse to track redirections and "next" calls.
 */
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      next: jest.fn().mockImplementation(() => ({
        cookies: { 
          set: jest.fn(), 
          get: jest.fn(), 
          getAll: jest.fn().mockReturnValue([]),
          delete: jest.fn() 
        },
        headers: new Headers() as Headers,
      })),
      redirect: jest.fn().mockImplementation((url) => ({
        url,
        headers: new Headers({ location: url.toString() }) as Headers,
        cookies: {
          set: jest.fn(),
          get: jest.fn(),
          getAll: jest.fn().mockReturnValue([]),
          delete: jest.fn()
        }
      })),
    },
  };
});

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

describe('Middleware Guardrail', () => {
  const mockGetUser = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (createServerClient as jest.Mock).mockReturnValue({
      auth: { getUser: mockGetUser },
    });
  });

  const createRequest = (path: string, headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
    const url = new URL(`http://localhost${path}`);
    const h = new Headers(headers);
    
    // Pillar: Reliability - NextRequest parses cookies from the 'Cookie' header.
    // We must format the cookies object into a standard semicolon-separated string.
    const cookieString = Object.entries(cookies)
      .map(([key, val]) => `${key}=${val}`)
      .join('; ');
    
    if (cookieString) h.set('Cookie', cookieString);

    return new NextRequest(url, { headers: h });
  };

  it('redirects unauthenticated users to /login for protected routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = createRequest('/dashboard');
    
    await middleware(req);
    
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' })
    );
  });

  it('redirects authenticated but un-onboarded users to /onboarding', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { has_completed_onboarding: false } } },
    });
    const req = createRequest('/dashboard');
    
    await middleware(req);
    
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/onboarding' })
    );
  });

  it('allows access to /dashboard if onboarding is completed', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { has_completed_onboarding: true } } },
    });
    const req = createRequest('/dashboard');
    
    await middleware(req);
    
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('allows access to /onboarding even if not completed (prevents loops)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { has_completed_onboarding: false } } },
    });
    const req = createRequest('/onboarding');
    
    await middleware(req);
    
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('allows access to /onboarding/success (prevents loops on the success page)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { has_completed_onboarding: false } } },
    });
    // Pillar: Security - The success page is a privileged route that requires the one-time token.
    const req = createRequest('/onboarding/success', {}, { sb_success_auth: 'true' });
    
    await middleware(req);
    
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('redirects completed users to dashboard regardless of referer (Iron Gate)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { has_completed_onboarding: true } } },
    });
    // Even with a valid internal referer, we now force dashboard to break loops
    const req = createRequest('/onboarding', {
      referer: 'http://localhost/previous-page',
    });
    
    const res = await middleware(req) as any;
    
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' })
    );
    
    // Pillar: Security - Ensure the notice is still triggered
    expect(res.cookies.set).toHaveBeenCalledWith(
      'next_notice',
      'onboarding_complete',
      expect.objectContaining({ httpOnly: false, sameSite: 'lax' })
    );
  });

  it('redirects completed users to dashboard for direct entries', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { has_completed_onboarding: true } } },
    });
    const req = createRequest('/onboarding');
    
    await middleware(req);
    
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' })
    );
  });

  it('allows completed users to view the success page only with a valid auth cookie', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { has_completed_onboarding: true } } },
    });
    const req = createRequest('/onboarding/success', {}, { sb_success_auth: 'true' });
    
    await middleware(req);
    
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('redirects completed users away from success page if no auth cookie is present (One-Time Guard)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { has_completed_onboarding: true } } },
    });
    const req = createRequest('/onboarding/success'); // No sb_success_auth cookie
    
    await middleware(req);
    
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' })
    );
  });
});