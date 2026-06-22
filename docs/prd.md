# Echo Speak

永远只记录：产品要干什么。

## Product Vision

Help users turn English input into active speaking ability.

The goal is not collecting vocabulary.

The goal is recalling useful expressions when speaking.

---

## Target User

Primary User:

Ying (solo learner)

Learning source:

- YouTube Vlogs

- Lifestyle videos

- Daily English

- Workplace English

Current workflow:

1. Watch YouTube

2. Export transcript

3. Take notes in Feishu

4. Collect useful expressions

5. Forget most of them later

Echo solves step 5.

---

## Core Workflow

Transcript

+

Feishu Notes

↓

Expression Library

↓

Review Question Generator

↓

Active Recall

↓

Self Evaluation

↓

Spaced Repetition

↓

Long-term Memory

---

## Core Features

### 1. Transcript Import

Input:

- txt

- srt

- transcript text

Output:

- cleaned transcript

- transcript stored

---

### 2. Feishu Note Sync

Sync:

- useful expressions

- vocabulary

- notes

Feishu remains source of truth.

---

### 3. Expression Extraction

Extract:

- phrases

- collocations

- sentence patterns

Store:

- source sentence

- translation

- topic

- difficulty

---

### 4. Active Recall Review

双面纸质收藏卡（见 `docs/design-system.md`）。

**Front（中文 → 回忆英文）：**

- `meaning`（中文含义）
- `example_zh`（例句中文）

**Back（核对）：**

- `phrase`（Expression）
- `example_en`（完整英文句）

用户翻转卡片后点击评分（纯英文 UI）：

- mastered
- again
- unsure

No speech recognition. No AI scoring.

---

### 5. Review Modes

#### Video Review

Review expressions from one video.

Example:

Sydney Serena

→ What I Eat In A Day

---

#### Topic Review

Review expressions from many videos.

Example:

- Food

- Workout

- Shopping

- Travel

- Productivity

---

### 6. Spaced Repetition

mastered

→ review later

again

→ review soon

unsure

→ review immediately

---

### 7. Gap Detection

Compare:

Transcript

vs

Feishu Notes

Find:

Useful expressions user missed.

---

## Not In Scope

- AI pronunciation scoring

- Speaking assessment

- Grammar correction

- Social features

- Public sharing

- Multi-user support