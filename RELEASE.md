# Release Management Guide

This document describes the release process for ToonsTalk (Chitter Chatter).

## Overview

We use **manual version control** with automated deployment pipelines. You decide the version number, and the system handles the rest (validation, changelog, deployment).

## Branch Strategy

```
master (production)      ──v1.0.0──────v1.0.1──────v1.1.0────
                             ╲            ╱          ╱
development (staging)    ────●──────●──────────●──────
                              ╲    ╱            ╲
feature/*                 ─────●──●──────────────●───
                                               ╱
hotfix/*                  ─────────────────●──●──
```

- **master**: Production branch, only receives merges from releases
- **development**: Staging branch, receives feature branches
- **feature/**: Feature development branches
- **hotfix/**: Emergency fix branches from master

## Deployment Flows

### 1. Development Staging (Automatic)

**Trigger:** Push to `development` branch

**What happens:**
- Automatic build
- Deploy to Firebase staging channel
- Accessible at staging URL for 30 days
- No version tag created

**When to use:** Testing features before production release

### 2. PR Preview (Automatic)

**Trigger:** Pull request to `development` branch

**What happens:**
- Automatic build
- Deploy to temporary Firebase channel
- Preview URL posted in PR comments
- Auto-expires when PR is closed

**When to use:** Reviewing changes in PR

### 3. Production Release (Manual)

**Trigger:** Git tag push (v*)

**What happens:**
- Build with version number
- Deploy to Firebase live channel
- Create GitHub Release with changelog
- Permanent deployment

**When to use:** Ready for production release

## Release Commands

### Normal Release (from development)

**Requirements:**
- Must be on `development` branch
- Working directory must be clean
- Version must be greater than current

```bash
# Example: Releasing version 1.2.0
npm run release 1.2.0

# Script will:
# 1. Validate version format (must be semver: 1.2.0)
# 2. Check you're on development branch
# 3. Check git working directory is clean
# 4. Update package.json
# 5. Generate CHANGELOG.md from commits
# 6. Create commit: "chore(release): 1.2.0"
# 7. Create tag: v1.2.0
# 8. Show next steps

# Then push the tag:
git push --follow-tags

# Or separately:
git push
git push origin v1.2.0
```

### Hotfix Release (from hotfix branch)

**Requirements:**
- Must be on `hotfix/*` branch
- Working directory must be clean
- Version must be greater than current

```bash
# Create hotfix branch from master
git checkout master
git pull
git checkout -b hotfix/critical-login-bug

# Fix the bug
git add .
git commit -m "fix: resolve critical login issue"

# Release hotfix (patch version)
npm run release:hotfix 1.1.1

# Push the tag
git push origin hotfix/critical-login-bug --follow-tags

# After deployment, merge back to master
git checkout master
git merge hotfix/critical-login-bug
git push

# Also merge to development
git checkout development
git merge hotfix/critical-login-bug
git push
```

## Version Validation

The release script validates:
- ✅ Version is provided (fails without it)
- ✅ Version follows semver format (X.Y.Z)
- ✅ Version is greater than current
- ✅ Git working directory is clean
- ✅ On correct branch (development or hotfix/*)

**Invalid examples:**
```bash
npm run release          # ❌ No version provided
npm run release 1.2      # ❌ Invalid format (needs X.Y.Z)
npm run release 1.0.0    # ❌ Not greater than current (0.1.0 → 1.0.0 is OK)
```

**Valid examples:**
```bash
npm run release 1.0.0           # ✅ Major release
npm run release 1.2.0           # ✅ Minor release
npm run release 1.2.1           # ✅ Patch release
npm run release 2.0.0-beta.1    # ✅ Pre-release
npm run release:hotfix 1.1.1    # ✅ Hotfix
```

## Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

**Format:** MAJOR.MINOR.PATCH

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

**Examples:**
- `1.0.0 → 1.1.0`: Added room background selector
- `1.1.0 → 1.1.1`: Fixed avatar upload bug
- `1.1.1 → 2.0.0`: Changed API structure (breaking)

## Conventional Commits

Use conventional commit format for automatic changelog generation:

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `test`: Adding tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes

**Examples:**
```bash
git commit -m "feat(rooms): add background selector"
git commit -m "fix(auth): resolve login redirect issue"
git commit -m "refactor: improve avatar upload logic"
git commit -m "docs: update release guide"
```

## CHANGELOG

The CHANGELOG.md is automatically generated from git commits:

- Groups commits by type
- Shows commit hash for reference
- Updates on each release
- Includes date and version

**Example:**
```markdown
## [1.2.0] - 2025-09-30

### ✨ Features
- **rooms:** add background selector ([a1b2c3d])
- **avatars:** implement preloaded avatars ([e4f5g6h])

### 🐛 Bug Fixes
- **auth:** resolve login redirect issue ([i7j8k9l])

### ♻️  Refactoring
- improve avatar upload logic ([m0n1o2p])
```

## GitHub Releases

When you push a tag, GitHub Actions automatically:
1. Builds the production version
2. Deploys to Firebase
3. Creates a GitHub Release
4. Includes changelog excerpt
5. Links to deployment

## Troubleshooting

### "Version number required" error
**Cause:** No version provided to release command
**Fix:** Run with version: `npm run release 1.2.0`

### "Invalid version format" error
**Cause:** Version doesn't follow semver (X.Y.Z)
**Fix:** Use valid semver: `npm run release 1.2.0`

### "New version must be greater than current" error
**Cause:** New version ≤ current version
**Fix:** Check current version in package.json and use a higher number

### "Must be on development branch" error
**Cause:** Trying to release from wrong branch
**Fix:** `git checkout development` before releasing

### "Git working directory not clean" error
**Cause:** Uncommitted changes exist
**Fix:** Commit or stash changes before releasing

## Quick Reference

| Task | Command | Branch Required |
|------|---------|----------------|
| Normal Release | `npm run release X.Y.Z` | development |
| Hotfix Release | `npm run release:hotfix X.Y.Z` | hotfix/* |
| Push Release | `git push --follow-tags` | any |
| Check Version | `cat package.json \| grep version` | any |
| View Changelog | `cat CHANGELOG.md` | any |

## Workflow Summary

**Feature Development:**
```bash
git checkout development
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "feat: add cool feature"
git push origin feature/my-feature
# Create PR to development
```

**Production Release:**
```bash
git checkout development
git pull
npm run release 1.2.0
git push --follow-tags
# Wait 3-5 minutes for deployment
```

**Emergency Hotfix:**
```bash
git checkout master
git checkout -b hotfix/urgent-fix
# ... fix bug ...
git commit -m "fix: resolve urgent bug"
npm run release:hotfix 1.1.1
git push origin hotfix/urgent-fix --follow-tags
# Merge back to master and development
```

## Support

If you encounter issues with the release process:
1. Check this guide
2. Review GitHub Actions logs
3. Check Firebase console for deployment status