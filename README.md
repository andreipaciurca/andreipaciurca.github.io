# andreipaciurca.github.io

**Live:** [andreipaciurca.github.io](https://andreipaciurca.github.io)

A terminal-styled, ATS-friendly resume site with a fully automated LinkedIn → AI → GitHub Pages data pipeline.

## Features

- **Automated Pipeline** — GitHub Actions fetches LinkedIn data via Apify, runs it through Google Gemini 2.0 Flash for narrative summarization, and redeploys on every push.
- **Terminal UI** — Modular vanilla JS (ES Modules) with a CLI aesthetic, 3D profile card flip, and typewriter animations.
- **ATS-Optimized Print** — Dedicated printable layout with heuristic quality scoring targeting standard ATS parsers.
- **Multi-language** — EN/RO toggle backed by MyMemory Translation API with local i18n fallback and session caching.
- **Dark / Light mode** — CSS variable–driven theming with smooth transitions.

## Architecture

```
.github/workflows/
  update-resume.yml       # Cron + push trigger: Apify → Gemini → commit

js/
  main.js                 # Bootstrap and event orchestration
  modules/
    config.js             # UI constants and configuration
    state.js              # Global application state
    dom.js                # Typed DOM element references
    utils.js              # Pure utility functions
    translation.js        # MyMemory API + local i18n fallback
    ui.js                 # Animations, ASCII art, typewriter
    print.js              # ATS print layout and heuristic scoring

scripts/
  update-resume.js        # LinkedIn JSON → Gemini → profile-data.js

tests/
  resume.spec.js          # Jest integration tests

profile-data.js           # Single source of truth (auto-generated)
i18n-data.js              # Romanian translation dictionary
data/linkedin.json        # Raw LinkedIn export (auto-synced)
health.json               # Pipeline status (auto-generated)
```

## Setup

### GitHub Secrets (required for the pipeline)

| Secret | Description |
|--------|-------------|
| `APIFY_TOKEN` | Apify API token for the LinkedIn Profile Scraper dataset |
| `GEMINI_API_KEY` | Google AI Studio API key |

Configure at **Settings → Secrets and variables → Actions**.

### Local Development

ES Modules require a local HTTP server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

### Manual Pipeline Run

```bash
GEMINI_API_KEY=<key> APIFY_TOKEN=<token> node scripts/update-resume.js
```

## Testing

```bash
npm test
```

Tests cover profile data completeness, skill integrity, health endpoint structure, and source file integrity checks (no deprecated model names, no known typos).

## Health

Pipeline status is available at [/health/](https://andreipaciurca.github.io/health/).
