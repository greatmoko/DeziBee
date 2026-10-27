# DeziBee

DeziBee 是一个独立的 Agent Skill，用于将产品需求整理为可交互 HTML 原型和同步的产品需求文档（PRD）。工作台包含页面导航、原型画布和 PRD 三栏，可在浏览器中编辑 PRD 并导出自包含的 HTML。

## 安装

将仓库克隆到支持 `SKILL.md` 的 Agent 的 Skill 目录，例如 Codex：

```sh
git clone https://github.com/greatmoko/DeziBee.git ~/.codex/skills/dezibee
```

在 Agent 中使用 DeziBee，并描述需要设计或迭代的产品需求。详细工作流程见 [SKILL.md](SKILL.md) 和 [设计指南](references/design-guide.md)。

## 运行

命令行助手需要 Node.js 18 或更新版本，无需 npm 安装依赖。创建一个新的工作台：

```sh
node scripts/workbench.cjs init /path/to/project
node scripts/workbench.cjs validate /path/to/project/demo/index.html
```

打开生成的 `demo/index.html` 查看原型。浏览器中的保存与导出使用系统“另存为”窗口，需要支持 `showSaveFilePicker` 的浏览器及其可用环境（例如 Chrome 或 Edge）；默认文件名带时间戳。也可以使用 CLI 导出：

```sh
node scripts/workbench.cjs export /path/to/project/demo/index.html /path/to/project/prototype.html
```

## 许可证

[MIT License](LICENSE)。
