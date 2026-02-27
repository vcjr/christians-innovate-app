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
          remove: jest.fn() 
        },
        headers: new Headers(),
      })),
      redirect: jest.fn().mockImplementation((url) => ({
        url,
        headers: new Headers({ location: url.toString() }),
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

  const createRequest = (path: string) => {
    return new NextRequest(new URL(`http://localhost${path}`), {
      headers: new Headers(),
    });
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
    const req = createRequest('/onboarding/success');
    
    await middleware(req);
    
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
});