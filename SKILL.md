---
name: dezibee
description: 将产品需求转为可交互 HTML 原型和同步 PRD，使用自带三栏工作台展示页面导航、原型画布及需求文档。适用于产品设计、页面状态设计、原型迭代和 PRD 修改。
---

# DeziBee

担任产品经理、UX/UI 设计师和原型工程师。交付可在浏览器打开的真实交互原型，以及与页面、卡片通过 ID 关联的 PRD。沿用用户项目已有组件、主题、布局、字号、间距和交互规范。

## 运行条件与范围

本目录可整体复制给支持 SKILL.md 的 Agent；无需 BeeHive、桌面应用、MCP 服务、Python 或 npm 包。命令助手只依赖电脑已有的 Node.js（建议 18+）。先执行 `node --version`。若没有 Node.js，仍可复制模板并使用宿主文件工具编辑严格 JSON，但必须说明未执行程序校验，不得宣称验证通过，也不要自行安装软件。

所有路径相对本 Skill 所在目录定位，不假设当前工作目录。下文 `<skill>` 代表包含本文件的绝对目录，`<project>` 代表用户指定的原型输出目录。命令中路径加引号。不要把用户产物写回 Skill 的 assets。只修改本次输出目录内的文件；uploads 中参考材料只读。宿主 Agent 的授权边界继续适用。

本 Skill 不提供 BeeHive 的需求列表、会话记录、模型配置和审批界面。原型自带浏览器 PRD 编辑和单文件导出：保存和导出均先打开系统“另存为”窗口，让用户选择位置和文件名，默认文件名带本地时间戳；导出包含尚未保存的 PRD 编辑。取消窗口时保留编辑状态，文件写入成功后才结束编辑并提示成功；后续由 Agent 继续编辑时，应使用用户保存后的最新文件，避免覆盖手动修改。无需 BeeHive 本地服务。

## 工作流程

1. 理解本次目标、设备、参考材料及业务约束。存在多种明显不同的产品方向时，用宿主提问工具澄清；没有提问工具就直接提问。已明确的内容不重复确认。未知负责人、版本、业务数字标注待补充，不编造规则。
2. 首次设计先读 [设计与数据规范](references/design-guide.md)，检查用户项目相似页面与主题。新建原型运行：

   ```sh
   node "<skill>/scripts/workbench.cjs" init "<project>"
   ```

   该命令从自带 assets/template 复制到 `<project>/demo/`，并创建 prd、uploads；已有 demo 时拒绝覆盖。若已有工作台则直接定位编辑。
3. 工作台三栏分别对应 `pages[]` 导航、`pages[].cards[]` 原型卡片、`prd.sections[]` 文档。唯一数据源是 `demo/index.html` 中的 `WORKBENCH_DATA`，使用严格 JSON，不写 JS 表达式、注释、模板字符串或尾逗号。不要改动公共框架 CSS/JS。
4. 第一页为需求概述，业务页面从第二页开始。每个独立视觉或交互状态一张卡片，内容写真实 HTML/CSS/JS，禁止截图代替界面。按钮可点击、表单可输入、弹窗可开关；在原型中呈现用户需要的演示结果，不调用真实生产接口。多卡片流程可用 links 表达；iframe 内演示交互在卡片自身实现，不能假设 links 自动绑定按钮。
5. 原型和对应 PRD 同步维护，页面、卡片、章节与连线 ID 全局唯一。每张卡片的 prdId 指向现有章节，章节内 data-card-ref 指向卡片。PRD 仅改请求的章节时，不改页面和卡片。保留事实、数字、字段名、接口名、验收条件和用户意图。
6. 字段、按钮与同类组件保持对齐和统一；按钮通常右对齐，输入框固定宽度。不主动往原型交互界面增加功能说明、参数解释等文案；输入提示和用户要求的说明除外。PRD 中写清必要的产品规则。
7. 完成后静态校验一次；若宿主有浏览器能力，打开实际输出检查三栏布局、页面切换、卡片与 PRD 双向定位、关键表单和按钮。静态通过不代表视觉或交互通过；缺少浏览器能力时明确未验证范围。
8. 交付 demo/index.html 的可打开路径，概述本轮页面、状态与 PRD 变更。需要单文件时点击网页中的导出按钮或执行 export；需要静态部署时整体复制 demo/。不替用户发布或上传。

## 定位和修改

```sh
node "<skill>/scripts/workbench.cjs" inspect "<project>/demo/index.html"
node "<skill>/scripts/workbench.cjs" read "<project>/demo/index.html" --cards card-overview
node "<skill>/scripts/workbench.cjs" read "<project>/demo/index.html" --pages page-overview --sections sec-overview
node "<skill>/scripts/workbench.cjs" validate "<project>/demo/index.html"
```

先索引，再按卡片、页面或章节读取完整区域。读取已有目标 PRD 章节后才改它；本轮已读原文直接复用，不逐行分页反复拼接整份文件。

- 新建或修改页面结构：生成完整数据对象到 `<project>/workbench-data.json`，执行 `apply INDEX DATA.json`，只替换 index.html 数据区，其他框架逐字保留。已有工作台必须先读取完整数据以保留无关内容，或使用宿主精确文本编辑工具局部修改，避免用片段覆盖完整数据。工作数据文件按项目约定保留或清理。
- 仅改卡片 HTML：写替换数组到 `<project>/card-edits.json`，执行 `edit-cards INDEX EDITS.json`。每项为 `{"card_ids":["card-overview"],"old_string":"原文","new_string":"替换文本","expected_count":1}`。全部匹配并通过校验才提交；失败不部分写入。
- 仅改 PRD：优先宿主精确编辑工具修改目标章节。JSON 字符串内 HTML 必须正确转义，尤其 `<` 建议写成 `\u003c`，禁止原始 `</script>` 截断外层数据脚本。
- 同一文件顺序编辑，锚点失败重新定位一次，仍失败就报告具体问题。不要循环读取已确认区域。
- `apply` 或 `edit-cards` 成功已包含静态校验；无需对同一版本再次校验。宿主工具修改后调用 validate。

## 浏览器编辑与单文件导出

模板入口已内联公共 CSS 和 JavaScript，可直接用浏览器打开。右栏点击「编辑」修改 PRD，点击「保存」选择位置并保存最新 HTML；「取消」放弃本次未保存修改。画布顶栏「导出」同样生成可再次打开和编辑的单文件。原型内部点击联动本版不扩展，原有页面切换与卡片标题选择仍按 ID 关联 PRD。

为保证 file:// 下也能保存和导出，素材优先写 data URI；使用本地相对素材时，Agent 先用下述 CLI 导出为自包含文件再交付。浏览器不能读取相对素材时会报错，不应声称导出成功。浏览器保存与导出依赖 `showSaveFilePicker`，需使用支持该接口的 Chrome 或 Edge；不支持时显示错误，不回退到直接下载。保存窗口应在用户点击后的首次异步操作中打开，避免打包素材消耗用户激活状态。让 Agent 读取保存后的最新文件继续迭代。

命令行导出仍可用：

```sh
node "<skill>/scripts/workbench.cjs" export "<project>/demo/index.html" "<project>/prototype.html"
```

使用本地相对路径，素材放 demo/assets/；禁止 CDN、在线字体、远程图片或依赖服务端的业务逻辑。导出内联 CSS、JS 和本地素材，遇到无法内联的资源应处理错误而非交付缺资源文件。输出文件若已存在，先选择新文件名或获得用户明确覆盖指示。

## 设计细节

设备尺寸、壳层、页面排序、PRD 编号、引用格式和画布交互见 [references/design-guide.md](references/design-guide.md)。只在需要相应细节时读取。手机 375×812/phone，平板 820×1180/tablet，桌面 1440×900/browser；按真实 CSS 像素设计，不缩小内容凑画布，壳与状态栏由模板绘制。

维护模板框架源码后，运行 `node "<skill>/scripts/build-template.cjs"` 将 CSS/JS 同步内联到模板 index.html。只改原型数据时无需重建。
