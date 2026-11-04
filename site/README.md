# Christians Innovate — public site

The marketing site at christiansinnovate.com, rebuilt in Next.js from the old Lovable site. It lives beside the member app
(the repo root) and the Flutter app (`mobile/`), and uses the same Supabase project as the app.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Next meeting and today's reading, a daily fellowship verse, the 5/50/500 vision, programs, invite links |
| `/bible-year` | What Bible Year is, and the signup form |
| `/meetings` | The Thursday rhythm (1st & 3rd: Bible Year Recap; others: Community Convening), with meetings scheduled in the app filling in their dates |
| `/contact` | Contact form |
| `/suggestions` | Suggestion box (name and email optional) |
| `/nytw` | NY Tech Week shortlist: filter, like, and submit events (`/NYTW` redirects here) |

"Join" and "Login" go to the member app (`NEXT_PUBLIC_APP_URL`).

## Where things go

Visitors aren't signed in, so the site only uses the anon key and a few narrow database functions
(`supabase/migrations/20261103000000_marketing_site.sql`):

- **Contact and suggestions** → the app's admin **Inbox** (`inbox_messages`, to community@).
- **Bible Year signups** → the **mailing list** (`external_contacts`), plus a note in the Inbox.
- **NYTW** → `nytw_events` (public when active), `nytw_event_submissions` (wait for review), likes by an anonymous
  per-browser id. There's no admin screen for NYTW yet; manage events and approve submissions in Supabase Studio.
- **Meetings and the reading** are read from the app's `meetings` and default reading plan.

Each form has a hidden honeypot field, and the database functions check lengths and email format.

## Run it

```bash
cd site
cp .env.example .env.local   # fill in the anon key (`supabase status` prints it locally)
npm install
npm run dev                  # http://localhost:3100
```

`npm run lint` and `npm run build` should both pass before a PR.

## Deploy

A separate Vercel project with **Root Directory** set to `site`, and the env vars from `.env.example`. Apply the migration to
production Supabase first.
