# Christians Innovate — App Context Prompt for Jira Ticket Drafting

Use this prompt as a preamble when asking an AI to help draft Jira tickets for the Christians Innovate app. It provides full context on the product, tech stack, architecture, features, data model, and design conventions so that generated tickets are accurate, scoped, and design-aware.

---

## Product Overview

**Christians Innovate** is a private, members-only community web application for a Christian professional/entrepreneurial group. Its tagline is *"Building for the next 5, 50, and 500 years."* The app serves as the digital hub for the community — combining Bible reading plans, meeting coordination, a social feed for sharing launches/prayer requests/wins, and a member directory. All content is behind authentication; unauthenticated visitors are redirected to the login page.

---

## Tech Stack & Architecture

| Layer           | Technology                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Framework       | **Next.js 16** (App Router, React 19, Server Components + Server Actions)                       |
| Language        | **TypeScript**                                                                                  |
| Styling         | **Tailwind CSS v4** (utility-first, no component library)                                       |
| Icons           | **Lucide React**                                                                                |
| Database & Auth | **Supabase** (PostgreSQL, Row-Level Security, Supabase Auth with email/password)                |
| Storage         | **Supabase Storage** (avatars bucket for profile pictures)                                      |
| Bible Data      | Local JSON translation files (KJV, NKJV, ESV, NIV, NLT, NASB, MSG) loaded from `/translations/` |
| Markdown        | **react-markdown** for rendering devotional content                                             |
| Hosting         | (Vercel-compatible Next.js deployment)                                                          |

**Key architectural patterns:**
- Server Components by default; Client Components (`'use client'`) only where interactivity is needed (forms, toggles, real-time subscriptions).
- Server Actions (in `actions.ts` files) for all data mutations (no API routes).
- Supabase SSR helper (`@supabase/ssr`) with separate client/server utilities in `/utils/supabase/`.
- Role-based access: admin status is stored in a `user_roles` table and checked server-side in layouts/pages.
- Real-time updates via Supabase Realtime channels (used in the comment section).

---

## Database Schema (Core Tables)

| Table                 | Purpose                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_profiles`       | Name, avatar, bio, skills, interests, social links, partner-seeking flags, onboarding preferences (ci_updates, bible_year, skill_share, referral) |
| `user_roles`          | `is_admin` boolean per user                                                                                                                       |
| `reading_plans`       | Admin-created reading plans (title, description)                                                                                                  |
| `plan_days`           | Individual days within a plan (day_number, scripture_reference, content_markdown, date_assigned)                                                  |
| `plan_subscriptions`  | Links users to reading plans they've subscribed to                                                                                                |
| `user_progress`       | Tracks which days a user has marked as completed                                                                                                  |
| `day_comments`        | Threaded comments on individual reading plan days                                                                                                 |
| `meetings`            | Admin-created meetings with Zoom links, dates, and an `is_active` flag                                                                            |
| `meeting_attendance`  | Tracks which users clicked "Join Zoom" (attendance tracking)                                                                                      |
| `meeting_attendees`   | Meeting registration                                                                                                                              |
| `launch_prayer_posts` | Community posts of type `launch`, `prayer`, or `win` with active/hidden moderation flags                                                          |
| `post_reactions`      | Emoji reactions on posts (unique per user+post+emoji)                                                                                             |
| `post_comments`       | Comments on launch/prayer posts                                                                                                                   |
| `bible_verses`        | Cached bible verse data by translation/book/chapter                                                                                               |
| `resources`           | Community-shared resources with title, description (markdown), file_url or external_url, category, and is_active/is_hidden flags                  |

**Storage Buckets:**
- `avatars` - User profile pictures
- `resources` - Uploaded resource files (PDFs, documents, images, etc.)

---

## Features (Current State)

### 1. Authentication & Onboarding
- **Login** page with email/password via Supabase Auth.
- **Signup** page that collects name, email, password (with client-side password strength validation: 8+ chars, upper/lower/number/special). Signup also collects onboarding preferences: CI Updates, Bible in a Year interest, Skill Share interest, and a referral source.
- Unauthenticated users are redirected to `/login`; authenticated users land on `/dashboard`.

### 2. Dashboard (`/dashboard`)
- Shows **available reading plans** if the user has not subscribed to any, with a subscribe button per plan.
- If subscribed, shows the **active reading plan** with an "Up Next" card highlighting the first unread day, followed by all days with completion status.
- Each **Day Card** shows the day number, scripture reference, a truncated Bible verse preview, and a "Mark as Read" / "Completed" toggle button.
- Days are **sortable** (newest, oldest, day ascending, day descending).
- A **Launch & Prayer Preview** widget shows counts of community launches, prayer requests, and wins, linking to the full page.

### 3. Day Detail View (`/dashboard/day/[dayId]`)
- Full scripture display with **multi-translation Bible reader** (KJV, NKJV, ESV, NIV, NLT, NASB, MSG) — translations loaded from local JSON files.
- Two **view modes**: verse-by-verse and paragraph view, togglable by the user.
- User's **preferred translation** is persisted across sessions via `user_preferences` table.
- **Devotional content** rendered from Markdown (admin-authored `content_markdown` field).
- **Mark Complete** button to toggle day completion.
- **Comment/Discussion section** with real-time updates via Supabase Realtime. Users can post and delete their own comments. Comments show user avatars and names.

### 4. Launch & Prayer (`/launch-prayer`)
- A community social feed where members post three types: **Launch Alerts** (new projects/ventures), **Prayer Requests**, and **Wins/Praise Reports**.
- Stats bar showing counts of each post type.
- **Create Post Form** for composing new posts with type selection, title, and content.
- **Post List** displaying all posts with author avatar, name, date, type badge, and content.
- Post owners can **toggle active/inactive** or **delete** their own posts.
- Admins can **hide** or **delete** any post (moderation).
- Posts have `is_active` and `is_hidden` flags; hidden/inactive posts show visual indicators.

### 5. Resource Hub (`/resources`)
- A centralized hub for sharing valuable tools, documents, and links with the community.
- Stats bar showing total resources, file uploads, and external links counts.
- **Resource Upload Form**: Allows users to share either a file upload (PDF, DOC, XLS, images, etc. up to 50MB) or an external URL link.
- **Category selection**: Tools, Documents, Templates, Guides, Books, Videos, Podcasts, Other.
- **Resource description** supports Markdown formatting rendered with react-markdown.
- **Resource Cards** display: title, category badge, description preview (line-clamped), author avatar/name, date, and Download/View button.
- **Client-side filtering**: Search by title/description/author, filter by category, sort by newest/oldest/title.
- Resource owners can **toggle active/inactive** or **delete** their own resources.
- Admins can **hide** or **delete** any resource (moderation).
- Resources have `is_active` and `is_hidden` flags; hidden/inactive resources show visual indicators.
- **Empty state** with call-to-action to upload the first resource.
- Files are stored in Supabase Storage `resources` bucket with unique paths (`user_id/timestamp_filename`).

### 6. Member Directory (`/directory`)
- Grid layout of all member profile cards.
- Each card shows: avatar (or initials fallback), full name, bio, skills (as tags), interests (as tags), social links (LinkedIn, Facebook, Twitter, Website), and badges for "Looking for Business Partner" / "Looking for Accountability Partner."
- Expandable skill/interest tag lists (show more/less toggle).
- Stats header: total members, members seeking business partners, members seeking accountability partners.

### 7. Settings (`/settings`)
- **Profile picture** upload (Supabase Storage with upsert).
- Edit **name**, **bio**, **skills** (tag-based input), **interests** (tag-based input).
- Toggle **Looking for Business Partner** and **Looking for Accountability Partner** flags.
- **Social links**: LinkedIn, Facebook, Twitter, Website URLs.
- Onboarding preferences: CI Updates, Bible in a Year, Skill Share toggles.

### 8. Admin Panel (`/admin/...`)
Protected by server-side admin role check. Features a blue admin sub-navigation bar with three sections:

- **Reading Plans** (`/admin/plans`): Create new reading plans (title, description). List all plans with click-through to detail.
  - **Plan Detail** (`/admin/plans/[id]`): Add days to a plan (day number, scripture reference, markdown content, date assigned). Edit and delete days via modal. Day list with edit/delete controls.
- **Meetings** (`/admin/meetings`): Create meetings (title, description, Zoom link, date, active toggle). List all meetings with attendance counts and an attendees modal showing who joined.
- **Members** (`/admin/members`): View all members with their profiles and roles. Manage user accounts.

### 9. Announcement Bar
- When an admin sets a meeting as `is_active` and its date is in the future, a **blue announcement bar** appears site-wide below the navigation for all authenticated users.
- Shows meeting title, formatted date/time, description, and a "Join Zoom Meeting" button.
- Clicking "Join Zoom" opens the link and **tracks attendance** server-side.
- Dismissible via an X button.

### 10. Navigation
- **Desktop**: Sticky top nav with logo, links (Dashboard, Launch & Prayer, Directory, Resources), admin link (if admin), user profile dropdown with avatar, and sign-out button.
- **Mobile**: Hamburger menu with the same links.
- User profile dropdown shows avatar (or initials), and the user's name.

---

## Design Conventions

- **Color palette**: White/gray backgrounds (`bg-gray-50`, `bg-white`), blue primary accents (`blue-600`), green for success/completed states, red for destructive actions, yellow for wins.
- **Cards**: White background, `border border-gray-200`, `rounded-lg`, `shadow-sm`, `hover:shadow-md transition`.
- **Buttons**: Rounded (`rounded-lg` or `rounded-full` for pill badges), font-medium, clear hover states.
- **Typography**: Geist Sans + Geist Mono fonts. Headings use `font-bold text-gray-900`. Body uses `text-gray-600`.
- **Responsive**: Mobile-first. Layouts use `max-w-4xl` or `max-w-7xl` containers. Grid shifts from 1-col to 2/3-col on md/lg breakpoints. Text sizes scale with `sm:` prefixes.
- **Status badges**: Pill-shaped (`rounded-full`, colored backgrounds like `bg-green-100 text-green-800`).
- **Forms**: Standard inputs with `border rounded`, focus rings (`focus:ring-2 focus:ring-blue-500`), clear labels.
- **Empty states**: Centered text with icon, inside a card container.
- **Loading states**: `Loader2` spinner icon with `animate-spin` from Lucide.

---

## How to Use This Prompt

Paste this entire document at the beginning of a conversation, then ask things like:

- *"Draft a Jira story for adding email notifications when a new reading plan day is published."*
- *"Create a bug ticket for [describe bug]. Include acceptance criteria."*
- *"Write a feature epic for adding a direct messaging system between members."*
- *"Break down the work needed to add search/filter to the Member Directory."*

The AI will have full context on the existing tech stack, database schema, UI patterns, and feature set to produce accurate, well-scoped tickets with appropriate technical details and acceptance criteria.
