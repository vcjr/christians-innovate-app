import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

// Get Supabase URL from environment variable with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ttsvwbeuiqbidhcxufnx.supabase.co'
const supabaseHostname = new URL(supabaseUrl).hostname

const nextConfig: NextConfig = {
  // WORKAROUND: Empty turbopack config to silence webpack/turbopack warning.
  // The PWA plugin currently uses webpack; this enables it to work with Next.js 16.
  // TODO: Revisit this once the PWA plugin has native Turbopack support, as this is technical debt.
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // Cache Supabase Storage (avatars)
      {
        urlPattern: new RegExp(`^https://${supabaseHostname.replace(/\./g, '\\.')}/storage/v1/object/public/.*`, 'i'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'supabase-storage',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          }
        }
      },
      // Cache Bible translation JSON files
      {
        urlPattern: /^https?:\/\/.*\/translations\/.*\.json$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'bible-translations-v1',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
          }
        }
      },
      // Cache Next.js static assets
      {
        urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
          }
        }
      },
      // Cache HTML pages for offline navigation
      {
        urlPattern: ({ url, request }) =>
          request.destination === 'document' &&
          (url.pathname === '/dashboard' ||
            url.pathname.startsWith('/dashboard/day/') ||
            url.pathname === '/directory' ||
            url.pathname === '/launch-prayer' ||
            url.pathname === '/settings'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'pages-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
          }
        }
      },
      // Network first for other dashboard routes
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/dashboard'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'dashboard-cache',
          networkTimeoutSeconds: 10,
        }
      },
      // API routes - network first with fallback
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 5,
        }
      }
    ]
  }
})(nextConfig);
