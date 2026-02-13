import { middleware } from './middleware'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

jest.mock('@supabase/ssr')

// Mock next/server manually to avoid "Request is not defined" errors
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string
      nextUrl: { pathname: string }
      cookies: { get: jest.Mock; set: jest.Mock }
      constructor(url: string | URL) {
        this.url = url.toString()
        this.nextUrl = { pathname: new URL(this.url).pathname }
        this.cookies = { get: jest.fn(), set: jest.fn() }
      }
    },
    NextResponse: {
      next: jest.fn().mockReturnValue({ 
        cookies: { set: jest.fn() },
        headers: new Map() 
      }),
      redirect: jest.fn().mockImplementation((url) => ({ 
        url: url.toString(), 
        status: 307 
      })),
    },
  }
})

describe('Middleware Authentication Logic', () => {
  const mockGetUser = jest.fn()
  
  // Mock environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerClient as jest.Mock).mockReturnValue({
      auth: { getUser: mockGetUser }
    });
  })

  it('redirects unauthenticated users trying to access /onboarding', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest(new URL('http://localhost:3000/onboarding'))

    await middleware(req)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' })
    )
  })

  it('allows authenticated users to access /onboarding', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    const req = new NextRequest(new URL('http://localhost:3000/onboarding'))

    await middleware(req)

    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('allows unauthenticated users to access non-protected routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest(new URL('http://localhost:3000/login'))

    await middleware(req)

    expect(NextResponse.next).toHaveBeenCalled()
  })
})
