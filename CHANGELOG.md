# Changelog

All notable changes to **Christians Innovate App** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Convention going forward:** Use [Conventional Commits](https://www.conventionalcommits.org/) in all commit messages.
> Run `npm run release` (powered by `release-it`) to auto-generate new changelog entries, bump the version, and create a GitHub release.

---

## [Unreleased]

### Victor Crispin — [@vcjr](https://github.com/vcjr)

**Multi-Group Accountability Membership** — CI-6

Users can now belong to multiple accountability groups simultaneously. The single `accountability_group_id` foreign key on `user_profiles` has been replaced with a `user_group_memberships` junction table, unlocking true many-to-many group membership.

- Migration `20260326000000`: creates `user_group_memberships`, migrates existing data, drops old column, adds `NOT NULL` on `group_commitments.status`, hardens `SECURITY DEFINER` functions with `SET search_path`, splits overly-broad `FOR ALL` RLS policies into granular SELECT/INSERT/UPDATE/DELETE, fixes `accept_group_invitation` with row-count verification
- All server actions, RLS policies, dashboard queries, and directory queries updated to use the junction table
- Group switcher always visible on `/accountability` — one tab per group, `+ New Group`, and `Discover Groups` links

**Group Discovery & Join Requests** — CI-6

New `/accountability/discover` page lets any authenticated member browse all groups, see member counts and avatar previews, and request to join. Group creators review and act on pending requests inline above their hub.

- Migration `20260327000000`: `group_join_requests` table with RLS + `approve_join_request()` SECURITY DEFINER function (needed because normal RLS restricts `user_group_memberships` inserts to self)
- Migration `20260327000001`: opens `user_group_memberships` SELECT to all authenticated users so the discover page can display member counts for groups the viewer hasn't joined
- New server actions: `requestToJoinGroup`, `approveJoinRequest`, `rejectJoinRequest`, `cancelJoinRequest`
- New components: `JoinRequestButton` (3 states: request / pending+cancel / request again) and `PendingJoinRequests` (creator approve/decline panel)
- Discover Groups card added to the onboarding empty state

**Comprehensive Notification System with Realtime** — CI-6

The notification bell now updates live without a page reload, and every meaningful accountability event triggers a notification.

- Migration `20260327000002`: adds `notifications` table to the Supabase Realtime publication
- `NotificationBell` subscribes to `INSERT` events filtered to the current user via Supabase channel — badge increments instantly when a new notification arrives
- New notification types added across all accountability actions:

| Type | Trigger | Recipient |
|---|---|---|
| `invitation_accepted` | Invitee accepts | Inviter |
| `invitation_declined` | Invitee declines | Inviter |
| `join_request` | User requests to join | Group creator |
| `join_request_approved` | Creator approves | Requester |
| `join_request_rejected` | Creator rejects | Requester |
| `member_removed` | Creator removes member | Removed member |
| `member_left` | Member leaves | Group creator |
| `ownership_transferred` | Ownership transferred | New owner |
| `rhythm_updated` | Meeting schedule changed | All other members |

**Bi-Weekly Rhythm: Two Days with Independent Times** — CI-6

When bi-weekly frequency is selected, a second day picker and its own time input appear. Both calendar exports are updated to reflect per-day schedules.

- Second day selector (filtered to exclude day 1); time picker disabled until a day is chosen
- Google Calendar: opens two separate recurring-event tabs, one per day
- ICS export: single `.ics` file with two `VEVENT` blocks so both events import together
- Dashboard widget shows `Mondays @ 9:00 AM · Thursdays @ 6:00 PM` format
- `rhythm_updated` notification includes both days in the message

**Admin Dashboard Restored** — CI-6

The analytics dashboard (`/admin/dashboard`) was missing from the working branch after a prior "archive" commit. Restored `actions.ts`, `page.tsx`, `stats-cards.tsx`, and the Dashboard nav link in the admin layout.

**Navigation Refactor** — CI-6

Moved Admin link and Sign Out out of the main nav bar and into `UserProfileDropdown` to free nav real estate as features grow. Sign Out now shows a loading state while `clearLocalSessionData` runs before session invalidation.

**Bug Fixes** — CI-6

- Removed stale `user_profiles.accountability_group_id` references from `/dashboard` and `/accountability/create` after the column was dropped
- Fixed group picker modal expanding the page width by rendering it outside the main container via a React fragment
- Normalized `/accountability` page padding to match the nav's `max-w-7xl px-4 sm:px-6 lg:px-8` width
- Updated create-group guidelines to reflect that multiple groups are now permitted

---

**Transactional Email System** — CI-30

A full email infrastructure built on Resend, with a visual block-based template editor, scheduled delivery, and admin controls.

- Migrations: `email_templates`, `email_logs`, `sender_addresses`, `scheduled_email_jobs` tables with RLS
- `utils/email/blocks.ts` — block system with `composeEmail` / `decomposeEmail` / `renderBlock`; supports badge, hero, primary-cta, feature-grid, detail-card, two-column, stats-row, scripture, and divider blocks
- `utils/email/scheduled-jobs.ts` — `sendEmail`, `sendBatchEmails`, `renderEmailTemplate`, job scheduler and processor
- Admin email template editor at `/admin/email/templates` with live block picker, visual preview, subject/variable management, and save/publish flow
- Seeded block-system versions of all four default templates: `daily-reminder`, `welcome`, `meeting-reminder`, `weekly-digest`

**Admin Email Broadcast** — CI-30

Admins can send a one-off email to any member segment directly from the admin panel.

- `/admin/email/broadcast` page with recipient filter (all members, email-enabled, CI updates, Bible Year, skill share)
- Live recipient count updates as filter changes
- Template picker — choose a saved template or compose custom HTML via the block editor
- **Test Send** — send to a single address before broadcasting to the full list; uses the admin's own profile as sample data for variable substitution; amber-styled panel with loading state and success/error feedback
- `sendBroadcast` and `sendTestEmail` server actions; `getRecipientCount` for live count

**Email Inbox (Inbound Webhooks)** — CI-30

Inbound emails to the platform are received via Resend webhook and stored for admin review.

- `/api/webhooks/resend-inbound` — verifies `RESEND_WEBHOOK_SECRET` HMAC signature before processing
- Parsed inbound messages stored in `email_logs` with `direction = 'inbound'`

**External Contacts** — CI-30

- `external_contacts` table and migration — allows admins to store non-member email addresses for broadcast targeting

**Fix: Admin Dashboard "Current: Day" Calculation** — CI-30

The View Progress modal on the admin dashboard showed "Current: Day 1" for all subscribers regardless of actual progress. Fixed by calculating the current day as `max(completed day numbers) + 1` rather than finding the first sequential incomplete day, which always returned Day 1 for members who joined mid-year.

**Fix: Welcome Email Feature Grid Emoji Rendering** — CI-30

Feature-grid block emojis in the welcome email were rendering as a separate block-level `<p style="font-size: 22px">` element above the title instead of inline. Updated the stored template HTML and migration to place the emoji inline with the title text, matching what `renderFeatureGrid` generates.

**Fix: Vercel Cron Job (Hobby Plan)** — CI-30

Vercel Hobby plan only allows once-daily cron jobs. Changed the scheduler cron from `*/5 * * * *` to `0 8 * * *` (daily at 8 AM UTC) to unblock deployments without requiring a plan upgrade.

---

### Summary

| Category | Details |
|---|---|
| **New features** | Multi-group membership, group discovery, join request flow, realtime notifications, bi-weekly dual-day rhythm, transactional email system, broadcast with test send, inbound email inbox, external contacts |
| **Bug fixes** | Stale column references, modal layout overflow, page width misalignment, admin "Current: Day 1" calculation, welcome email emoji rendering |
| **Security** | Junction-table RLS hardening, `SECURITY DEFINER` `SET search_path`, narrowed invitation UPDATE policy, Resend webhook HMAC verification |
| **Navigation** | Admin + Sign Out moved to profile dropdown |
| **DevOps** | Vercel cron schedule fixed for Hobby plan |
| **Migrations** | 16 new migration files |
| **Files changed** | 40+ files |

---

## [0.4.0] - 2026-03-17

### Volunteer Contributions

> Every feature and fix in this release was made possible by our amazing volunteers.
> Thank you for your time, talent, and dedication to the community!

---

#### Elie Paul — [@EliePaulDev](https://github.com/EliePaulDev)

**Multi-Step Onboarding Flow** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

A complete, multi-step onboarding experience for new users. Takes members through profile setup covering bio, photo upload, skills, interests, community preferences, and social links — with form state persisted to localStorage and IndexedDB so no data is lost on refresh.

- New pages: `app/onboarding/page.tsx`, `app/onboarding/success/page.tsx`, `app/onboarding/WelcomeStep.tsx`
- Centralized step config via `app/onboarding/onboarding.ts` (ONBOARDING_STEPS)
- `useOnboarding` controller hook: step validation, parallel file uploads, atomic submission, session refresh, LocalStorage & cookie cleanup
- `useStepper` hook: URL-synchronized step navigation with anti-skip guardrails and A11y focus management
- Onboarding completion flag (`has_completed_onboarding`) written to both `user_profiles` and Supabase Auth metadata
- New server action: `lib/actions/onboarding.ts` (`completeOnboardingAction`) with atomic DB upsert + auth metadata sync
- DB migration to add `has_completed_onboarding` column to user profiles table

**Auth & Middleware** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

End-to-end auth flow updates ensuring users complete onboarding before accessing the app.

- Auth middleware guardrail: redirects unauthenticated users to login and incomplete-onboarding users to `/onboarding`
- Login action updated to read `has_completed_onboarding` from auth metadata and redirect accordingly
- Signup action updated: initializes `has_completed_onboarding: false` in metadata, redirects confirmed users to `/onboarding`
- `clearLocalSessionData` cleanup utility for secure sign-out and state purging

**Secure Sign-Out (`SignOutButton`)** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

Replaced the bare sign-out form in the navigation bar with a dedicated `SignOutButton` component that clears localStorage and IndexedDB before triggering the server-side session invalidation, preventing stale data leakage.

- New component: `components/auth/SignOutButton.tsx` with pending/loading state
- Fully tested: verifies cleanup order and disabled state during sign-out

**Flash Notice System (`NoticeHandler`)** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

A cookie-driven flash notification system that displays contextual toast messages (success, info, warning, error) set by middleware or server actions. Messages are driven by a secure registry (`NOTICE_REGISTRY`) to prevent injection.

- `NoticeHandler` injected into root layout for app-wide coverage
- Auto-dismisses via CSS `shrink` animation; hover pauses the timer; accessible close button
- Role-appropriate ARIA: `role="status"` for success/info, `role="alert"` for warning/error
- Fully tested: cookie flash-and-purge logic, hover pause/resume, dismiss behavior, security registry guard

**Reusable Component Library** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

Seven new accessible, tested UI components extracted from the onboarding flow and available app-wide.

- `Card` — composable card with optional title/footer slots
- `CheckboxGroup` — accessible checkbox group using `fieldset`/`legend` with `aria-describedby` wiring
- `DynamicInput` — polymorphic input (text, email, password, number, textarea, select) with ref forwarding and `aria-invalid`
- `FieldLayout` — shared label/error/ARIA layout primitive used by all input components
- `PhotoInput` — file input with Blob URL preview, IndexedDB persistence, and memory-safe cleanup
- `ProgressBar` — accessible progress bar with value clamping and smooth CSS transitions
- `TagInput` — combobox tag selector with case-insensitive deduplication, initialTags casing priority, custom tag entry (Title Case), max-tag enforcement, and keyboard accessibility

**Shared Hooks** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

Four reusable hooks extracted for use beyond onboarding.

- `useFilePreview` — manages Blob URL lifecycle (creation, replacement, and cleanup on unmount)
- `useFormPersistence` — hybrid serializable-to-localStorage / binary-to-IndexedDB form persistence with rehydration and clear
- `useProfile` — shared profile state manager with optimistic local updates and server action integration
- `useStepper` — generic multi-step navigation hook (URL sync, guardrails, progress, A11y)

**Test Infrastructure & Coverage** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

Full Jest testing setup wired to the project for the first time, with comprehensive test coverage across the new work.

- `jest.config.ts` and `jest.setup.ts` bootstrapped with `next/jest`, jsdom, `@testing-library/jest-dom`, and path alias support
- Tests for all seven components (Card, CheckboxGroup, DynamicInput, FieldLayout, PhotoInput, ProgressBar, TagInput)
- Tests for all four hooks (useFilePreview, useFormPersistence, useProfile, useStepper)
- Tests for `useOnboarding`, `OnboardingPage`, `SuccessPage`, and `signup` server action
- Tests for `completeOnboardingAction` verifying atomic DB + auth metadata sync

**Utility & Type Additions** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

- `UserProfile` type (`types/profile.ts`) — shared exportable profile type
- `NOTICE_REGISTRY` type (`types/notices.ts`) — registry for flash notice slugs
- `isFile` type guard (`utils/type-guards.ts`) — runtime File instance check
- `validation.ts` utility functions
- `filePersistence` utility — IndexedDB-backed file storage for form persistence

---

#### Caleb Matteis — [@bluecollarcoders](https://github.com/bluecollarcoders)

**Auto-Subscription Feature** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19) · CI-1

Admins can now designate a default reading plan directly from the plan list. New users who opt into Bible Year during signup are automatically subscribed to the default plan.

- New `setDefaultPlan` server action using a `set_default_plan_atomic` RPC to prevent race conditions
- Star button (`⭐`) inline in `plan-list.tsx` with loading state, visual distinction, and accessible `title` attributes
- `is_default` field surfaced in the plan list type
- Fixed `health_timeout` causing CI/CD pipeline errors in Supabase config

---

#### Victor Crispin — [@vcjr](https://github.com/vcjr)

**Dashboard: Auto-Subscription Edge Case** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

A graceful warning is shown when `bible_year` is enabled in the user profile but no plan subscription was created (e.g., trigger failure), guiding the user to pick a plan manually.

**Fix: Unsafe URL Injection** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

Sanitized URL handling in PhotoInput to prevent `javascript:` or `data:` scheme injection via Blob URL validation.

**Fix: Onboarding New-User Trigger** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

Silenced PGRST116 errors for new users who haven't completed onboarding yet, preventing false error states on first login.

**README & Release Tooling** — [PR #19](https://github.com/vcjr/christians-innovate-app/pull/19)

- README expanded with prerequisites, local Supabase setup (Option A/B), project structure, available scripts, database management commands, and a troubleshooting section
- `release-it` config simplified: removed conventional-changelog plugin dependency, GitHub release body now auto-extracted from `CHANGELOG.md` via `scripts/extract-release-notes.sh`
- `CONTRIBUTING.md` updated to reflect volunteer-centric commit and changelog workflow
- `.gitignore` extended with `MENTORSHIP_GUIDE.md` and `supabase/snippets/`

---

### Summary

| Category          | Details                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **New features**  | Multi-step onboarding, auto-subscription with default plan, flash notice system, secure sign-out              |
| **Bug fixes**     | Unsafe URL injection, onboarding new-user trigger (PGRST116), auto-subscription edge-case warning             |
| **Auth**          | Middleware guardrails, smart login/signup redirects, secure session cleanup                                   |
| **Components**    | Card, CheckboxGroup, DynamicInput, FieldLayout, PhotoInput, ProgressBar, TagInput                             |
| **Hooks**         | useFilePreview, useFormPersistence, useProfile, useStepper                                                    |
| **Testing**       | Jest infrastructure, 40+ tests across components, hooks, pages, and server actions                            |
| **DevOps / Docs** | README overhaul, release tooling update, CONTRIBUTING.md refresh, .gitignore additions, CI health_timeout fix |
| **Files changed** | ~55 files · +3 800 lines added · −110 lines removed                                                           |

---

## [0.3.0] - 2026-03-12

### Volunteer Contributions

> Every feature and fix in this release was made possible by our amazing volunteers.
> Thank you for your time, talent, and dedication to the community!

---

#### Victor Crispin — [@vcjr](https://github.com/vcjr)

**Dashboard Calendar View** — [PR #14](https://github.com/vcjr/christians-innovate-app/pull/14) · CI-34

A brand-new condensed calendar view that lets users see their reading plan progress at a glance. Includes a view toggle to switch between the existing day-card layout and the new calendar, plus enhanced reading-progress indicators.

- New components: `calendar-view.tsx`, `view-toggle.tsx`
- Expanded types and updated dashboard actions to support calendar data
- Accessibility, type-safety, and Tailwind CSS improvements applied after code review

**Bible Plan Day Navigation** — [PR #15](https://github.com/vcjr/christians-innovate-app/pull/15) · CI-31

Navigate between plan days with previous/next controls and full keyboard-shortcut support, providing a seamless reading plan experience.

- New component: `day-navigation.tsx` with keyboard arrow-key controls
- Updated plan-day page to integrate navigation
- Improved Supabase sibling queries with `maybeSingle`, plus `e.repeat` guard and `e.preventDefault` in keyboard handler

**Launch Prayer Preview Fix** — [PR #16](https://github.com/vcjr/christians-innovate-app/pull/16) · CI-35

Fixed data fetching in the dashboard launch-prayer-preview widget so it correctly displays recent prayer posts.

---

#### Justin H — [@JustinhSE](https://github.com/JustinhSE)

**TypeScript CI Pipeline** — [PR #12](https://github.com/vcjr/christians-innovate-app/pull/12) · CI-29

Added automated TypeScript type-checking to the CI workflow, catching type errors on every push and helping maintain code quality across the project.

- New CI step for `tsc --noEmit` validation
- Updated Node.js version in CI workflow
- Dashboard page type fixes to pass strict checking

---

### Summary

| Category          | Details                                            |
| ----------------- | -------------------------------------------------- |
| **New features**  | Dashboard calendar view, Bible plan day navigation |
| **Bug fixes**     | Launch prayer preview data                         |
| **DevOps**        | TypeScript CI pipeline, Node.js CI update          |
| **Files changed** | 9 files · +735 lines added · −60 lines removed     |

---

## [0.2.0] - 2026-03-09

### Added

- **Admin analytics dashboard** — Dedicated admin dashboard page with real-time stats cards (total subscribers, active plans, meeting counts) and a paginated subscribers list modal ([PR #2](https://github.com/vcjr/christians-innovate-app/pull/2), [CI-21](https://github.com/vcjr/christians-innovate-app)) — *Lidia*
- **Resources section** — Full resources page with filterable resource cards, file upload form, and resource management actions ([PR #8](https://github.com/vcjr/christians-innovate-app/pull/8)) — *Victor Crispin*
- **Resources storage** — Supabase migrations for `resources` table (`20260121000008`) and dedicated resources storage bucket with RLS policies (`20260121000009`) — *Victor Crispin*

### Changed

- Admin meetings: improved loading states and type safety across `create-meeting-form`, `edit-meeting-modal`, and `meeting-list` ([PR #8](https://github.com/vcjr/christians-innovate-app/pull/8)) — *Lidia*
- Navigation and mobile menu updated to surface Resources and Admin Dashboard links — *Victor Crispin, Lidia*
- Root layout (`app/layout.tsx`) and signup page updated to support community hub navigation — *Lidia*
- Database init migration (`20260121000000`) extended with additional schema entries — *Lidia*
- New npm dependencies added to support community hub and admin dashboard features — *Lidia*

---

## [0.1.0] - 2026-02-26

### Added

- **Bible SDK integration** — YouVersion Bible SDK wired into the platform for verse lookup and reading; offline Bible reading supported via PWA ([#10](https://github.com/vcjr/christians-innovate-app/pull/10)) — *Victor Crispin*
- **Accountability Hub** — Full accountability feature with meeting scheduling, attendance tracking, invitations, notifications, and calendar sync ([CI-6](https://github.com/vcjr/christians-innovate-app)) — *Victor Crispin, Elie Paul*
- **Email system** — Transactional email templates and inbox capabilities for member communications — *Victor Crispin*
- **Admin dashboard** — Admin layout with reading plan analytics, subscriber tracking, and member management — *Victor Crispin*
- **Reading plans** — Create and manage multi-day Bible reading plans with per-day content, progress tracking, and subscriber support — *Victor Crispin*
- **Launch Prayer** — Community prayer post creation and display — *Victor Crispin*
- **Member directory** — Browsable member directory with skills, interests, copy-to-clipboard profile links, and CSV member export — *Victor Crispin, Elie Paul*
- **Resources page** — Dedicated resources section with updated navigation ([#8](https://github.com/vcjr/christians-innovate-app)) — *Victor Crispin*
- **PWA support** — Web app manifest and offline-first mobile navigation for iOS/Android home screen installs — *Victor Crispin*
- **User preferences** — Per-user settings persisted via Supabase, including Bible translation preferences — *Victor Crispin*
- **Settings page** — Profile and preference management UI — *Victor Crispin*
- **Dashboard** — Personalized dashboard with day cards, verse display, reading progress, and sort controls — *Victor Crispin*

### Changed

- Tightened Row Level Security (RLS) policies across all Supabase tables — *Victor Crispin*
- Improved admin action type safety and error handling following PR review — *Victor Crispin*
- Mobile-first navigation redesign with responsive menu — *Victor Crispin*
- `defaultChecked` applied consistently across checkbox inputs ([PR #7](https://github.com/vcjr/christians-innovate-app/pull/7)) — *Justin H*

### Fixed

- Meeting attendance list not displaying correctly — *Victor Crispin*
- Meeting feature timezone conversion issues — *Victor Crispin*
- Coalesce errors in Supabase queries — *Victor Crispin*
- Admin existence check before policy application — *Victor Crispin*
- Text formatting inconsistencies across components — *Victor Crispin*

### Security

- Resolved CodeQL alert: clear-text logging of sensitive information ([PR #10](https://github.com/vcjr/christians-innovate-app/pull/10)) — *Victor Crispin*
- Resolved CodeQL alert: regex special characters not escaped in hostname validation — *Victor Crispin*
- Dependency bumps: `next`, `tar` (via Dependabot) — *dependabot[bot]*

---

## Contributors

| Name           | GitHub                                                   | Role           |
| -------------- | -------------------------------------------------------- | -------------- |
| Victor Crispin | [@vcjr](https://github.com/vcjr)                         | Lead Developer |
| Lidia          | [@lidiadelacruz](https://github.com/lidiadelacruz)       | Developer      |
| Justin H       | [@JustinhSE](https://github.com/JustinhSE)               | Developer      |
| Elie Paul      | [@EliePaulDev](https://github.com/EliePaulDev)           | Developer      |
| Caleb Matteis  | [@bluecollarcoders](https://github.com/bluecollarcoders) | Developer      |

---

[Unreleased]: https://github.com/vcjr/christians-innovate-app/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/vcjr/christians-innovate-app/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/vcjr/christians-innovate-app/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/vcjr/christians-innovate-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vcjr/christians-innovate-app/releases/tag/v0.1.0
