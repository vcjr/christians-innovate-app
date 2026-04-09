import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from 'next/headers'
import { NavigationBar } from './navigation'
import { createClient } from '@/utils/supabase/server'
import { AnnouncementBar } from './announcement-bar'
import { NoticeHandler } from '@/components/ui/NoticeHandler'
import { FeedbackButton } from '@/components/feedback-button'

const CHROME_HIDDEN_ROUTES = ['/reset-password', '/onboarding']

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
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' }
    ]
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const hideChrome = CHROME_HIDDEN_ROUTES.some(route => pathname.startsWith(route))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch active meeting for announcement bar
  let activeMeeting = null
  if (user && !hideChrome) {
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
        <NoticeHandler />
        <NavigationBar />
        {activeMeeting && user && !hideChrome && (
          <AnnouncementBar meeting={activeMeeting} userId={user.id} />
        )}
        {children}
        {user && !hideChrome && <FeedbackButton userId={user.id} />}
      </body>
    </html>
  );
}
