import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavigationBar } from './navigation'
import { BottomNav } from './bottom-nav'
import { createClient } from '@/utils/supabase/server'
import { AnnouncementBar } from './announcement-bar'
import InstallPrompt from '@/components/install-prompt'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is admin and fetch profile
  let isAdmin = false
  let userProfile = null
  if (user) {
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    isAdmin = userRole?.is_admin === true

    // Fetch user profile for avatar
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single()

    userProfile = profile
  }

  // Fetch active meeting for announcement bar
  let activeMeeting = null
  if (user) {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('meetings')
      .select('*')
      .eq('is_active', true)
      .gte('meeting_date', startOfToday.toISOString())
      .order('meeting_date', { ascending: true })
      .limit(1)
      .single()

    activeMeeting = data
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavigationBar />
        {activeMeeting && user && (
          <AnnouncementBar meeting={activeMeeting} userId={user.id} />
        )}
        <div className="pb-16 md:pb-0">
          {children}
        </div>
        {user && (
          <BottomNav
            isAdmin={isAdmin}
            avatarUrl={userProfile?.avatar_url || null}
            userId={user.id}
          />
        )}
        <InstallPrompt />
      </body>
    </html>
  );
}
