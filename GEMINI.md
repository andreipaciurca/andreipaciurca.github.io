# GEMINI AI Integration Profile
The resume uses Google's Generative AI for narrative transformation.

## Pipeline Logic
- **Model**: `gemini-2.0-flash-lite-preview-02-05`
- **Role**: Summarizes professional experience from raw LinkedIn exports into Senior-level narrative prose.
- **Constraints**: 
  - Max input per section: 1500 chars (chunked logic).
  - Output: Strict paragraph formatting.
  - Fallback: Truncated original text if AI fails.

## Known Limitations & Health
- **API Availability**: Relying on external API calls; if Gemini service is down, fallbacks trigger.
- **Content Density**: AI-generated summaries may vary in length depending on LinkedIn input density.
