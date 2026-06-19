# Design System

永远只记录：视觉设计规范。

---

# Design Principle

Echo Speaker 是语言收藏工具。

不是：

* Duolingo
* Quizlet
* Anki
* SaaS Dashboard

风格关键词：

* Quiet
* Literary
* Vintage
* Paper
* Human

用户感受：

> 像翻阅自己的语言摘抄本，而不是刷题软件。

---

# Device Priority

Primary:

* iPhone 15 Plus

Design Width:

* 390px–430px

原则：

* Mobile First

Desktop:

* 使用居中移动端容器
* max-width: 430px

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

* 视频标题
* 主题标题
* 分类标题

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

* 300
* 400
* 500
* 600

Forbidden:

* 700+
* Extra Bold
* Black

---

# Text Color

Only:

```css
#FFFFFF
#222222
```

根据背景自动选择。

禁止：

* 彩色文字
* 灰色文字

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

* 新增颜色
* 品牌蓝
* 高饱和颜色

---

# Surface

所有卡片：

* Matte
* Flat
* Paper-like

禁止：

* Gradient
* Glassmorphism
* Neumorphism
* Glow
* Neon
* Metallic
* 3D

---

# Texture

所有卡片默认添加：

Paper Texture

效果：

* 轻颗粒
* 微噪点
* 牛皮纸质感
* 手工纸质感

参考：

* Recycled Paper
* Kraft Paper
* Art Paper

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

Front:

```text
Expression
```

Back:

```text
Meaning

Example

Source
```

---

# Review Rating

用户手动评分：

```text
熟练掌握
需再复习
没印象
```

对应：

```text
easy
again
forgot
```

系统据此更新 SRS。

不使用录音评分。

不使用 AI 口语评分。

---

# Motion

Allowed:

* Fade
* Opacity Transition

Duration:

```css
150ms - 200ms
```

Forbidden:

* Bounce
* Spin
* Particle
* Complex Animation

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

# Non-Negotiable

禁止：

1. 修改字体体系
2. 修改配色体系
3. 引入新颜色
4. 使用渐变
5. 使用毛玻璃
6. 使用 Dashboard 风格
7. 使用游戏化设计

所有视觉决策优先级：

Readability > Consistency > Beauty
