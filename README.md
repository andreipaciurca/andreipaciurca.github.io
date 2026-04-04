# Terminal Resume Site

[Live URL: https://andreipaciurca.github.io](https://andreipaciurca.github.io)

## Overview
A high-performance, ATS-friendly, and self-updating resume site. It features a terminal-inspired aesthetic, real-time theme adaptation (Light/Dark), and a fully automated data pipeline that keeps professional content synchronized with LinkedIn.

## Core Features
- **Dynamic Content Pipeline**: Automatically synchronizes data from LinkedIn via Apify, processes it through Google Gemini 2.0 Flash Lite for high-impact narrative summarization, and redeploys.
- **AI-Driven Summarization**: Professional experience and summary sections are transformed into compelling, concise paragraphs using the latest Gemini Flash Preview models.
- **Terminal UI**: A custom-designed CLI aesthetic with support for terminal-like commands (e.g., `help`, `ls`, `theme`).
- **Adaptive Theming**: CSS-variable-based Light/Dark mode with high-contrast accessibility optimizations.
- **ATS-Friendly**: Optimized printable PDF layout designed for standard Applicant Tracking Systems.

## Technical Architecture
The site is built as a modular static application using **ES Modules**.

### Automation Pipeline
The pipeline runs automatically via **GitHub Actions** (triggered on `push` to master or via `schedule`):
1. **Fetch**: `curl` retrieves raw JSON data from LinkedIn using Apify's LinkedIn Profile Scraper.
2. **Transform**: `scripts/update-resume.js` parses the JSON, cleans location strings, and invokes Gemini AI (dynamically selecting the latest Flash Preview model) for narrative summarization.
3. **Commit**: The generated `profile-data.js` is committed back to the repository, triggering a site redeploy via GitHub Pages.

### Folder Structure
```text
├── js/                  # Core JS Engine (ES Modules)
│   ├── main.js          # Entry point and event orchestration
│   └── modules/         # Decoupled components (UI, Print, Translation, State)
├── scripts/             # Automation logic
│   └── update-resume.js # Gemini AI sync script
├── .github/workflows/   # CI/CD pipelines
└── profile-data.js      # The single source of truth (Auto-generated)
```

## Setup & Development
1. **GitHub Secrets**: Configure these in your repository settings:
   - `APIFY_TOKEN`: API token for Apify LinkedIn Scraper.
   - `GEMINI_API_KEY`: API key for Gemini AI.
2. **Local Development**:
   - Because this project uses ES Modules, you must serve files via a local web server:
     ```bash
     python3 -m http.server 8080
     ```
   - Access the site at `http://localhost:8080`.

## Testing
To verify the integrity of the data pipeline and AI logic, run the test suite:
```bash
npm test
```
The tests mock the Gemini SDK to verify model selection logic and fallback mechanisms.
