# 工作台操作

技能根目录记为 <skill>，用户项目目录记为 <project>。所有路径加引号。

## 初始化

运行 node "<skill>/scripts/workbench.cjs" init "<project>"，直接在项目目录仅创建自包含的 index.html；index.html 或旧版 demo/ 已存在时拒绝覆盖。模板内的 css/ 和 js/ 仅用于维护，不复制到项目。不生成 prd/、uploads/ 或 workbench-data.json。

## 定位和修改

```sh
node "<skill>/scripts/workbench.cjs" inspect "<project>/index.html"
node "<skill>/scripts/workbench.cjs" read "<project>/index.html" --cards card-overview
node "<skill>/scripts/workbench.cjs" read "<project>/index.html" --pages page-overview --sections sec-overview
node "<skill>/scripts/workbench.cjs" validate "<project>/index.html"
```

先索引，再按卡片、页面或章节读取完整区域。读取已有目标 PRD 章节后才改它；本轮已读原文直接复用，不逐行分页反复拼接整份文件。

- 新建或修改页面结构：将完整数据对象写入项目目录之外的临时 JSON 文件，执行 `apply INDEX DATA.json`，只替换 index.html 数据区，其他框架逐字保留；成功后删除本次创建的临时文件，不在项目中保留 workbench-data.json。已有工作台必须先读取完整数据以保留无关内容，或使用宿主精确文本编辑工具局部修改，避免用片段覆盖完整数据。
- 仅改卡片 HTML：写替换数组到 `<project>/card-edits.json`，执行 `edit-cards INDEX EDITS.json`。每项为 `{"card_ids":["card-overview"],"old_string":"原文","new_string":"替换文本","expected_count":1}`。全部匹配并通过校验才提交；失败不部分写入。
- 仅改 PRD：优先宿主精确编辑工具修改目标章节。JSON 字符串内 HTML 必须正确转义，尤其 `<` 建议写成 `\u003c`，禁止原始 `</script>` 截断外层数据脚本。
- 同一文件顺序编辑，锚点失败重新定位一次，仍失败就报告具体问题。不要循环读取已确认区域。
- `apply` 或 `edit-cards` 成功已包含静态校验；无需对同一版本再次校验。宿主工具修改后调用 validate。

## 浏览器编辑与单文件导出

模板入口已内联公共 CSS 和 JavaScript，可直接用浏览器打开。右栏点击「编辑」修改 PRD，点击「保存」直接下载新的 HTML，文件名自动追加本地时间戳 `YYYYMMDD-HHmmss`（形如 `项目名-updated-20261022-153012.html`）；不弹文件选择器，也不覆盖原文件。点击「取消」放弃本次未保存修改。画布顶栏「导出」同样生成新的单文件下载（形如 `项目名-20261022-153012.html`）。原型内部点击联动本版不扩展，原有页面切换与卡片标题选择仍按 ID 关联 PRD。

为保证 file:// 下也能保存和导出，素材写入 data URI，确保交付为单文件；对已有项目使用本地相对素材时，Agent 先用下述 CLI 导出为自包含文件再交付。浏览器不能读取相对素材时会报错，不应声称导出成功。下载的新文件可用于替换原文件或归档，或让 Agent 读取下载文件继续迭代。

命令行导出仍可用，实际输出文件名会自动追加 `-YYYYMMDD-HHmmss` 时间戳，返回结果中的 `output` 是真实路径：

```sh
node "<skill>/scripts/workbench.cjs" export "<project>/index.html" "<project>/prototype.html"
```

已有项目使用本地相对路径时，素材可放在入口旁的 assets/；新项目将素材内嵌以保持单文件交付。禁止 CDN、在线字体、远程图片或依赖服务端的业务逻辑。导出内联 CSS、JS 和本地素材，遇到无法内联的资源应处理错误而非交付缺资源文件。输出文件若已存在，先选择新文件名或获得用户明确覆盖指示。


## 模板维护

仅修改工作台模板框架源码时，运行 node "<skill>/scripts/build-template.cjs"，将 assets/template/css/ 和 js/ 同步内联到 assets/template/index.html。修改用户原型数据无需重建；用户产物不写回模板。
