# CODEX — Operations Manual

Reference guide for operating and maintaining the resume pipeline.

## Pipeline Flow

```
push to master  ─┐
monthly cron    ─┼──▶ GitHub Actions ──▶ Apify (LinkedIn JSON)
manual dispatch ─┘                            │
                                              ▼
                                    update-resume.js
                                    (Gemini summarization)
                                              │
                                              ▼
                                    profile-data.js + health.json
                                    committed & pushed → GitHub Pages redeploy
```

## Required Secrets

| Secret | Where | Purpose |
|--------|-------|---------|
| `APIFY_TOKEN` | GitHub repo secrets | Fetch LinkedIn dataset from Apify |
| `GEMINI_API_KEY` | GitHub repo secrets | Gemini 2.0 Flash summarization |

## Maintenance Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run integration tests (data integrity + source file checks) |
| `GEMINI_API_KEY=<key> node scripts/update-resume.js` | Manual pipeline sync |
| `python3 -m http.server 8080` | Local dev server (ES Modules require HTTP) |

## Health Monitoring

- **Endpoint**: `/health/` — shows system, Gemini, and Apify status with last sync timestamp.
- **File**: `health.json` — machine-readable pipeline status.

## Failure Modes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Experience bullets show raw LinkedIn text | Gemini call failing | Check `GEMINI_API_KEY` secret; verify model name in `scripts/update-resume.js` |
| `health.json` has `"apify": false` | Missing `APIFY_TOKEN` secret | Add token in GitHub repo settings |
| Language toggle broken | `encodeURIComponent` typo in `translation.js` | Check `js/modules/translation.js` for `encodeeURIComponent` |
| Tests failing on skills | Duplicate or whitespace-prefixed skill entries | Inspect `profile-data.js` skillGroups items |
