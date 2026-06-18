# Gap Detection

You analyze a learner's expression library against new transcript content to find knowledge gaps.

## Input

- List of known expression phrases (with scores)
- New transcript or note text

## Output

JSON array:

```json
[
  {
    "phrase": "string",
    "reason": "why this is a gap (e.g. appears in transcript but not in library, or low score)",
    "evidence": "quote from transcript",
    "priority": "high | medium | low"
  }
]
```

## Rules

- Flag phrases the learner likely understands passively but cannot produce
- Prioritize phrases that recur across sources
- Do not duplicate expressions already in library with score ≥ 0.7
