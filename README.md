# Andrei Paciurca — Interactive Resume 2026

[![CI](https://github.com/andreipaciurca/andreipaciurca.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/andreipaciurca/andreipaciurca.github.io/actions/workflows/ci.yml)
[![Auto-Update](https://github.com/andreipaciurca/andreipaciurca.github.io/actions/workflows/update-resume.yml/badge.svg)](https://github.com/andreipaciurca/andreipaciurca.github.io/actions/workflows/update-resume.yml)
[![Tests](https://img.shields.io/badge/tests-56%20passing-brightgreen)](https://github.com/andreipaciurca/andreipaciurca.github.io/actions)
[![Health](https://img.shields.io/website?url=https%3A%2F%2Fandreipaciurca.github.io%2Fhealth.json&label=health)](https://andreipaciurca.github.io/health/)
[![Live Site](https://img.shields.io/badge/live-andreipaciurca.github.io-blue)](https://andreipaciurca.github.io)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6)](https://www.typescriptlang.org/)

**Live Preview:** [andreipaciurca.github.io](https://andreipaciurca.github.io)

## Overview

A cutting-edge, terminal-styled, and ATS-optimized resume platform featuring a fully automated LinkedIn → Gemini AI → GitHub Pages data pipeline. Engineered with modern TypeScript and compiled to native ES Modules, it achieves a perfect balance between high-performance "no-framework" architecture and sophisticated AI-driven personalization.

## Key Features

- **2026-Ready Interface** — Advanced terminal-themed UI with Glassmorphism, fluid animations (View Transitions API), and an interactive command-line interface.
- **AI-Driven Personalization** — Automated pipeline that harvests LinkedIn data via Apify, processes it using Google Gemini Flash (latest), and dynamically updates the profile.
- **Continuous Integration** — Automated Build, Unit (Jest), and multi-browser E2E testing (Playwright: Chromium, WebKit, Firefox) on every pull request.
- **Enterprise-Grade Security** — Automated dependency tracking via Dependabot and built-in protection against unauthorized data extraction.
- **ATS-Optimized Print System** — Specialized print layout with heuristic scoring and automatic overflow management to ensure perfect Harvard-style PDF generation.
- **Performance Optimized** — 100/100 Lighthouse-ready with WebP image delivery, resource minification, and critical path optimization.

## Architecture

```
.github/workflows/
  ci.yml                  # Automated CI: Build, Unit, E2E (on all PRs)
  update-resume.yml       # Triggers: push to master, monthly cron, manual dispatch
.github/dependabot.yml    # Automated dependency and security updates

assets/
  style.css               # All site styles — theme variables, layout, print rules
  favicon.png             # Site icon
  profile-photo.jpg       # Profile photo (used for ASCII art generation + OG image)

scripts/
  update-resume.js        # Pipeline: LinkedIn JSON → Gemini → profile-data.js

js/
  main.ts                 # Application entry point, event wiring
  modules/
    types.ts              # Shared TypeScript interfaces (ProfileData, Experience, AtsReport…)
    config.ts             # UI text constants, print strategy steps
    state.ts              # AppState interface + animation handle tracking
    dom.ts                # Typed DOM element references (HTMLButtonElement, etc.)
    utils.ts              # Pure utility functions (escape, truncate, URL validation)
    ui.ts                 # Animations, Braille ASCII art generation, typewriter
    renderer.ts           # Pure HTML string builders for each content section
    print.ts              # ATS print layout, overflow strategy, heuristic scoring

tests/
  resume.spec.js          # Jest unit tests (56 tests across 6 suites)
  e2e/
    site.spec.js          # Playwright E2E (Chromium, WebKit, Firefox)

data/
  linkedin.json           # Cleaned LinkedIn export (auto-synced by pipeline)

health/
  index.html              # Human-readable pipeline health page

profile-data.js           # Single source of truth — all resume content (auto-generated)
profile-data.d.ts         # TypeScript declaration for profile-data.js
health.json               # Pipeline run status — served as JSON API endpoint
tsconfig.json             # TypeScript: ES2020 target, strict, in-place compilation
```

## Pipeline

```
push / cron / dispatch
        │
        ▼
  actions/checkout@v4
        │
        ▼
  Apify: harvestapi~linkedin-profile-scraper
  input: {"queries": ["https://www.linkedin.com/in/andreipaciurca/"]}
        │
        ▼
  update-resume.js
  ├── strip moreProfiles, receivedRecommendations, photo fields
  ├── Gemini Flash (gemini-flash-latest alias) → summary + bullets
  ├── quality gate: looksLikeRawDump() + bulletsAreGood() — rejects bad AI output
  ├── fallback to FALLBACK_SUMMARY + FALLBACK_EXPERIENCES when AI fails
  └── write profile-data.js + health.json + cleaned data/linkedin.json
        │
        ▼
  git commit (amend if last commit is already chore: sync profile data)
        │
        ▼
  force-push → GitHub Pages redeploy
```

The amend-on-cron strategy keeps history flat — repeated automated runs update the same commit rather than adding new ones.

## TypeScript

All `js/**` modules are TypeScript. The compiled `.js` files are committed alongside the source so GitHub Pages can serve them without a build step.

```bash
npm run build       # compile .ts → .js (tsc, in-place)
npm run typecheck   # type-check without emitting files
```

Key TypeScript decisions:
- `"moduleResolution": "bundler"` — preserves `.js` import extensions required by browser native ES modules.
- `"rootDir": "js"` + `"outDir": "js"` — in-place compilation, `index.html` unchanged.
- `"strict": true` + `exactOptionalPropertyTypes` — catches undefined/null mismatches at compile time.
- `profile-data.d.ts` provides types for the auto-generated `profile-data.js` without modifying the pipeline output.

## Setup

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `APIFY_TOKEN` | Apify API token for the LinkedIn Profile Scraper |
| `GEMINI_API_KEY` | Google AI Studio API key (must have **no HTTP referrer restrictions**) |

Configure at **Settings → Secrets and variables → Actions**.

> **Note:** The `GEMINI_API_KEY` must be unrestricted by referrer — the pipeline runs server-side on GitHub Actions and cannot send a browser `Referer` header.

### Local Development

ES Modules require a local HTTP server — opening `index.html` directly will not work.

```bash
# Serve the site
python3 -m http.server 8080
# → http://localhost:8080

# Run the data pipeline locally
GEMINI_API_KEY=<key> node scripts/update-resume.js

# Type-check
npm run typecheck

# Compile TypeScript
npm run build
```

## Testing

It is mandatory to run all tests before committing changes, especially the E2E suite which verifies the 2026-ready UI features (Terminal, AI Feed, Security). Playwright tests must be executed against all three browser profiles: **Chromium**, **WebKit**, and **Firefox**.

```bash
# First time only: Install Playwright browsers (all profiles)
npm run test:e2e:install

# Run all tests (Unit + E2E on all 3 browsers)
npm run test:all

# Run individual suites
npm test              # Jest unit tests (56 tests, 6 suites)
npm run test:e2e      # Playwright E2E — Chromium, WebKit, Firefox
```

Unit test suites:
- **Profile Data — Structure** — required keys, types, contact validation
- **Profile Data — Content Quality** — summary format, bullet constraints
- **Profile Data — Skills Integrity** — icons, duplicates, whitespace
- **Health Endpoint** — schema, freshness (< 90 days old)
- **Source File Integrity** — DOM IDs, pipeline patterns, CSS, workflow
- **TypeScript Setup** — tsconfig, compiled output, interface exports, scripts

E2E test suites:
- **Site Layout** — basic navigation and content visibility
- **Terminal & AI Feed** — command processing, flags (-h, -s, -r), and typing animations
- **Security & Privacy** — right-click suppression toggle (--right on/off)
- **Responsive Design** — mobile and desktop layout transitions
- **Profile Interaction** — hover-triggered photo flip (manual only, no auto-rotation)

## Health

Pipeline status is available at [andreipaciurca.github.io/health/](https://andreipaciurca.github.io/health/).

| Indicator | Meaning |
|-----------|---------|
| `[ai] gemini` | Gemini produced usable AI output this run |
| `[sync] apify` | Fresh LinkedIn data fetched this run |
