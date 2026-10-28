# 原型框架-dezibee

把产品需求转成可交互 HTML 原型和同步 PRD 的 Skill。

## 核心功能

- **真实交互原型**：卡片内写真实 HTML/CSS/JS，按钮、表单、弹窗都能操作。
- **PRD**：画布是一级章节，卡片是二级章节（如 3.1、3.2）；业务规则区分前端规则和后台规则。
- **一键原型下载**：原型和PRD写好可以一键导出html文件,上传到tapd就能直接预览原型

## 组件说明

工作台分为三栏：左栏「画布导航」、中栏「画布详情」,每个独立视觉或交互状态是一张卡片。、右栏「产品需求说明书」。


## 安装

最简单（推荐）：打开市场详情页 → 点「复制安装提示词」→ 粘贴给你的 AI（DSH、Claude Code、Cursor、Codex、PI 等），它会一步步带你装好：

动手装：把 `dezibee` 文件夹直接复制到对应软件的 skills 目录，新开一个会话，输入 `/dezibee` 或直接描述需求。

| 软件 | skills 目录 |
|---|---|
| Cursor | `~/.cursor/skills/` |
| Claude Code | `~/.claude/skills/` |
| PI | `~/.pi/agent/skills/` |
| OpenAI Codex CLI | `~/.agents/skills/` |
| ZCode | `~/.zcode/skills/` |
| DSH | `~/.dsh/skills/` |

Windows 下 `~` 指 `%USERPROFILE%`。复制后确认目录里有 `dezibee/SKILL.md`。ChatGPT 没有本地 skills 目录，用上面的安装提示词，或把 `SKILL.md` 上传到 Project/自定义 GPT。

## 怎么用

新开一个会话，输入 `/dezibee`，或直接描述需求，例如「用 dezibee 做一个登录页原型，手机端」。

建议一次说明：

- 需求和目标
- 目标设备：手机 375×812、平板或桌面
- 参考截图、现有页面或竞品
- 关键业务规则，尤其是后台校验、状态变更、权限、频率限制


## 目录

```text
dezibee/
├─ SKILL.md                   # Agent 工作流
├─ README.md
├─ references/design-guide.md # 详细规范
├─ assets/template/           # 工作台模板（index.html 为内联入口）
└─ scripts/
   ├─ workbench.cjs           # 初始化/校验/应用/导出
   └─ build-template.cjs      # 重建模板入口
```

## 说明

- 浏览器保存/导出会下载新文件，不会覆盖原始 HTML。
- 流程图由 Agent 用 HTML/SVG 绘制，不是自动生成。
- `validate` 只做静态校验，视觉和交互仍需在浏览器中检查。

## License

MIT，Copyright (c) 2026 Mike。
