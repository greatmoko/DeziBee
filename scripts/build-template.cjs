#!/usr/bin/env node
'use strict';
// Maintainer helper: refresh the portable entry from its bundled framework sources.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '../assets/template');
const index = path.join(root, 'index.html');
let html = fs.readFileSync(index, 'utf8').replace(/\r\n/g, '\n');
function css(file, seen = new Set()) {
  if (seen.has(file)) throw new Error('Circular stylesheet import');
  const next = new Set([...seen, file]);
  return fs.readFileSync(file, 'utf8').replace(/@import\s+url\(["']?([^"')]+)["']?\)\s*;/g,
    (_, name) => css(path.resolve(path.dirname(file), name), next));
}
const names = ['navigation.js','canvas.js','cards.js','prd.js','prd_editor.js','interactions.js','portable.js','bootstrap.js'];
const code = names.map(name => fs.readFileSync(path.join(root,'js',name),'utf8')).join('\n');
new vm.Script(code);
const style = '<!-- dezibee:styles:start -->\n<style>\n' + css(path.join(root,'css/workbench.css')).replace(/<\/style/gi,'<\\/style') + '\n</style>\n<!-- dezibee:styles:end -->';
const script = '<!-- dezibee:scripts:start -->\n<script>\n' + code.replace(/<\/script/gi,'<\\/script') + '\n</script>\n<!-- dezibee:scripts:end -->';
html = html.replace(/<!-- dezibee:styles:start -->[\s\S]*?<!-- dezibee:styles:end -->|<link\b[^>]*href="css\/workbench.css"[^>]*>/, () => style);
html = html.replace(/<!-- dezibee:scripts:start -->[\s\S]*?<!-- dezibee:scripts:end -->|<script src="js\/workbench.js"><\/script>/, () => script);
html = html.replace('<script>window.__DEZIBEE_EXPORT__=true;</script>\n','');
if (!html.includes('<script id="workbench-data">')) {
  html = html.replace(/<script>(?=\s*\/\*(?:(?!<\/script>)[\s\S])*?const WORKBENCH_DATA\s*=)/, '<script id="workbench-data">');
}
if ((html.match(/<script id="workbench-data">/g) || []).length !== 1) throw new Error('Expected one data script');
html = html.replace('title="直接编辑产品需求说明书；保存会写回 demo/index.html"','title="编辑产品需求说明书"').replace('title="保存到 demo/index.html（Ctrl+S）"','title="下载新的 HTML（Ctrl+S）"');
fs.writeFileSync(index, html, 'utf8');
console.log(JSON.stringify({ok:true,index,bytes:Buffer.byteLength(html)}));
