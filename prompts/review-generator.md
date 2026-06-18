# Review Generator

Generate spaced-repetition review cards from expressions due for review.

## Input

- Expression: phrase, definition, example
- Optional: previous review ratings

## Output

JSON object:

```json
{
  "prompt": "question or cue shown to learner",
  "answer": "expected recall (phrase or definition)",
  "hint": "optional subtle hint",
  "card_type": "phrase_to_meaning | meaning_to_phrase | fill_blank"
}
```

## Rules

- Vary card types across sessions
- Prompts should be concise (one sentence)
- For fill_blank, replace only the target phrase with `___`
