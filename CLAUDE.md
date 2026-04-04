# Architecture Overview

- **Core Engine**: Modular JS implementation using ES Modules, located in `/js/`.
- **Data Pipeline**: 
    - Trigger: GitHub Actions (`push` or `cron`).
    - Fetcher: Apify LinkedIn Scraper.
    - Intelligence: Google Gemini 2.0 Flash Lite (dynamic model selection).
    - Output: `profile-data.js` (Single Source of Truth).
- **UI System**: Vanilla CSS with theme-driven variables.
- **Verification**: Jest-based testing for pipeline validation.

## Implementation Details
- **Module Orchestration**: `js/main.js` handles bootstrapping and global event orchestration.
- **AI Integration**: The `scripts/update-resume.js` utilizes `@google/generative-ai`. It dynamically queries for the most recent `Flash Preview` model to ensure the system remains state-of-the-art.
- **State Management**: State handling is encapsulated in `js/modules/state.js`.
- **Print Optimization**: `js/modules/print.js` handles ATS-friendly layout generation, focusing on text density and keyword coverage.
