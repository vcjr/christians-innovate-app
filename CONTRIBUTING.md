# Contributing to Christians Innovate App

Welcome! Here are the guidelines to ensure every contribution is clearly tracked in the changelog and version history.

---

## Commit Messages

Write clear, descriptive commit messages that explain **what** was changed and **why**. Prefix with the JIRA ticket ID when applicable.

### Format

```
CI-XX brief description of the change
```

### Scopes (optional)

You can optionally include a scope to indicate which area of the app is affected:

`admin`, `dashboard`, `plans`, `meetings`, `directory`, `auth`, `bible`, `email`, `pwa`, `db`, `api`

### Examples

```bash
CI-34 add calendar view to dashboard
CI-35 fix data for launch-prayer-preview component
CI-29 set up TypeScript CI validation
update Node.js version in CI workflow
```

---

## Attribution in the Changelog

We use a **volunteer-centric** changelog format. Each release groups contributions **by person**, not just by change type. This ensures every volunteer's work is visible and celebrated.

When your PR is merged, the project lead will add your entry to the `[Unreleased]` section of `CHANGELOG.md` using this format:

```markdown
#### Your Name — [@github-handle](https://github.com/handle)

**Feature/Fix Title** — [PR #N](link) · JIRA-ID

One or two sentences explaining what this change does and why it matters for users.

- Key implementation detail 1
- Key implementation detail 2
```

### How to help with attribution

Include the following in your **PR description** to make changelog writing easy:
1. A one-line summary of what the change does
2. Your preferred display name
3. The JIRA ticket ID (e.g., CI-34)
4. Any key files or components you added/changed

---

## Releasing a New Version

Only the project lead runs a release. The process is:

1. **Curate the changelog** — Move entries from `[Unreleased]` into a new `## [X.Y.Z] - YYYY-MM-DD` section, grouped by volunteer with PR links and descriptions
2. **Run release-it** — This bumps `package.json`, commits, tags, and creates a GitHub release with the curated notes

```bash
npm run release          # auto-detects bump (patch / minor / major)
git push --follow-tags   # push the tag to GitHub
```

The GitHub release body is automatically extracted from `CHANGELOG.md` via `scripts/extract-release-notes.sh`, so the hand-crafted volunteer attributions appear directly on the GitHub release page.

---

## Pull Request Checklist

- [ ] Commit messages are clear and include the JIRA ticket ID
- [ ] PR description includes a summary, your name, and JIRA ticket for changelog attribution
- [ ] No `console.log` of sensitive data
- [ ] TypeScript types are correct (no `any` unless justified)
- [ ] Tested on mobile viewport
