# CLAUDE.md

Guidance for Claude Code when editing this repository.

## Project Goal

Static GitHub Pages resume site with:
- terminal/mac-app inspired UI
- editable profile data
- external EN/RO translation API + local fallback
- one-page print resume with ATS-oriented precheck

## Main Files

- `index.html` - semantic structure and mount points
- `style.css` - visual system, responsive styles, print styles
- `app.js` - rendering, interactions, localization, print optimization, ATS heuristic checks
- `profile-data.js` - source of truth for editable profile content
- `i18n-data.js` - translation dictionary (`window.resumeI18n`)
- `profile-photo.jpg` - profile image used for hero + ASCII flip

## Data Ownership

Prefer editing `profile-data.js` for content updates:
- personal/contact info
- experience/skills/education/certifications
- top bar text
- availability mode
- print settings (`printResume`)

Use `i18n-data.js` only for translation overrides.

## Translation Rules

1. Keep source content in English in `profile-data.js`.
2. External translator is MyMemory API, with cache in browser localStorage.
3. Add Romanian fallback mappings in `i18n-data.js` (`window.resumeI18n.ro`).
4. Missing dictionary keys should gracefully fall back to English.

## Print / ATS Rules

1. Keep print output one page when possible.
2. Keep print layout ATS-friendly (simple text flow, clear sections, no visual-only data).
3. Preserve precheck flow in `app.js`:
   - `optimizePrintResumeLayout`
   - `buildAtsHeuristicReport`
   - `updatePrintHealthLine`
4. Never claim guaranteed ATS pass; treat scoring as heuristic guidance.

## UI / Interaction Rules

1. `+` button must toggle experience sections expand-all/collapse-all.
2. EN/RO toggle must update top command `--lang en|ro`.
3. Close/minimize/maximize interactions must keep launcher behavior intact.
4. Keep keyboard shortcuts:
   - `Cmd/Ctrl + K` language toggle
   - `Cmd/Ctrl + P` print with precheck
   - `E` expand/collapse
   - `M` minimize

## Security Rules

1. Preserve URL sanitization for `mailto`, `tel`, and external `https` links.
2. Keep CSP/referrer/permissions meta policies in `index.html`.
3. Avoid injecting unsanitized HTML from profile data.

## Common Edit Locations

- update availability:
  `profile-data.js` -> `availabilityMode`

- update experience:
  `profile-data.js` -> `experiences`

- update top command/welcome text:
  `profile-data.js` -> `topBar`

- update RO wording:
  `i18n-data.js`

- adjust visual texture/transitions:
  `style.css`

- tune print and ATS behavior:
  `app.js` + `style.css` (`@media print`)

## Validation Checklist

1. `node --check app.js`
2. EN/RO toggle works and keeps layout stable.
3. Experience expand/collapse still works.
4. ATS precheck runs only on print and print still opens.
5. Desktop + mobile + wide-screen remain readable.
6. 404 page stays stylistically aligned with main site.
