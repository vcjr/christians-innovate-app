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

[Unreleased]: https://github.com/vcjr/christians-innovate-app/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/vcjr/christians-innovate-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vcjr/christians-innovate-app/releases/tag/v0.1.0
