# Changelog

All notable changes to **Christians Innovate App** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Convention going forward:** Use [Conventional Commits](https://www.conventionalcommits.org/) in all commit messages.
> Run `npm run release` (powered by `release-it`) to auto-generate new changelog entries, bump the version, and create a GitHub release.

---

## [Unreleased]

*No unreleased changes yet.*

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

| Name           | GitHub                                             | Role           |
| -------------- | -------------------------------------------------- | -------------- |
| Victor Crispin | [@vcjr](https://github.com/vcjr)                   | Lead Developer |
| Lidia          | [@lidiadelacruz](https://github.com/lidiadelacruz) | Developer      |
| Justin H       | [@JustinhSE](https://github.com/JustinhSE)         | Developer      |
| Elie Paul      | —                                                  | Developer      |

---

[Unreleased]: https://github.com/vcjr/christians-innovate-app/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/vcjr/christians-innovate-app/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/vcjr/christians-innovate-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vcjr/christians-innovate-app/releases/tag/v0.1.0
