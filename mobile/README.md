# Christians Innovate mobile

The Flutter app for iOS and Android. It talks to the same Supabase project as the web app,
so a member's plan, progress, posts, groups and settings are the same in both.

## What's in it

- **Today**: the day's reading from your plan, your reading streak, the prayer wall and your groups.
- **Reading day**: devotional, the passage, mark as read, previous and next day, and the day's discussion.
- **Bible**: every book and chapter in the 7 imported translations.
- **Reader**: text size, serif or sans, Paper, Sepia or Night page, line spacing, and tap verses to copy or share.
- **Community**: the prayer wall (prayers, launches, wins, "Praying", encouragement) and the member directory.
- **Groups**: invitations, your groups, finding and asking to join a group, starting one, and inside a group your commitments, everyone's commitments, reflections, and join requests if you lead it.
- **Me**: your profile, notifications, resources and settings (translation and email preferences, shared with the web).
- **First sign-in**: onboarding that fills in the directory profile, like the web's.

Admin tools stay on the web.

## Offline

- **Saved screens**: every read keeps its raw rows on the device (`lib/data/offline_store.dart`). Offline, screens show the saved copy straight away, and a member stays signed in.
- **Changes made offline**: mark as read, praying, comments, commitment status, reflections and notifications read go into a queue (`lib/data/outbox.dart`) that survives restarts. They show in the app at once and are sent in order when the server answers again. A reading done offline keeps the time it was read, so streaks stay right.
- **Read ahead**: the plan's next 7 days are fetched in the background.
- **Whole translations**: Settings → Offline Bible downloads a full translation (as the PWA did on the web). A downloaded translation is read from the device, online or not.
- **Banner**: a strip at the bottom says when the app is offline or still syncing.
- **Session**: on iOS and Android the Supabase session is kept in the Keychain/Keystore.

`integration_test/offline_test.dart` cuts the network for real by stopping the Supabase gateway container; see the comment at the top of the file.

## Run it locally

1. Start Supabase from the repo root and load the Bible text:

   ```bash
   npx supabase start
   npm run import:bibles
   ```

2. Copy `env/example.json` to `env/dev.json` and set `SUPABASE_PUBLISHABLE_KEY` from `npx supabase status`.

3. Run the app:

   ```bash
   cd mobile
   flutter run --dart-define-from-file=env/dev.json
   ```

## Tests

```bash
flutter analyze
flutter test
```

`integration_test/screens_test.dart` walks the real app against a seeded local Supabase and saves
a screenshot of each screen. It needs a signed-up member passed in with `--dart-define`; see the
comment at the top of the file.

## Notes

- **Fonts**: Plus Jakarta Sans for the interface and Literata for scripture, both under the SIL Open Font License (texts in `assets/fonts`).
- **Verses**: scripture references are parsed and verse text is cleaned the same way as the web's `utils/bible-api.ts` and `utils/bible-text-parser.ts`, so a plan day shows the same passage in both apps.
- **Sort order**: the Dart Supabase client sorts descending unless told otherwise, so every `.order()` in `lib/data/supabase_backend.dart` says `ascending:`.
