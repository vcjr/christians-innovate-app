# Contributing to Christians Innovate App

Welcome! Here are the guidelines to ensure every contribution is clearly tracked in the changelog and version history.

---

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). This allows us to auto-generate the `CHANGELOG.md` and bump versions automatically.

### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer: closes #issue, co-authored-by, etc.]
```

### Types

| Type       | What it means                        | Appears in changelog? |
| ---------- | ------------------------------------ | --------------------- |
| `feat`     | A new feature                        | ✅ Yes — Added         |
| `fix`      | A bug fix                            | ✅ Yes — Fixed         |
| `perf`     | A performance improvement            | ✅ Yes — Changed       |
| `refactor` | Code restructure, no behavior change | ❌ No                  |
| `docs`     | Documentation only                   | ❌ No                  |
| `style`    | Formatting, whitespace               | ❌ No                  |
| `test`     | Tests                                | ❌ No                  |
| `chore`    | Build process, dependency updates    | ❌ No                  |
| `security` | Security patches                     | ✅ Yes — Security      |
| `revert`   | Revert a previous commit             | ✅ Yes                 |

> **Breaking changes:** Add `!` after the type (e.g., `feat!:`) or add `BREAKING CHANGE:` in the footer. This triggers a major version bump.

### Scopes (optional but recommended)

Use a scope to indicate which area of the app is affected:

`admin`, `dashboard`, `plans`, `meetings`, `directory`, `auth`, `bible`, `email`, `pwa`, `db`, `api`

### Examples

```bash
feat(meetings): add timezone selection to meeting creation form
fix(dashboard): correct verse display for multi-chapter ranges
chore(deps): bump next from 16.1.3 to 16.1.5
feat!: replace launch prayer feed with new moderation system
docs: update README with local setup instructions
```

---

## Attribution in the Changelog

When your PR is merged, add a summary entry to the `[Unreleased]` section of `CHANGELOG.md` under the appropriate heading (`Added`, `Changed`, `Fixed`, `Security`, `Removed`).

Format:
```markdown
- Brief description of change ([#PR](link)) — *Your Name*
```

Example:
```markdown
- Added bulk-delete for reading plan days ([#12](https://github.com/vcjr/christians-innovate-app/pull/12)) — *Justin H*
```

---

## Releasing a New Version

Only the project lead runs a release. It will automatically:
1. Read all `feat:` and `fix:` commits since the last release
2. Bump the version in `package.json`
3. Append a new section to `CHANGELOG.md`
4. Create a git tag

```bash
npm run release          # auto-detects bump (patch / minor / major)
npm run release:minor    # force a minor version bump
npm run release:major    # force a major version bump
git push --follow-tags   # push the tag to GitHub
```

---

## Pull Request Checklist

- [ ] Commit messages follow Conventional Commits
- [ ] `[Unreleased]` section of `CHANGELOG.md` updated with your entry and name
- [ ] No `console.log` of sensitive data
- [ ] TypeScript types are correct (no `any` unless justified)
- [ ] Tested on mobile viewport
