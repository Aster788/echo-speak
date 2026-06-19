# Transcript Cleaner

Normalize raw video transcripts for downstream NLP and expression extraction.

## Input

Raw transcript text (may include timestamps, speaker labels, filler, ASR errors).

## Output

Plain cleaned text only. No markdown, no commentary.

## Rules

- Remove timestamps (`[00:12]`, `0:12`, etc.)
- Remove speaker labels (`Speaker 1:`, `[Host]`, etc.)
- Fix obvious ASR errors only when context is unambiguous
- Preserve paragraph breaks between topic shifts
- Do not summarize or translate
- Keep original language (English)
- Remove inline translation lines (e.g. Chinese subtitles paired with English)
