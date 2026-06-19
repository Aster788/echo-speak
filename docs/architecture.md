# Architecture

永远只记录：系统结构。

---

## High Level Architecture

┌────────────────────┐

│     Next.js App    │

│   (App Router)     │

└──────────┬─────────┘

```
       │

       ▼
```

┌────────────────────┐

│      Services      │

│  Business Logic    │

└──────────┬─────────┘

```
       │

       ▼
```

┌────────────────────┐

│      Supabase      │

│     PostgreSQL     │

└────────────────────┘

```
       ▲

       │

       ▼
```

┌────────────────────┐

│     OpenAI API     │

└────────────────────┘

---

## Core Modules

### Transcript Import

Responsibilities:

- import transcript
- clean transcript
- store transcript

Examples:

- txt
- srt
- youtube transcript

---

### Expression Engine

Responsibilities:

- extract expressions
- classify topics
- detect difficulty

Output:

- phrase
- meaning
- example
- topic

---

### Review Engine

Responsibilities:

- generate review cards
- generate prompts
- support video review
- support topic review

Review Types:

- Chinese → English
- Scenario → Expression
- Recall Prompt

---

### SRS Scheduler

Responsibilities:

- decide next review date
- maintain review queue

Ratings:

- mastered
- review_again
- forgotten

---

### Gap Detection

Responsibilities:

Compare:

- transcript

vs

- feishu notes

Find:

- useful expressions not collected

---

### Feishu Sync

Responsibilities:

- sync notes
- incremental updates
- update expression weights

Feishu is source of truth.

---

## Layers

| Layer | Responsibility |

|---------|---------|

| app/ | Routes, pages |

| components/ | UI |

| services/ | Business logic |

| db/ | Database access |

| lib/ | External clients and utilities |

---

## Data Flow

Transcript Import

↓

Transcript Storage

↓

Expression Extraction

↓

Expression Library

↓

Review Generation

↓

User Recall

↓

Self Evaluation

↓

SRS Scheduling

↓

Next Review Queue

---

## Non Goals

Not responsible for:

- pronunciation scoring
- speech recognition
- grammar correction
- AI speaking evaluation

These are intentionally excluded.