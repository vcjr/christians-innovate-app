# PWA Implementation Plan for Christians Innovate App

## Executive Summary

Implement Progressive Web App (PWA) capabilities to enable mobile app-like experience with offline support, home screen installation, and optional App Store distribution via PWA Builder. This approach requires minimal architectural changes compared to Capacitor and preserves the existing Next.js App Router with Server Components and Server Actions.

**Architectural Impact:** Minimal - no refactoring required
**Key Benefits:** Offline Bible reading, installable app, push notifications, App Store distribution option

---

## Current State Analysis

### Existing Assets
- ✅ Basic `public/site.webmanifest` exists but incomplete
- ✅ Mobile-responsive design throughout app
- ✅ Bible translations in JSON format (`translations/` folder)
- ✅ Supabase authentication and storage
- ✅ Server Components and Server Actions working

### Missing for PWA
- ❌ Service worker for offline caching
- ❌ Complete manifest with proper branding and icons
- ❌ PWA meta tags in layout
- ❌ Offline fallback page
- ❌ App icons in all required sizes
- ❌ Push notification implementation

---

## Phase 1: Core PWA Setup (Day 1-2)

### 1.1 Install PWA Dependencies

```bash
npm install @ducanh2912/next-pwa
npm install --save-dev @types/serviceworker
```

### 1.2 Update next.config.ts

Add PWA configuration wrapper:

```typescript
import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ttsvwbeuiqbidhcxufnx.supabase.co',
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
  skipWaiting: true,
  runtimeCaching: [
    // Cache Supabase Storage (avatars)
    {
      urlPattern: /^https:\/\/ttsvwbeuiqbidhcxufnx\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-storage',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    },
    // Cache Next.js static assets
    {
      urlPattern: /^https:\/\/.*\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    },
    // Network first for dashboard and dynamic content
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
})(nextConfig);
```

### 1.3 Enhance site.webmanifest

Replace `public/site.webmanifest` with complete configuration:

```json
{
  "name": "Christians Innovate",
  "short_name": "CI",
  "description": "Building for the next 5, 50, and 500 years. Daily Bible reading, community prayer, and member directory.",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Today's Reading",
      "short_name": "Reading",
      "description": "View today's Bible reading plan",
      "url": "/dashboard",
      "icons": [
        {
          "src": "/shortcuts/book-icon.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Launch & Prayer",
      "short_name": "Prayer",
      "description": "Share launches and prayer requests",
      "url": "/launch-prayer",
      "icons": [
        {
          "src": "/shortcuts/prayer-icon.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Directory",
      "short_name": "Directory",
      "description": "Browse member directory",
      "url": "/directory",
      "icons": [
        {
          "src": "/shortcuts/directory-icon.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ],
  "categories": ["social", "lifestyle", "education"],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/reading-plan.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### 1.4 Update app/layout.tsx

Add PWA meta tags in the `<head>`:

```typescript
export const metadata: Metadata = {
  title: "Christians Innovate",
  description: "Building for the next 5, 50, and 500 years",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Christians Innovate",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#2563eb",
};

// Add to <head> section if not already present:
// <meta name="mobile-web-app-capable" content="yes" />
// <meta name="apple-mobile-web-app-capable" content="yes" />
```

### 1.5 Generate App Icons

Create icons in all required sizes:

**Required Sizes:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

**Tools:**
- Use [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- Or [RealFaviconGenerator](https://realfavicongenerator.net/)
- Or manually with design tool

**Apple-specific:**
- Create `apple-touch-icon.png` (180x180)
- Add to `public/`

### 1.6 Create Offline Fallback Page

Create `app/offline/page.tsx`:

```typescript
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">You're Offline</h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        It looks like you've lost your internet connection. Some features may not be available.
      </p>
      <p className="text-sm text-gray-500">
        Your saved Bible readings and recent content are still accessible.
      </p>
    </div>
  );
}
```

---

## Phase 2: Bible Translation Offline Caching (Day 2-3)

### 2.1 Cache Bible Translations Strategy

The service worker will automatically cache the JSON files from `translations/` folder when they're first requested. However, we can proactively cache them.

### 2.2 Create Custom Service Worker

Create `public/sw.js` for custom caching logic:

```javascript
// This runs alongside the auto-generated service worker from next-pwa

const BIBLE_CACHE = 'bible-translations-v1';
const BIBLE_TRANSLATIONS = [
  '/translations/ESV.json',
  '/translations/NIV.json',
  '/translations/NLT.json',
  '/translations/KJV.json',
  '/translations/NKJV.json',
  '/translations/NASB.json',
  '/translations/MSG.json'
];

// Cache Bible translations on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(BIBLE_CACHE).then((cache) => {
      console.log('Caching Bible translations');
      return cache.addAll(BIBLE_TRANSLATIONS);
    })
  );
});

// Intercept Bible translation requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/translations/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          return caches.open(BIBLE_CACHE).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

### 2.3 Add Bible Cache Management

Create `utils/bible-cache.ts`:

```typescript
export async function cacheBibleTranslation(translation: string) {
  if ('caches' in window) {
    const cache = await caches.open('bible-translations-v1');
    await cache.add(`/translations/${translation}.json`);
  }
}

export async function getCachedTranslations(): Promise<string[]> {
  if (!('caches' in window)) return [];
  
  const cache = await caches.open('bible-translations-v1');
  const requests = await cache.keys();
  
  return requests
    .map(req => {
      const match = req.url.match(/\/translations\/(.+)\.json/);
      return match ? match[1] : null;
    })
    .filter(Boolean) as string[];
}

export async function clearBibleCache() {
  if ('caches' in window) {
    await caches.delete('bible-translations-v1');
  }
}
```

### 2.4 Add Cache Status to Settings

Update `app/settings/settings-form.tsx` to show cached translations and allow manual cache management.

---

## Phase 3: Enhanced PWA Features (Day 3-4)

### 3.1 Install Prompt

Create `components/install-prompt.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <p className="font-semibold mb-2">Install Christians Innovate</p>
      <p className="text-sm mb-3">Add to your home screen for quick access</p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="bg-white text-blue-600 px-4 py-2 rounded font-semibold"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="px-4 py-2 rounded border border-white"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
```

Add to `app/layout.tsx`:

```typescript
import InstallPrompt from '@/components/install-prompt';

// In the return statement
<body>
  {children}
  <InstallPrompt />
</body>
```

### 3.2 Camera Access Enhancement

Update file upload in `app/settings/settings-form.tsx` to use camera on mobile:

```typescript
<input
  type="file"
  accept="image/*"
  capture="environment" // Enables camera on mobile
  onChange={handleFileChange}
  className="..."
/>
```

For more advanced camera control, add getUserMedia API:

```typescript
const capturePhoto = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' } 
    });
    // Display video stream, capture frame, upload
  } catch (err) {
    console.error('Camera access denied', err);
  }
};
```

### 3.3 Background Sync (Optional)

For offline prayer post creation that syncs when online:

Create `utils/background-sync.ts`:

```typescript
export async function registerBackgroundSync(tag: string) {
  if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
  }
}

// In service worker (public/sw.js):
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-prayer-posts') {
    event.waitUntil(syncPrayerPosts());
  }
});

async function syncPrayerPosts() {
  // Get queued posts from IndexedDB
  // POST to server
  // Clear queue on success
}
```

---

## Phase 4: Push Notifications (Day 4-5)

### 4.1 Request Notification Permission

Create `utils/notifications.ts`:

```typescript
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function subscribeToPushNotifications() {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
  });

  // Send subscription to your backend
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });

  return subscription;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### 4.2 Handle Push Events in Service Worker

Add to `public/sw.js`:

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.body || 'New update from Christians Innovate',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id,
      url: data.url || '/dashboard'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Christians Innovate', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
```

### 4.3 Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Add to `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=mailto:your@email.com
```

### 4.4 Create Notification API Route

Create `app/api/notifications/subscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const subscription = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Store subscription in database
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      subscription: subscription,
      updated_at: new Date().toISOString()
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### 4.5 Create Migration for Push Subscriptions

Create `supabase/migrations/[timestamp]_push_subscriptions.sql`:

```sql
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 4.6 Add Notification Settings to UI

Update `app/settings/settings-form.tsx`:

```typescript
const [notificationsEnabled, setNotificationsEnabled] = useState(false);

const toggleNotifications = async () => {
  if (notificationsEnabled) {
    // Unsubscribe logic
  } else {
    await subscribeToPushNotifications();
    setNotificationsEnabled(true);
  }
};

// In the form:
<div className="flex items-center justify-between">
  <div>
    <label className="font-medium">Push Notifications</label>
    <p className="text-sm text-gray-600">Receive updates about prayer requests and new content</p>
  </div>
  <button
    type="button"
    onClick={toggleNotifications}
    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
      notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
    }`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
</div>
```

---

## Phase 5: Testing & Optimization (Day 5-6)

### 5.1 PWA Audit with Lighthouse

```bash
# Run Lighthouse in Chrome DevTools
# Or via CLI:
npm install -g lighthouse
lighthouse https://your-app.vercel.app --view
```

**Target Scores:**
- PWA Score: 90+
- Performance: 85+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### 5.2 Test Offline Functionality

**Manual Testing:**
1. Open app in Chrome
2. DevTools > Application > Service Workers > Check "Offline"
3. Navigate app - verify cached pages work
4. Try to view Bible verses from cached translations
5. Attempt to create prayer post (should queue if background sync enabled)

**Automated Testing:**
```bash
npm install -D @playwright/test
```

Create `tests/pwa.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('app works offline', async ({ page, context }) => {
  await page.goto('http://localhost:3000/dashboard');
  
  // Wait for service worker to activate
  await page.waitForTimeout(2000);
  
  // Go offline
  await context.setOffline(true);
  
  // Navigate to cached page
  await page.goto('http://localhost:3000/dashboard');
  
  // Verify content loads
  await expect(page.locator('h1')).toBeVisible();
});

test('install prompt appears', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Trigger beforeinstallprompt event
  await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeinstallprompt'));
  });
  
  await expect(page.locator('text=Install Christians Innovate')).toBeVisible();
});
```

### 5.3 Test on Multiple Devices

**iOS Testing:**
- iPhone with iOS 16.4+ (for push notifications)
- Safari browser
- Verify "Add to Home Screen" works
- Test offline functionality
- Test camera capture for profile photos

**Android Testing:**
- Chrome browser
- Verify install banner appears
- Test offline functionality
- Test push notifications
- Verify background sync

### 5.4 Performance Optimization

**Reduce Bundle Size:**
```bash
npm run build
# Analyze bundle
npm install @next/bundle-analyzer
```

Add to `next.config.ts`:
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(withPWA(nextConfig));
```

**Optimize Images:**
- Compress app icons with ImageOptim or TinyPNG
- Use WebP format where supported
- Lazy load images below the fold

**Code Splitting:**
- Already handled by Next.js App Router
- Verify dynamic imports for heavy components

---

## Phase 6: App Store Distribution (Optional, Day 6-7)

### 6.1 PWA Builder Setup

1. Deploy your PWA to production (Vercel)
2. Visit [PWABuilder.com](https://pwabuilder.com)
3. Enter your production URL
4. Review the report and fix any issues

### 6.2 Android (Google Play Store)

**Generate TWA Package:**
1. Click "Publish" in PWA Builder
2. Select "Android" platform
3. Configure:
   - Package ID: `com.christiansinnovate.app`
   - App name: `Christians Innovate`
   - Host URL: `https://your-domain.vercel.app`
   - Start URL: `/dashboard`
4. Download the generated Android package
5. Sign the APK with your keystore
6. Upload to Google Play Console

**Requirements:**
- Google Play Developer account ($25 one-time fee)
- App signing key
- Privacy policy URL
- Screenshots (phone and tablet)
- Feature graphic (1024x500)

### 6.3 iOS (Apple App Store)

**Generate iOS Package:**
1. Click "Publish" in PWA Builder
2. Select "iOS" platform
3. Download Xcode project
4. Open in Xcode
5. Configure:
   - Bundle ID
   - Team signing
   - Icons and splash screens
6. Archive and upload to App Store Connect

**Requirements:**
- Apple Developer account ($99/year)
- macOS with Xcode
- App privacy details
- Screenshots (required sizes)
- App Store description

**Notes:**
- More complex than Android
- Apple reviews can take 1-2 days
- May require additional native features to be compelling

### 6.4 Alternative: Distribute as PWA Only

**Advantages:**
- No app store fees
- Instant updates
- No review process
- Cross-platform from single URL

**User Installation:**
- Android: Chrome prompts to install
- iOS: Safari > Share > Add to Home Screen
- Desktop: Chrome address bar install icon

---

## Testing Checklist

### Pre-Launch Checklist

- [ ] Service worker registers and activates
- [ ] Manifest is valid (test with Chrome DevTools)
- [ ] All app icons present and correct sizes
- [ ] App installs to home screen (iOS and Android)
- [ ] Offline page displays when network is unavailable
- [ ] Bible translations cache on first load
- [ ] Cached content accessible offline
- [ ] Push notification permission request works
- [ ] Push notifications display correctly
- [ ] Notification click opens correct page
- [ ] Camera/file upload works on mobile
- [ ] App works in standalone mode (fullscreen)
- [ ] Status bar color matches theme
- [ ] Splash screen displays on launch
- [ ] App shortcuts work (if supported)
- [ ] Lighthouse PWA score is 90+
- [ ] No console errors in production build
- [ ] HTTPS enabled in production
- [ ] Service worker updates properly on new deployments

### Cross-Browser Testing

- [ ] Chrome desktop
- [ ] Chrome Android
- [ ] Safari iOS 16.4+
- [ ] Safari desktop
- [ ] Firefox desktop
- [ ] Edge desktop

---

## Deployment Considerations

### Environment Variables

Ensure these are set in production (Vercel):
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:admin@christiansinnovate.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Build Configuration

Update `package.json` scripts if needed:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "analyze": "ANALYZE=true npm run build",
    "pwa:cache-clear": "rm -rf .next/cache && rm -rf public/sw.js public/workbox-*.js"
  }
}
```

### Versioning Strategy

Update service worker cache version on major changes:
```typescript
// In next-pwa config
workboxOptions: {
  swDest: 'public/sw.js',
  runtimeCaching: [...],
  buildId: process.env.BUILD_ID || Date.now().toString()
}
```

---

## Monitoring & Analytics

### Service Worker Updates

Add update notification:

```typescript
// components/sw-update-prompt.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <p className="font-semibold mb-2">Update Available</p>
      <p className="text-sm mb-3">A new version is ready</p>
      <button
        onClick={handleUpdate}
        className="bg-white text-blue-600 px-4 py-2 rounded font-semibold w-full"
      >
        Update Now
      </button>
    </div>
  );
}
```

### Analytics

Track PWA-specific events:

```typescript
// utils/pwa-analytics.ts
export function trackPWAEvent(event: string, data?: any) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', event, {
      event_category: 'PWA',
      ...data
    });
  }
}

// Usage:
trackPWAEvent('pwa_installed');
trackPWAEvent('notification_permission', { granted: true });
trackPWAEvent('offline_access');
```

---

## Maintenance & Updates

### Regular Tasks

**Weekly:**
- Monitor service worker errors in Sentry/analytics
- Check push notification delivery rates
- Review offline cache hit rates

**Monthly:**
- Update dependencies (`@ducanh2912/next-pwa`, etc.)
- Review Lighthouse scores
- Clear old cache versions

**Quarterly:**
- Test on latest iOS/Android versions
- Update manifest/icons if branding changes
- Review and optimize cached assets

### Cache Invalidation

When Bible translations update:

```typescript
// utils/cache-invalidation.ts
export async function invalidateBibleCache() {
  if ('caches' in window) {
    await caches.delete('bible-translations-v1');
    // Optionally create v2
    await caches.open('bible-translations-v2');
  }
}
```

---

## Future Enhancements

### Phase 7+ (Post-Launch)

1. **Advanced Offline Sync**
   - Queue prayer posts offline
   - Sync when connection restored
   - Conflict resolution for simultaneous edits

2. **Native Share API**
   ```typescript
   if (navigator.share) {
     await navigator.share({
       title: 'Today\'s Reading',
       text: verseText,
       url: window.location.href
     });
   }
   ```

3. **File System Access API**
   - Download Bible verses for offline reading
   - Export notes/highlights

4. **Badge API**
   - Show unread prayer requests count on app icon
   ```typescript
   if ('setAppBadge' in navigator) {
     navigator.setAppBadge(unreadCount);
   }
   ```

5. **Web Bluetooth** (future consideration)
   - Connect to Bible study devices
   - Sync with smart Christian devices

6. **Periodic Background Sync**
   - Update Bible content daily
   - Fetch new prayer requests
   - Requires user opt-in

---

## Success Metrics

### KPIs to Track

1. **Installation Rate**
   - Target: 30%+ of active users install PWA
   - Track: `beforeinstallprompt` events vs installs

2. **Offline Usage**
   - Target: 20%+ of sessions include offline access
   - Track: Service worker cache hits

3. **Push Notification Engagement**
   - Target: 60%+ opt-in rate
   - Target: 40%+ click-through rate
   - Track: Notification permissions and clicks

4. **Performance**
   - Target: Lighthouse PWA score 95+
   - Target: First Contentful Paint < 1.5s
   - Target: Time to Interactive < 3s

5. **Retention**
   - Target: 15% increase in 7-day retention for PWA users
   - Compare PWA users vs web-only users

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue: Service worker caching stale content**
- Solution: Implement cache versioning and update prompts
- Mitigation: Network-first strategy for critical data

**Issue: iOS push notifications not working**
- Solution: Verify iOS 16.4+ and app is installed
- Mitigation: Fallback to in-app notifications

**Issue: Large Bible files slow initial cache**
- Solution: Cache on-demand instead of pre-cache
- Mitigation: Progressive caching with user feedback

**Issue: Quota exceeded on storage**
- Solution: Implement cache cleanup for old translations
- Mitigation: Request persistent storage permission

**Issue: Service worker conflicts between environments**
- Solution: Disable PWA in development mode
- Mitigation: Clear cache between deployments

---

## Resources & Documentation

### Official Docs
- [Next.js PWA Plugin](https://github.com/DuCanhGH/next-pwa)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### Tools
- [PWA Builder](https://pwabuilder.com)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)

### Community
- [PWA Slack Community](https://bit.ly/join-pwa-slack)
- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com)

---

## Decision Log

### Key Decisions Made

1. **PWA over Capacitor** - Chosen for minimal refactoring, preserves Server Components/Actions
2. **next-pwa Package** - Using `@ducanh2912/next-pwa` for best Next.js 15+ support
3. **Bible Caching Strategy** - Pre-cache all translations for optimal offline experience
4. **Push Notifications** - Implementing despite iOS limitations (16.4+ requirement acceptable)
5. **App Store Distribution** - Optional Phase 6, not required for MVP

### Questions for Product Team

- [ ] Do we want App Store distribution or PWA-only?
- [ ] Which notification events should trigger push? (new prayer requests, daily reading reminders, etc.)
- [ ] Should we pre-cache all Bible translations or just user's preferred?
- [ ] What's the target iOS version support? (16.4+ required for push)
- [ ] Do we need offline write capabilities (queue posts) or read-only offline?

---

## Conclusion

This PWA implementation provides a mobile app-like experience with minimal architectural changes to your existing Next.js application. The phased approach allows for incremental delivery and testing, with the core PWA functionality achievable in 5-7 days.

**Next Steps:**
1. Review and approve this plan
2. Set up development branch for PWA implementation
3. Begin Phase 1 (Core PWA Setup)
4. Test incrementally after each phase
5. Deploy to staging environment for QA
6. Launch PWA to production
7. Optionally pursue App Store distribution in Phase 6
