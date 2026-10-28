// Snapshot the pristine shell before init renders cards and the PRD editor.
let portableSource = '';
document.addEventListener('DOMContentLoaded', () => {
  portableSource = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
});

async function portableReplace(text, pattern, replace) {
  const matches = [...text.matchAll(pattern)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    text = text.slice(0, match.index) + await replace(match) + text.slice(match.index + match[0].length);
  }
  return text;
}

async function buildPortableHtml(data) {
  if (!portableSource) throw new Error('工作台尚未加载完成，请稍后重试');
  const doc = new DOMParser().parseFromString(portableSource, 'text/html');
  const dataScript = doc.getElementById('workbench-data');
  if (!dataScript) throw new Error('模板缺少 workbench-data 数据入口，请更新 Skill 模板');
  if (doc.querySelector('script[src],link[rel="stylesheet"]')) {
    throw new Error('模板仍引用外部脚本或样式，请使用新版自包含模板，或让 Agent 运行 export 命令');
  }
  const next = JSON.parse(JSON.stringify(data));
  const cache = new Map();
  async function embed(ref) {
    ref = ref.trim();
    if (!ref || /^(?:data:|#)/i.test(ref)) return ref;
    if (location.protocol === 'file:') throw new Error('本地文件素材尚未内联：' + ref + '；请让 Agent 运行 export 命令后再打开导出文件');
    const url = new URL(ref, location.href);
    if (!/^https?:$/.test(url.protocol) || url.origin !== location.origin) throw new Error('无法内联外部素材：' + ref);
    if (!cache.has(url.href)) cache.set(url.href, (async () => {
      const response = await fetch(url.href, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('素材读取失败：' + ref + '（HTTP ' + response.status + '）');
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('素材内联失败：' + ref));
        reader.readAsDataURL(blob);
      });
    })());
    return cache.get(url.href);
  }
  async function css(text) {
    if (/@import\b/i.test(text)) throw new Error('仍有未内联的 CSS 导入，请让 Agent 运行 export 命令');
    return portableReplace(text, /(?<![\w-])url\(\s*(["']?)([^"')]+)\1\s*\)/gi,
      async match => 'url("' + await embed(match[2]) + '")');
  }
  async function resources(owner) {
    if (owner.querySelector('script[src],link[rel="stylesheet"]')) throw new Error('原型含外部脚本或样式，请先由 Agent 内联');
    for (const element of owner.querySelectorAll('[src],[poster],[srcset],object[data],image[href],use[href]')) {
      if (element.hasAttribute('srcset')) throw new Error('原型含 srcset 素材，请由 Agent 改为内联 src 后重试');
      for (const attr of ['src', 'poster', 'data', 'href']) {
        if (element.hasAttribute(attr)) element.setAttribute(attr, await embed(element.getAttribute(attr)));
      }
    }
    for (const style of owner.querySelectorAll('style')) style.textContent = await css(style.textContent);
    for (const styled of owner.querySelectorAll('[style]')) styled.setAttribute('style', await css(styled.getAttribute('style')));
  }
  for (const item of [...(next.pages || []).flatMap(page => page.cards || []), ...(next.prd?.sections || [])]) {
    const content = new DOMParser().parseFromString('<!DOCTYPE html><html><head></head><body>' + (item.html || '') + '</body></html>', 'text/html');
    await resources(content);
    item.html = content.head.innerHTML + content.body.innerHTML;
  }
  await resources(doc);
  dataScript.textContent = 'const WORKBENCH_DATA = window.WORKBENCH_DATA = ' + JSON.stringify(next, null, 2).replace(/</g, '\\u003c') + ';';
  if (next.project?.title) doc.title = next.project.title;
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

function timestampSuffix(date = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return date.getFullYear() + p(date.getMonth() + 1) + p(date.getDate()) + '-' + p(date.getHours()) + p(date.getMinutes()) + p(date.getSeconds());
}

async function downloadWorkbench(data, suffix = '') {
  const html = await buildPortableHtml(data);
  const title = String(data.project?.title || 'prototype').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/\.+$/g, '').trim() || 'prototype';
  const filename = title + suffix + '-' + timestampSuffix() + '.html';
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return filename;
}
