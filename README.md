# Terminal Resume Site

Live URL: [https://andreipaciurca.github.io](https://andreipaciurca.github.io)

This repository contains a static GitHub Pages resume site with a terminal/mac-app visual style, external API EN/RO translation with local fallback, interactive sections, and one-page printable resume output.

## Tech Stack

- `index.html` - page structure and semantic sections
- `style.css` - all visual styling, animations, responsive behavior, print CSS
- `profile-data.js` - main editable content source
- `i18n-data.js` - English to Romanian dictionary used at runtime
- `app.js` - runtime rendering, interactions, translation, ATS precheck, print optimization
- `profile-photo.jpg` - profile image used for hero and ASCII flip effect
- `404.html` - custom terminal-style not-found page

## Edit Guide

### Update Profile Content
Edit `profile-data.js`:
- personal fields: `candidateName`, `location`, `jobType`, `driversLicense`
- contact fields: `contact.email`, `contact.phone`, `contact.linkedinUrl`, `contact.githubUrl`
- role/summary/status: `role`, `summary`, `statusLine`
- experiences: `experiences` array
- skills: `skillGroups` array
- education: `education` array
- certifications: `certifications` array

### Update Availability
Edit only:
- `availabilityMode` in `profile-data.js`

Allowed values:
- `"notice"`
- `"immediate"`

### Update Header Command / Top Bar
Edit `profile-data.js` under `topBar`:
- `firstVisitMessage`
- `commandMessage`
- `commandCursor`
- `buttonLabels`
- `launcherSpeechText`

`app.js` will auto-append `--lang en` or `--lang ro` to the top command line.

### Update Translation
Runtime translation uses:
- external API: `https://api.mymemory.translated.net`
- local fallback dictionary: `i18n-data.js`

Edit `i18n-data.js`:
- dictionary path: `window.resumeI18n.ro`
- key = English source text
- value = Romanian translation

Fallback behavior:
- if external API fails, local dictionary is used
- if a key is missing in dictionary too, English text is shown

## Resume PDF (Harvard-Style, ATS-Oriented)

The `Download Resume (PDF)` button runs:

1. print layout optimization (one-page fit strategy)
2. ATS heuristic precheck (score + warnings)
3. browser print dialog

Implementation:
- layout strategies and checks are in `app.js` (`optimizePrintResumeLayout`, `buildAtsHeuristicReport`)
- print typography/layout is in `style.css` under `@media print`

Important note:
- no tool can guarantee 100% pass across all ATS/recruiter systems.
- this implementation follows ATS-friendly structure (simple text, semantic sections, no table-based layout in print output, clean hierarchy, one-page constraint).

## Keyboard Shortcuts

- `Cmd/Ctrl + K` -> toggle EN/RO
- `Cmd/Ctrl + P` -> run precheck + print
- `E` -> expand/collapse all experience cards
- `M` -> minimize workspace

## Security and Hardening

- external translation API with browser cache and local fallback dictionary
- URL sanitization for contact links (`mailto`, `tel`, `https`)
- content security policy in `index.html`
- strict referrer policy and basic permissions policy in `index.html`
- reduced external behavior and safer link handling

## Responsive / Visual Notes

- mobile breakpoint: `@media (max-width: 760px)`
- wide-screen breakpoint: `@media (min-width: 1700px)`
- black-first textured UI with subtle complementary accents
- motion reduced automatically when `prefers-reduced-motion` is enabled

## SEO / Infra Files

- `robots.txt` allows crawling and references sitemap
- `sitemap.xml` lists the main URL
- `.htaccess` contains optional Apache fallback config (GitHub Pages ignores it)

## Local Preview

```bash
python3 -m http.server 8080
```

Open:
- `http://localhost:8080`
