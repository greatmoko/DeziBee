# DeziBee

**让产品需求、可交互原型和 PRD 在同一个工作台里协作。**

DeziBee 是一个开源的 Agent Skill，帮助产品经理、设计师和开发者将需求整理成可在浏览器中打开的 HTML 原型，并维护与页面关联的产品需求文档。它可以独立使用，无需安装 BeeHive 或运行专门的后台服务。

## 你可以用它做什么

- **设计交互原型**：用真实 HTML、CSS 和 JavaScript 展示页面、表单、弹窗和不同界面状态。
- **维护同步 PRD**：在三栏工作台中查看页面导航、原型画布和需求文档，通过关联定位对应内容。
- **和 Agent 一起迭代**：描述业务需求或修改意见，让支持 `SKILL.md` 的 Agent 按项目现有风格生成或调整原型。
- **保存和分享**：在浏览器中编辑 PRD，另存为带时间戳的 HTML；也可通过命令行导出自包含文件。
- **支持多种设备**：模板提供手机、平板和桌面画布尺寸，适合展示不同设备上的页面设计。

## 快速开始

### 1. 安装 Skill

将仓库克隆到支持 `SKILL.md` 的 Agent 的 Skill 目录。以 Codex 为例：

```sh
git clone https://github.com/greatmoko/DeziBee.git ~/.codex/skills/dezibee
```

其他 Agent 可将本仓库复制到其 Skill 目录；具体加载方式请参照该 Agent 的文档。

### 2. 描述你的需求

在 Agent 中调用 DeziBee，例如：

> 使用 DeziBee 为一个任务管理产品设计桌面端原型，包含任务列表、新建任务弹窗和对应 PRD。请沿用项目现有的界面风格。

Agent 会根据需求创建工作台并交付 `demo/index.html`。用浏览器打开该文件，即可查看原型和 PRD。已有工作台也可以继续交给 Agent 迭代。

### 3. 手动创建工作台（可选）

命令行工具使用 Node.js 内置模块，建议使用 **Node.js 18 或更高版本**，无需 `npm install`。在本仓库目录运行：

```sh
node scripts/workbench.cjs init /path/to/project
node scripts/workbench.cjs validate /path/to/project/demo/index.html
```

将 `/path/to/project` 替换为你的输出目录。初始化会创建 `demo/`、`prd/` 和 `uploads/`；如果 `demo/` 已存在，工具会拒绝覆盖。

## 编辑、保存与导出

打开工作台后，右侧 PRD 支持浏览器内编辑。点击**保存**或画布中的**导出**，浏览器会打开系统“另存为”窗口，让你选择位置和文件名；默认文件名包含本地时间戳。取消保存会保留当前编辑内容。

浏览器保存依赖 `showSaveFilePicker`，需要支持该接口的浏览器及运行环境，例如 Chrome 或 Edge。不支持时可以使用命令行导出：

```sh
node scripts/workbench.cjs export /path/to/project/demo/index.html /path/to/project/prototype.html
```

导出会尝试内联本地素材；输出文件已存在时会拒绝覆盖。若后续交给 Agent 继续修改，请提供最新保存的 HTML 文件，避免遗漏浏览器中的编辑。

## 工作原理

工作台的数据保存在 `demo/index.html` 的 `WORKBENCH_DATA` 中。页面、原型卡片、连线和 PRD 章节使用 ID 建立关联，Agent 根据这些数据维护界面与文档。原型中的具体交互需要在卡片自身实现；画布连线不会自动替代页面内的按钮逻辑。

`validate` 可以检查数据结构、ID、关联关系和部分 HTML / JavaScript 语法。静态校验不能代替浏览器中的视觉和交互检查。

## 项目结构

```text
├── SKILL.md                    # Agent 使用说明
├── assets/template/            # 工作台模板及框架源码
├── references/design-guide.md  # 设计与数据规范
├── scripts/workbench.cjs       # 创建、检查、修改和导出工具
├── scripts/build-template.cjs  # 将框架源码重新内联到模板
└── LICENSE                     # MIT 许可证
```

更多工作流、命令与边界说明请参阅 [SKILL.md](SKILL.md) 和 [设计与数据规范](references/design-guide.md)。

## 参与社区

欢迎提交 [Issue](https://github.com/greatmoko/DeziBee/issues) 反馈问题、分享使用场景或提出建议，也欢迎通过 Pull Request 改进文档、模板和工具。提交问题时，尽量提供复现步骤、运行环境和预期结果；分享原型或日志前请先移除敏感信息。

## 许可证

本项目采用 [MIT License](LICENSE)。
