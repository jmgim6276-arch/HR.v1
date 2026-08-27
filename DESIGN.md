---
name: 凯旋智聘
description: BOSS直聘招聘前链路自动化——打招呼、自动沟通、简历采集与人才库管理，一个侧栏完成
colors:
  iris-indigo: "#5b5bd6"
  iris-indigo-hover: "#4f4fce"
  iris-indigo-active: "#4444bd"
  iris-indigo-bg: "#eeeefb"
  accent-on: "#ffffff"
  gold-member: "#b08a3e"
  success: "#30a46c"
  warn: "#f5a623"
  danger: "#e5484d"
  bg: "#ffffff"
  surface: "#f6f7f9"
  surface-warm: "#fbfbfc"
  sidebar-bg: "#f7f8fa"
  fg: "#1c1d21"
  fg-2: "#3a3d44"
  muted: "#6b7280"
  meta: "#9ca3af"
  border: "#e8e9ee"
  border-soft: "#f0f1f4"
typography:
  display:
    fontFamily: "-apple-system, \"SF Pro Display\", \"Segoe UI\", Roboto, \"Helvetica Neue\", \"PingFang SC\", sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "-apple-system, \"SF Pro Display\", \"Segoe UI\", Roboto, \"Helvetica Neue\", \"PingFang SC\", sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, \"SF Pro Text\", \"Segoe UI\", Roboto, \"Helvetica Neue\", \"PingFang SC\", sans-serif"
    fontSize: "14px"
    lineHeight: 1.47
  label:
    fontFamily: "-apple-system, \"SF Pro Text\", \"Segoe UI\", Roboto, \"Helvetica Neue\", \"PingFang SC\", sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "\"SF Mono\", ui-monospace, \"JetBrains Mono\", Menlo, Monaco, Consolas, monospace"
    fontSize: "12px"
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
components:
  button-pill-primary:
    backgroundColor: "{colors.iris-indigo}"
    textColor: "{colors.accent-on}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-pill-primary-hover:
    backgroundColor: "{colors.iris-indigo-hover}"
    textColor: "{colors.accent-on}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-ghost:
    backgroundColor: "{colors.iris-indigo-bg}"
    textColor: "{colors.iris-indigo}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-danger:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  input-text:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    padding: "9px 12px"
  card-section:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "12px"
  stat-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    padding: "8px 4px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.fg-2}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  nav-item-active:
    backgroundColor: "{colors.iris-indigo-bg}"
    textColor: "{colors.iris-indigo}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  tag-vip:
    backgroundColor: "{colors.gold-member}"
    textColor: "{colors.gold-member}"
    rounded: "4px"
    padding: "2px 8px"
---

# Design System: 凯旋智聘

## Overview

**Creative North Star: 「macOS 原生工具」（The Native macOS Utility）**

凯旋智聘的界面应当像 macOS 自带应用：启动就在、零学习成本、绝不抢戏。用户是使用 BOSS直聘 的招聘者——不是技术人员——所以界面的一切复杂都必须消失在熟悉的系统感之后：SF Pro 原生字栈、柔和中性灰、一个克制的靛紫强调色。品牌（猫头鹰、凯旋智聘字标）活在精确的细节里，而不是大面积的色块里。

这是一套 Operate 型系统：用户来这里完成任务（开自动化、看运行状态、充值、导出人才库），扫读效率和一致性永远优先于表达欲。密度保持紧凑——侧栏宽度有限，运行状态要一屏看全。

**Key Characteristics:**
- 原生系统感：不引入网络字体、不用渐变、不用大面积品牌色
- 紧凑密度：正文 13–14px、间距 4–16px、统计格 5 列一屏
- 一个强调色：鸢尾靛负责所有"可点/激活/运行中"信号
- 轻环境影 + 状态抬升：卡片常驻淡影，只有弹层/模态获得深影
- admin 运营后台是同一语言的变体，允许更密更糙，但不另起炉灶

## Colors

调色板性格：柔和中性灰做底，鸢尾靛单一发声，功能色（金/绿/橙/红）各司其职。

### Primary
- **鸢尾靛（Iris Indigo）** (#5b5bd6)：唯一强调色。主按钮、激活导航、选中态、运行中指示、输入框聚焦。悬停加深 (#4f4fce)，按压再深 (#4444bd)，浅底 (#eeeefb) 用于选中/标签衬底。
- **靛上白（Accent On）** (#ffffff)：压在鸢尾靛上的文字与图标。

### Neutral
- **墨黑（FG）** (#1c1d21)：正文主色。
- **石墨（FG-2）** (#3a3d44)：次级文字、导航条目。
- **灰蓝（Muted）** (#6b7280)：辅助说明、字段标签。
- **银灰（Meta）** (#9ca3af)：最弱层级——时间戳、表头、分组标签。
- **纸白（BG）** (#ffffff)：主背景与卡片面。
- **雾面（Surface）** (#f6f7f9)：分区衬底、统计格、分段控件底。
- **暖雾（Surface Warm）** (#fbfbfc)：运行区、二维码卡片等需要"微暖"的衬底。
- **侧栏灰（Sidebar BG）** (#f7f8fa)：左侧导航专属衬底。
- **描边（Border）** (#e8e9ee) / **软描边（Border Soft）** (#f0f1f4)：卡片与分隔线两档。

### Functional
- **会员金（Gold Member）** (#b08a3e)：仅表示会员/付费身份（VIP 标签用 18% 透明底 + 金字）。
- **运行绿（Success）** (#30a46c)：成功状态、运行正常。
- **预警橙（Warn）** (#f5a623)：低余额预警、需要注意。
- **危险红（Danger）** (#e5484d)：错误、删除、停止类破坏性操作。

### Named Rules
**鸢尾靛唯一声部规则（The One Voice Rule）。** 任意一屏里，实心鸢尾靛只出现在一个主行动和必要的激活态上（导航选中、开关开启）。它的稀有就是它的信号价值；一片靛紫等于没有信号。

**金色专属规则（The Gold Reservation Rule）。** 金只表示"钱/会员身份"，永不用于装饰、评分星级或一般高亮。

## Typography

**Display/Body Font:** SF Pro 系统字栈（-apple-system → SF Pro Display/Text → Segoe UI → Roboto → PingFang SC）
**Mono Font:** SF Mono 字栈（SF Mono → ui-monospace → JetBrains Mono → Menlo → Consolas）

**Character:** 完全依赖操作系统自带字体——零加载时间、零跨平台惊喜，这正是"macOS 原生工具"的底色。中文回落 PingFang SC。

### Hierarchy
- **Display**（600, 19px, 行高 1.3, 字距 -0.01em）：页面级标题（section-title）。仅页首一处。
- **Title**（600, 15px）：卡片标题、模块名、计划名。
- **Body**（400, 14px, 行高 1.47）：正文与控件文字。紧凑是刻意的。
- **Label**（500, 12px, 色 Muted）：字段标签、辅助说明。
- **Mono**（400, 12px）：数字、统计值、状态行、时间戳、日志——配合 tabular-nums 等宽数字。

### Named Rules
**原生字栈规则（The Native Stack Rule）。** 永不引入网络字体。任何"更有个性的字体"都与北极星矛盾。

**数字等宽规则（The Tabular Figures Rule）。** 凡会跳变的数字（余额、计数、统计格）一律 mono 字栈或 `font-variant-numeric: tabular-nums`，防止布局抖动。

## Layout

**Shell 双栏**：左侧固定导航 220px（侧栏灰衬底 + 品牌头 + 分组菜单），右侧 iframe 内容区（纸白）。导航分组标签 10px 全大写、银灰色。

**页面单列**：内容页一律单列流式，内边距 16px，最小宽度 340px。卡片纵向堆叠，间距 12–16px。

**吸附结构**：运行控制区吸顶（sticky top，暖雾底 + 下描边）；主操作区吸底（sticky-footer，纸白底）。中间内容滚动。

**密度**：4/8/12/16 四档间距；统计格 5 列网格（窄屏降为 1 列）；模块卡片 3 列网格（窄屏 1 列）。

## Elevation & Depth

轻环境影 + 状态抬升。系统不是纯扁平——卡片常驻一层几乎不可察觉的淡影维持可读层次，但"抬升"只属于覆盖在内容之上的东西。

### Shadow Vocabulary
- **环境淡影（Ambient SM）**（`0 1px 2px rgba(20,21,26,0.06)`）：卡片、主按钮、选中标签的常驻影。
- **环境中影（Ambient MD）**（`0 4px 12px rgba(20,21,26,0.08)`）：需要略浮起的容器。
- **弹层抬升（Raised）**（`0 12px 32px rgba(0,0,0,0.08)`）：仅模态/弹层，配 `rgba(0,0,0,0.4)` 遮罩 + 4px 背景模糊。
- **聚焦环（Focus Ring）**（`0 0 0 4px color-mix(in oklab, accent, transparent 65%)`）：键盘/输入聚焦的唯一表达，与阴影体系分离。
- **品牌光晕（Logo Glow）**（`0 2px 6px rgba(91,91,214,0.35)`）：仅侧栏猫头鹰 logo。

### Named Rules
**弹层才抬升规则（The Lift-On-Overlay Rule）。** Raised 级阴影只给覆盖层。内容流里的元素最高到 Ambient MD——如果一张卡片"浮起来了"，那是 bug。

## Shapes

圆角阶梯：8px（输入框、基础按钮、标签、统计格）→ 10px（section 卡片、计划卡片）→ 12px（模块卡片）→ 14px（模态框）→ 999px 全圆（pill 按钮、徽章、Toast、开关）。

没有尖角，也没有除 pill 系以外的正圆。品牌 logo 用 9px 圆角的类 squircle。聊天气泡 18px 圆角带 4px 尾角（用户气泡尾在右下，机器人气泡尾在左下）。描边统一 1px（选中态计划卡片 1.5px）。

## Components

### Buttons
- **Shape：** 两代并存——pill 全圆角（999px，新代，一键运行页起）与基础圆角（8px，shared.css 老页）。**新页面一律用 pill。**
- **Primary：** 实心鸢尾靛 + 白字 + 环境淡影（8px 16px 内边距，13px/600）；hover 加深一档，按压 `translateY(0.5px)`，禁用 40% 透明。
- **Secondary：** 纸白底 + 描边 + 墨黑字；hover 换雾面底。
- **Ghost：** 鸢尾靛浅底 + 鸢尾靛字，用于次要的肯定动作。
- **Danger：** 纸白底 + 危险红字 + 描边；hover 浅红底 + 红描边。实心红仅留给 pill 代的强确认破坏动作。

### Switch
- 轨道式开关（50×28，紧凑版 36×20）：开启 = 鸢尾靛轨道，关闭 = 中性灰。模块卡片的总开关是核心控件。

### Cards / Containers
- **Section Card：** 纸白 + 1px 描边 + 10px 圆角 + 环境淡影 + 12px 内边距，纵向间距 16px。页面的基本组织单元。
- **Module Card：** 12px 圆角 + 14px 内边距，头部 = 模块名（15px/700）+ 开关，用于一键运行的三模块控制。
- **Stat Cell：** 雾面底 + 8px 圆角 + 居中，数值用 mono；5 列网格呈现运行统计。

### Inputs / Fields
- **Style：** 纸白底 + 1px 描边 + 8px 圆角 + 9px 12px 内边距；标签 12px/500 灰蓝色。
- **Focus：** 描边转鸢尾靛 + 4px 聚焦环，无 outline。
- **Error：** 描边转危险红 + 红色聚焦环，错误文案 11px 红、淡入动画。

### Navigation
- 侧栏条目（8px 圆角，13px/500，石墨色）：hover 淡黑底；**激活 = 鸢尾靛浅底 + 鸢尾靛字 + 600**。16px 线性图标，透明度 75%。
- 分段控件（Tabs）：雾面底槽，选中项 = 纸白浮起 + 鸢尾靛字 + 环境淡影 + 600。

### Modal / Toast / Badge
- **Modal：** 400px 宽、14px 圆角、弹层抬升影；遮罩 40% 黑 + 4px 模糊；头部/底部带软描边分隔。
- **Toast：** 墨黑底白字 pill，底部居中，0.3s 淡入淡出。
- **Badge / Tag：** pill 或 4px 小圆角，11px/600；VIP 标签 = 18% 金透明底 + 金字。

### 运营后台变体（admin）
- 同一语言的更密变体：强调色略深（#4b4ee0）、卡片圆角 16px、功能色同名换值（ok #2f9e6f / err #d64545）。允许更糙，禁止引入侧栏没有的新颜色/新圆角阶梯。

### 开发者控制台（dev-only）
- 深色面板（#1d1d1f 底）+ 霓虹日志色，仅开发者模式可见。**这套深色词汇只属于调试台，不构成产品的深色模式。**

## Do's and Don'ts

### Do:
- **Do** 新页面用 pill 主按钮 + section 卡片 + 紧凑间距，与一键运行页同代。
- **Do** 数字与运行状态一律 mono 字栈（等宽数字规则）。
- **Do** 每屏只放一个实心鸢尾靛主行动（唯一声部规则）。
- **Do** 聚焦态统一用 4px 鸢尾靛聚焦环，包括自定义控件。
- **Do** 会员/付费相关标记只用会员金（金色专属规则）。

### Don't:
- **Don't** 引入网络字体、渐变、大面积品牌色块——与「macOS 原生工具」矛盾。
- **Don't** 给内容流元素使用 Raised 级阴影（弹层才抬升规则）。
- **Don't** 编造深色模式：调试台的深色词汇不外溢，产品当前仅浅色。
- **Don't** 新增强调色或第五档功能色；现有 靛/金/绿/橙/红 已覆盖全部语义。
- **Don't** 放松密度：正文不小于 12px、间距不超出 4–16px 阶梯。
