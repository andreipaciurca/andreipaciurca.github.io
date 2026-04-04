# CODEX — Operations Manual

Reference guide for operating, debugging, and extending the resume pipeline.

## Pipeline Flow

```
push to master  ─┐
monthly cron    ─┼──▶ GitHub Actions ──▶ Apify (LinkedIn JSON)
manual dispatch ─┘          │
                             │  strip: moreProfiles, receivedRecommendations,
                             │         photo, profilePicture, coverPicture
                             ▼
                     update-resume.js
                     ├── Gemini Flash (gemini-flash-latest alias)
                     ├── quality gate — looksLikeRawDump / bulletsAreGood
                     └── fallback to FALLBACK_EXPERIENCES / FALLBACK_SUMMARY
                             │
                             ▼
                     profile-data.js    ← resume content (committed)
                     health.json        ← pipeline status (committed)
                     data/linkedin.json ← cleaned export (committed)
                             │
                             ▼
                     git commit & push → GitHub Pages redeploy
```

**Commit strategy**: if the last commit is already `chore: sync profile data`, the workflow
amends it (`--amend --no-edit`) and force-pushes. This keeps history flat — cron runs do
not stack new commits.

## Required Secrets

| Secret | Where | Purpose |
|--------|-------|---------|
| `APIFY_TOKEN` | GitHub repo secrets | Fetch LinkedIn dataset from Apify |
| `GEMINI_API_KEY` | GitHub repo secrets | Gemini Flash summarization — **must have no HTTP referrer restrictions** |

Configure at **Settings → Secrets and variables → Actions**.

## Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run 16 integration tests |
| `npm ci` | Install exact dependencies from lockfile (used in CI) |
| `GEMINI_API_KEY=<key> node scripts/update-resume.js` | Manual pipeline sync |
| `python3 -m http.server 8080` | Local dev server — required for ES Modules (`file://` won't work) |

## Health Monitoring

- **Dashboard**: [andreipaciurca.github.io/health/](https://andreipaciurca.github.io/health/)
- **File**: `health.json` — machine-readable, written on every pipeline run.

| Field | Meaning |
|-------|---------|
| `"gemini": true` | At least one Gemini call produced output that passed quality gates this run |
| `"gemini": false` | AI calls failed or were skipped — curated fallback content is active |
| `"apify": true` | Fresh LinkedIn data was fetched this run |
| `"apify": false` | `APIFY_TOKEN` missing or Apify returned empty data — cached `data/linkedin.json` was used |

## Failure Modes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Experience bullets are raw LinkedIn text | Gemini call failing — 429 rate limit or bad key | Check `GEMINI_API_KEY`; ensure no HTTP referrer restrictions in Google Cloud Console |
| `health.json` shows `"apify": false` | `APIFY_TOKEN` secret not set | Add token: GitHub → Settings → Secrets and variables → Actions |
| LinkedIn data stale / not refreshing | Apify actor returning empty results | Verify actor is `harvestapi~linkedin-profile-scraper` with input `{"queries": ["<linkedin_url>"]}` |
| Pipeline commit rejected (non-fast-forward) | Remote diverged — previous pipeline run committed while local was pending | Run `git pull --rebase && git push`; the workflow guard handles this automatically on next trigger |
| Tests failing on skills | Duplicate or whitespace-prefixed label in `profile-data.js` | Inspect `skillGroups[*].items[*].label` — all labels must be unique and trimmed |
| Browser shows blank page / SyntaxError | Stale ES module cache in browser | Hard reload (Cmd+Shift+R / Ctrl+Shift+R) to bust the module cache |

## Content Updates

Experience bullets, summary, and skill groups live as curated constants in `scripts/update-resume.js`:

- `FALLBACK_SUMMARY` — shown when Gemini summary fails quality checks
- `FALLBACK_EXPERIENCES` — per-entry fallback bullets; array index matches LinkedIn experience order
- `SKILL_GROUPS` — always used (pipeline never overwrites skills from LinkedIn data)

Update these constants when the actual job changes. They are the active content source whenever
Gemini output is unavailable, which is the common case without a fresh, detailed LinkedIn description.
