# Design System

永远只记录：视觉设计规范。

---

# Design Principle

Echo Speaker 是语言收藏工具。

不是：

- Duolingo
- Quizlet
- Anki
- SaaS Dashboard

风格关键词：

- Quiet
- Literary
- Vintage
- Paper
- Human

用户感受：

> 像翻阅自己的语言摘抄本，而不是刷题软件。

---

# Device Priority

Primary:

- iPhone 15 Plus（逻辑视口 **430 × 932** CSS px）

Design Width:

- 390px–430px（Plus 系列为 430px）

Design Height（桌面预览手机框）:

- **932px**（与 iPhone 15 Plus 逻辑高度一致；真机用 `100vh` 随浏览器 UI 变化）

原则：

- Mobile First

Desktop:

- 使用居中移动端容器
- max-width: **430px**
- min-height: **932px**（`md:` 断点；不超过视口时随 `100vh` 收缩）

不单独设计 Desktop Layout。

---

# Typography

## English

Body:

```css
Inter Light
sans-serif
```

Title:

```css
Montserrat Thin Italic
Didot
Antic Didone
```

仅允许用于：

- 视频标题
- 主题标题
- 分类标题

---

## Chinese

Body:

```css
Source Han Serif CN Light
Songti SC
```

UI:

```css
Source Han Sans CN Light
```

---

## Weight

Allowed:

- 300
- 400
- 500
- 600

Forbidden:

- 700+
- Extra Bold
- Black

---

## Page Hint（PageHeader）

全站页面顶部的单行说明（`PageHeader` 组件）。

字体：

```css
Playfair Display
Didot
Songti SC
Georgia
serif
```

规格：

- **单行** · 禁止换行（`whitespace-nowrap`）
- 默认 `1.0625rem`（17px）· `font-normal` · `#222222` · 居中
- 若一行放不下：在 `1.0625rem` → `0.6875rem`（11px）之间**逐步缩小字号**，仍保持单行（`PageHeader` 客户端测量 + `ResizeObserver`）
- **无**背景色、边框、圆角或阴影（开放排版，非 Dashboard 卡片）
- 文案下方：**星形分隔线** — 左右各一段细横线（`1px` · `#222222`）+ 中央四角星（solid fill）；横线总宽度与上方文案块同宽（左端对齐首字、右端对齐末字）

参考：`docs/design/page-hint-banner-ref.png`（Import 页示意）

实现：`src/components/PageHeader.tsx`

---

# Text Color

Only:

```css
#FFFFFF
#222222
```

根据背景自动选择。

禁止：

- 彩色文字
- 灰色文字

必须保证可读性。

---

# Card Palette

系统随机选择。

```css
#BFB99F
#E0DBC8
#C8C0A9
#9A947C
#222222
#DCD9CF
#6B4242
#A06C5E
#C49486
#573838
#B88F6E
#D4BC9A
#B9A26F
#E2D2B0
#798892
#4A5863
#A1B0B9
#5F6E7A
#735F70
#A898A5
#523F4F
#B0B9A4
#8A967C
#5C684E
#D9CFC1
```

禁止：

- 新增颜色
- 品牌蓝
- 高饱和颜色

---

# Surface

所有卡片：

- Matte
- Flat
- Paper-like

禁止：

- Gradient
- Glassmorphism
- Neumorphism
- Glow
- Neon
- Metallic
- 3D

---

# Texture

所有卡片默认添加：

Paper Texture

效果：

- 轻颗粒
- 微噪点
- 牛皮纸质感
- 手工纸质感

参考：

- Recycled Paper
- Kraft Paper
- Art Paper

透明度保持极低。

纹理只能增强质感。

不能影响阅读。

---

# Card Structure

## Expression Card

```text
Source

Topic

Expression

Meaning

Example

Personal Note (optional)
```

---

## Review Card

Phase 4 完整规范见下方 **Review Page** 与 **Review Card** 章节。

摘要：双面纸质收藏卡；正面中文回忆、背面英文核对；Tarot / Vintage Paper 风格。

---

# Review Page

## Experience Goal

目标不是做成 Anki 或 Quizlet。

核心体验：

> 用户像在现实世界中抽取自己的语言收藏卡片，而不是在使用刷题软件。

视觉参考：

- Tarot Card
- Vintage Paper Card
- Literary Notebook
- Language Collection Archive

参考图：

- `docs/design/phase-4-review/references/tarot-ace-of-cups-ref.png`

---

## Page Structure

自上而下：

```text
Navbar
Page hint（PageHeader · serif + star divider）
Mode selector（Video / Topic）或 active mode bar
Review card 或 empty-state decoration
```

Page hint 规范见 **Typography → Page Hint**。

---

# Import Page

## Experience Goal

不是后台录入表单，而是**向个人语言档案馆添加一份新收藏**的仪式。

核心体验：

> 像在纸面信笺上填写元数据、盖章归档，而不是提交 SaaS 表单。

视觉参考：Literary letter paper · book stack illustration · sticky-note actions。

---

## Page Structure

自上而下：

```text
Navbar
Page hint（PageHeader · serif + star divider）
ImportPaperShell（letter-paper.jpeg · flex-1 · overlay layout）
  ├─ Line fields（Title · YouTube URL · absolute slots）
  ├─ File picker row（Choose File + pen icon）
  ├─ Sticky-note actions（Import · Extract after success）
  ├─ Transcript textarea（on paper lines）
  └─ ImportPaperReceipt（书堆右侧回执 overlay）
```

布局：`PageShell` main 使用 `flex min-h-0 flex-1 flex-col`；信纸 `aspect-ratio: 736/1069` · `max-h-[calc(100vh-12rem)]` · iPhone 15 Plus（430×932）校准。

---

## Paper Shell

- 背景图：`public/import/letter-paper.jpeg`（736×1069）
- `background-size: cover` · 绝对定位 overlay 表单控件
- 无回形针 · 无 CSS 横线 · 无独立底部文件夹插画
- 行距校准：`src/lib/import-letter-layout.ts`

---

## Line Field

- Label：`Playfair Display` · `0.8125rem` · `#222222` · absolute slot
- Input：透明 · 无边框 · 对齐纸面已有横线 · `leading-[1.65rem]`
- Body 输入：`Inter` / system sans

---

## File Picker

- Label：`Upload .txt or .srt`
- 可见行：`Choose File (No files selected)` 或 `Choose File ({name})`
- 右侧：`pen-button.png`（透明 PNG）
- 整行可点击 · 无浏览器默认 file 按钮样式

---

## Lined Textarea

- Label：`Or paste transcript`
- 无 CSS 横线 · 使用信纸背景已有线条
- Textarea 透明 · absolute slot · 与纸面行距对齐

---

## Sticky-Note Button

Import / Extract 专用（Review 页仍用 `#E0DBC8` HighlighterButton）。

| 属性 | 值 |
|------|-----|
| 背景图 | `public/import/sticky-note.png` |
| Import | 全宽 · `h-12` |
| Extract | 全宽 · `h-10` · Import 成功后显示 |

实现：`src/components/import/StickyNoteButton.tsx`

---

## Paper Receipt（书堆右侧回执）

Import / Extract 结果叠在信纸左下角书堆右侧空白区：

- **Import 成功**：`Transcript saved.`（不展示 UUID）
- **Duplicate**：API 错误文案 + `Existing video: {title}` + Topics 链接
- **Extract 成功**：`Extracted N expression(s).` + Topics 链接

文案：`Playfair Display` · 左对齐 · `text-xs` · absolute slot `receiptZone`

实现：`src/components/import/ImportPaperReceipt.tsx`

---

## Mode Selector

位置：Page hint 下方。

初始状态 — **上下两个**可点击区域，用户**必须先选择模式**：

| 位置 | 结构 | Label |
|------|------|-------|
| Top | 全圆角胶囊（图标 + 文字居中，图标在矩形内） | Video Mode |
| Bottom | 全圆角胶囊（图标 + 文字居中，图标在矩形内） | Topic Mode |

文案：`text-base` · 图标与文字 `justify-center`

素材（图标在胶囊内左侧）：

- Video Mode：`microphone-button.png`
- Topic Mode：`mic-button.png`

进入复习后 — 同一区域变为：

| 位置 | 结构 | Label |
|------|------|-------|
| Left | 全圆角胶囊 | `Video Mode Now` 或 `Topic Mode Now`（取决于当前模式） |
| Right | 全圆角胶囊（可点击） | Back |

`Back` 返回模式选择初始状态。

---

## Empty State Decoration

**仅**在以下情况展示装饰图（未进入刷卡态时不隐藏）：

- 用户尚未选择 Video / Topic 模式，或
- 已选模式但当前无待复习卡片

出现卡片复习时**不显示**字母背景。

素材：`docs/design/phase-4-review/sources/review-background-alphabet.png`

要求：

- Full width
- 背景透明，融入页面（非白底块）
- **文档流布局**：位于 mode selector / scope picker **下方**
- 初始选模式页：字母图 **flex-1 填满** 按钮下方至 main 底部剩余高度（`object-contain` · 底对齐）
- 其他 empty 态：高度 `max-h-[min(38dvh,400px)]`
- 不遮挡、不干扰 mode selector 与后续 card 区域
- 作为 quiet 装饰，非内容层

---

## Review Experience Principle

Review 页面应让用户感觉：

> 我正在翻阅自己积累多年的语言摘抄卡。

而不是：

> 我正在完成一组学习任务。

本页视觉决策优先级：

```text
Memory Recall
→ Physical Card Feeling
→ Readability
→ Beauty
```

---

# Review Card

重构现有 Review Card。目标：让用户感觉自己正在抽取真实纸质卡片。

视觉参考：`docs/design/phase-4-review/references/tarot-ace-of-cups-ref.png`

---

## Card Structure

```text
┌─────────────────┐
│                 │
│                 │
│    Main Area    │
│                 │
│                 │
├─────────────────┤
│  Bottom Area    │
└─────────────────┘
```

要求：

- 纸张质感
- Tarot Card 风格
- 保持 Quiet / Literary
- 不是 Modern App Card 或 Dashboard Card

---

## Background Color

从 **Card Palette** 随机选择。

禁止新增颜色。

文字颜色在 `#FFFFFF` / `#222222` 间自动选择以保证可读性。

---

## Border

完整边框：

```css
1px solid
```

风格：Vintage · Delicate · Printed Card

圆角极小，更接近真实卡片，不是大圆角 Dashboard Card。

---

## Texture

继承 **Paper Texture**：

- 微颗粒
- 低透明度
- 不影响阅读

---

## Card Shadow

允许极弱阴影，营造纸卡堆叠感。

禁止：浮夸阴影 · Material Design 式 elevation。

---

## Card Size

占据页面主要视觉区域。

建议：`65%–75%` viewport height（在 430px 手机容器内折算）。

目标感受：

> 我正在手里拿着一张语言卡片。

---

## Card Interaction

支持 Front / Back 双面卡。

翻转动画：`150ms–200ms`，安静克制。

禁止炫技动画。

点击卡片主体（非背面评分区）切换正反面。

---

## Front Side

目标：中文 → 英文回忆。用户先看到中文，通过中文回忆英文表达。

### Main Area

```text
中文表达
中文例句
```

| 类型 | 第一行（数据） | 第二行（数据） |
|------|----------------|----------------|
| 单词 / 短语 | `expressions.meaning` | `expressions.example_zh` |

要求：居中 · 视觉焦点 · 大字号 · 充足留白

`example_zh` 来源见 `docs/database.md`（从 `transcripts.raw_text` 英中块对齐；失败时 DeepSeek 单句补译）。

### Bottom Source Area

横线分隔。显示：

- Video Mode → `Video Title`
- Topic Mode → `Topic Name`

### Interaction

点击卡片任意位置（Main + Source 区域）→ **Flip To Back**

---

## Back Side

目标：检查是否成功回忆。

### Main Area

```text
Expression
Full English Sentence
```

| 展示 | 数据 |
|------|------|
| Expression | `expressions.phrase` |
| Full English Sentence | `expressions.example_en` |

- Expression 较大
- Sentence 次级

### Bottom Action Area

横线分隔。三列等宽，**纯英文** label：

```text
mastered | again | unsure
```

禁止在此区域使用中文 label。两条竖线分隔；边框风格与卡片外框一致。

### Interaction

- 点击三列之一 → 评分并进入下一张（见 Review Rating Actions）
- 点击评分区以外任意位置 → **Flip To Front**（同一卡片）

---

# Review Rating

用户手动评分（实现与 API 以 design-system 为准）：

```text
mastered
again
unsure
```

背面 Action Area **仅展示上述英文**。

语义对照（文档 / 日志，不出现在背面 UI）：

```text
熟练掌握 → mastered
需再复习 → again
没印象了 → unsure
```

系统据此更新 SRS（Phase 5 调度；Phase 4 先持久化评分）。

不使用录音评分。不使用 AI 口语评分。

---

# Review Rating Actions

## mastered

行为：Update SRS · Show Next Card

视觉反馈：按钮区域极短烟花效果；不遮挡内容；给予完成感。

## again

行为：Update SRS · Show Next Card

视觉反馈：自按钮位置浮起 `+1` 后消失；表示 Need One More Review。

## unsure

行为：Update SRS · Show Next Card

视觉反馈：按钮区域轻微局部雨滴动画；克制，不影响阅读。

---

# Motion

Allowed:

- Fade
- Opacity Transition
- Card Flip（Review Card 正反面，150–200ms）

Duration:

```css
150ms - 200ms
```

Forbidden:

- Bounce
- Spin
- Complex Animation
- 全屏 Particle 轰炸

### Phase 3.5 exception: trash dismiss easter egg

When user drag-drops an expression to the topic-dock trash, the system MAY play a **brief, optional** confetti or paper burst **once per session or sporadically** — not on every delete. Primary feedback remains 150–200ms opacity fade. Celebration must not block interaction or dominate the quiet aesthetic.

### Phase 4 exception: review rating feedback

On `/review` back-side rating only:

| Rating | Allowed feedback |
|--------|------------------|
| mastered | 极短、局部的烟花/纸屑（按钮区域内） |
| again | `+1` 浮起消失 |
| unsure | 极短、局部的雨滴（按钮区域内） |

所有反馈：`150ms–200ms` 量级，不遮挡卡片正文，不构成成就系统或游戏化主界面。

Primary motion 仍为 Fade / Opacity / Card Flip。

---

# Home Page

**Route:** `/`

Layout order (430×932):

1. Page header tagline (unchanged)
2. Divider
3. **Import transcript** → `/import`
4. **Start review** → `/review`
5. `Hello.jpeg` illustration (transparent, bottom)

Assets: `public/home/`

---

# Collections Page

**Route:** `/collections` (redirects from `/topics`, `/library`)

- Description: `Build your personal library of natural English expressions.`
- Tabs: **Topic | Video | All** in `title.jpeg`; default Topic; active tab floats
- **Topic L1:** tree + New topic + bin/move; `arrow.jpeg` expand/collapse + rotate; `target.png` on leaf topics only
- **Topic L2 / Video L2:** cards in `Rectangle.jpeg`; phrase, meaning, example_en, example_zh
- **Video L2 header:** italic video title left, back right
- **All view:** `共 N 个 video ｜ M 条 expressions` + back → Topic L1
- **Move:** paper modal (`paper.jpeg`) — not inline dropdown

Assets: `public/collections/`

---

# Settings Page

**Route:** `/settings`

- Page description: `Sign in to save your own keys. The site provides the shared database.`
- **Auth strip:** email magic link (5 min OTP); sign-out when authenticated
- **LLM block** (3 fields): decorative `frame.png` + `input.png`; hints — `Use your own API keys. AI features won't work if left empty.`
- **Feishu block** (2 fields): same frames; hints — `Use your own Feishu app credentials. Feishu sync won't work if left empty.`
- Label `KEY:` then `gap-[1ch]` then value; empty → placeholder `请输入` (muted)
- Secret fields: password mask + eye reveal toggle
- **Save settings** button; success message centered below button
- **Not in UI:** Supabase URL/anon, service role (deployment env only)

Assets: `public/settings/` (`frame.png`, `input.png`)

---

# Review Finish

Shown when user completes a review session:

- Copy: `You have completed.` + link `choose another mode` → mode selector
- Hero: `congrats.jpeg` (transparent) below copy
- **Back** from finish → scope picker (not mode selector)

---

# Accessibility

必须通过：

WCAG AA

字体颜色自动在：

```css
#FFFFFF
#222222
```

之间选择。

优先保证阅读性。

---

# Phase 4 Review Assets

Review 页视觉素材与代码位置：

| 用途 | 路径 |
|------|------|
| 参考图（不上线） | `docs/design/phase-4-review/references/` |
| 原始 PNG 素材 | `docs/design/phase-4-review/sources/` |
| 线上静态资源 | `public/review/` → URL `/review/...` |
| Review 组件 | `src/components/review/` |

详见 `docs/design/phase-4-review/README.md`。

位图（麦克风、字母背景）用静态 URL；塔罗参考图仅作版式对照，不打包。

---

# Non-Negotiable

禁止：

1. 修改字体体系
2. 修改配色体系
3. 引入新颜色
4. 使用渐变
5. 使用毛玻璃
6. 使用 Dashboard 风格
7. 使用游戏化设计（Review 评分反馈见 Motion Phase 4 exception）

全局视觉决策优先级：

Readability > Consistency > Beauty

Review 页优先级（`/review` 内覆盖全局顺序）：

Memory Recall > Physical Card Feeling > Readability > Beauty