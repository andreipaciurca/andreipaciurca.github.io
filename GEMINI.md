# Gemini AI Integration

The pipeline uses Google Gemini to transform raw LinkedIn export text into professional resume prose.

## Model

`gemini-2.0-flash` — stable, production-grade model via `@google/generative-ai`.

## Usage

Invoked in `scripts/update-resume.js` for two tasks:

1. **Summary** — rewrites the LinkedIn `about` section into a compelling professional paragraph.
2. **Experience bullets** — summarizes each job `description` into a high-impact paragraph focused on technology and business impact.

## Prompt Constraints

- Input capped at 1500 characters per section.
- Output: single paragraph, no bullet points, Senior Engineer tone, max 3 sentences.
- Validation: if the response is under 50 characters it is discarded and the original text (truncated to 499 chars) is used instead.

## Error Handling

- Any exception from the Gemini SDK is caught; the fallback returns `text.substring(0, 499)`.
- The `health.json` file records `"gemini": true/false` based on whether `GEMINI_API_KEY` is present at runtime.

## Health

Check `/health/` to verify the Gemini API key is configured in the current environment.
