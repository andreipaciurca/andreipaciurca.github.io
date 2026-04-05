# Gemini AI Integration

The pipeline uses Google Gemini Flash to transform raw LinkedIn export text into professional resume prose.

## Model

`gemini-flash-latest` — a stable Google alias that always resolves to the newest Flash model (currently `gemini-3-flash-preview`). Configured as the `GEMINI_MODEL` constant in `scripts/update-resume.js`. The SDK resolves the alias directly; no model discovery call is needed.

## Tasks

Invoked once per pipeline run for two purposes:

**1. Summary** (`processSummary`)
- Input: LinkedIn `about` section, capped at 1500 characters.
- Prompt: rewrite as a 2-sentence professional summary — core identity first, tech stack and domain second — under 250 characters total, no newlines.
- Validation: rejected if output is under 40 characters or contains raw dump markers (newlines, truncation phrases).
- Fallback: `FALLBACK_SUMMARY` — a hand-crafted summary in `scripts/update-resume.js`.

**2. Experience bullets** (`processExperienceBullets`)
- Input: job `description` field, capped at 2000 characters.
- Prompt: generate 2–3 resume bullet points starting with strong action verbs, each under 130 characters, no leading dashes or numbers.
- Validation: `bulletsAreGood()` — requires ≥ 2 bullets, each over 20 characters, none containing raw dump markers.
- Fallback: `FALLBACK_EXPERIENCES[i].bullets` — per-job curated bullets in `scripts/update-resume.js`.

## Quality Gate

`looksLikeRawDump(text)` returns `true` (reject) if:
- Text contains newlines
- Text is over 200 characters
- Text contains known raw-dump phrases: `"specialization"`, `"during this period"`, `"experience:\n"`, `"- core backend"`

When either AI call fails the quality gate or throws an exception, the curated fallback is used for that specific entry. The pipeline never writes raw LinkedIn text to `profile-data.js`.

## Verification

The 2026-ready features (Terminal, AI Feed) are verified through Playwright E2E tests to ensure the simulated intelligence and layout stability match the design spec. Playwright tests must be executed against all three browser profiles: **Chromium**, **WebKit (Safari)**, and **Firefox**. Run `npm run test:e2e` to verify both the AI data pipeline integrity and the UI behavior across all major browser engines.

All Pull Requests are automatically verified by the CI pipeline (`.github/workflows/ci.yml`), which enforces these tests.

## Authentication

The API key is passed via the `X-goog-api-key` header (not as a `?key=` query parameter). Ensure the key has **no HTTP referrer restrictions** in Google Cloud Console — the pipeline runs server-side and cannot supply a browser referrer.

## Health

`health.json` records `"gemini": true/false` based on whether `GEMINI_API_KEY` is present in the environment at runtime. Check the `/health/` dashboard for current status.
