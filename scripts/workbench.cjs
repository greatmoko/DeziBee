#!/usr/bin/env node
'use strict';
// Portable DeziBee helpers. Uses only Node.js built-ins; never executes prototype code.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

function fail(message) { throw new Error(message); }
function load(file) { return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''); }
function json(file) { return JSON.parse(load(file)); }
function locate(text) {
  const match = /\bconst\s+WORKBENCH_DATA\s*=\s*(?:window\.WORKBENCH_DATA\s*=\s*)?/.exec(text);
  if (!match || text[match.index + match[0].length] !== '{') fail('Expected const WORKBENCH_DATA = {strict JSON};');
  const start = match.index + match[0].length;
  let depth = 0, quoted = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (escape) escape = false; else if (ch === '\\') escape = true; else if (ch === '"') quoted = false; continue; }
    if (ch === '"') quoted = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') { if (--depth === 0) return { start, end: i + 1, data: JSON.parse(text.slice(start, i + 1)) }; }
  }
  fail('WORKBENCH_DATA is incomplete. Only strict JSON data is supported.');
}
function serialize(data) { return JSON.stringify(data, null, 2).replace(/</g, '\\u003c'); }
function substitute(text, data) { const span = locate(text); return text.slice(0, span.start) + serialize(data) + text.slice(span.end); }
function hash(text) { return crypto.createHash('sha256').update(text).digest('hex'); }
function objects(value, name) {
  if (!Array.isArray(value) || value.some(x => !x || typeof x !== 'object' || Array.isArray(x))) fail(name + ' must be an array of objects');
  return value;
}
function htmlErrors(html, label) {
  const errors = [], stack = [];
  const containers = new Set(['div','section','main','header','footer','nav','aside','form','label','fieldset','button','select','textarea']);
  const tags = /<!--[\s\S]*?-->|<style\b[^>]*>[\s\S]*?<\/style\s*>|<script\b([^>]*)>([\s\S]*?)<\/script\s*>|<\/?([a-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  let match;
  while ((match = tags.exec(html))) {
    if (match[0].startsWith('<!--') || /^<style\b/i.test(match[0])) continue;
    if (match[1] !== undefined) {
      const type = /\btype\s*=\s*["']([^"']*)["']/i.exec(match[1]);
      if (!/\bsrc\s*=/i.test(match[1]) && (!type || /^(?:text\/javascript|application\/javascript)$/.test(type[1]))) {
        try { new vm.Script(match[2]); } catch (e) { errors.push(label + ': inline JavaScript: ' + e.message); }
      }
      continue;
    }
    const name = match[3].toLowerCase();
    if (containers.has(name)) {
      if (match[0].startsWith('</')) {
        if (stack.at(-1) !== name) errors.push(label + ': unexpected </' + name + '>, expected ' + (stack.at(-1) || 'none'));
        else stack.pop();
      } else if (match[0].endsWith('/>')) errors.push(label + ': non-void <' + name + '/>');
      else stack.push(name);
    }
    for (const handler of match[0].matchAll(/\bon\w+\s*=\s*(["'])([\s\S]*?)\1/gi)) {
      const code = handler[2].replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      try { new vm.Script('(function(event){' + code + '\n})'); } catch (e) { errors.push(label + ': event handler: ' + e.message); }
    }
  }
  if (stack.length) errors.push(label + ': unclosed containers: ' + stack.join(', '));
  if ((html.match(/<script\b/gi) || []).length !== (html.match(/<\/script\s*>/gi) || []).length) errors.push(label + ': unclosed script');
  return errors;
}
function validate(data, text) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('WORKBENCH_DATA must be an object');
  const pages = objects(data.pages, 'pages');
  if (!pages.length) errors.push('At least the requirement overview page is required');
  const cards = pages.flatMap(p => objects(p.cards || [], 'cards'));
  if (!data.prd || typeof data.prd !== 'object') fail('prd is required');
  const sections = objects(data.prd.sections, 'prd.sections');
  const links = objects(data.links || [], 'links');
  const ids = new Set();
  for (const item of [...pages, ...cards, ...sections, ...links]) {
    if (typeof item.id !== 'string' || !item.id) errors.push('Every page/card/section/link needs a nonempty string id');
    else if (ids.has(item.id)) errors.push('Duplicate id: ' + item.id);
    else ids.add(item.id);
  }
  const cardIds = new Set(cards.map(c => c.id)), sectionIds = new Set(sections.map(s => s.id));
  for (const item of [...pages, ...cards]) if (item.prdId && !sectionIds.has(item.prdId)) errors.push(item.id + ': missing PRD section ' + item.prdId);
  for (const card of cards) {
    if (!card.prdId) errors.push(card.id + ': prdId is required');
    for (const key of ['x','y','w','h']) if (!Number.isFinite(card[key]) || ((key === 'w' || key === 'h') && card[key] <= 0)) errors.push(card.id + ': invalid ' + key);
    if (card.shell && !['phone','tablet','browser'].includes(card.shell)) errors.push(card.id + ': unsupported shell');
  }
  for (const link of links) if (!cardIds.has(link.from) || !cardIds.has(link.to)) errors.push(link.id + ': missing card endpoint');
  for (const item of [...cards, ...sections]) {
    if (typeof item.html !== 'string') { errors.push(item.id + ': html must be a string'); continue; }
    errors.push(...htmlErrors(item.html, item.id));
    for (const ref of item.html.matchAll(/\bdata-card-ref\s*=\s*["']([^"']+)["']/g)) if (!cardIds.has(ref[1])) errors.push(item.id + ': missing referenced card ' + ref[1]);
  }
  if (text) {
    if (!/<\/body\s*>/i.test(text) || !/<\/html\s*>/i.test(text)) errors.push('Incomplete HTML document');
    for (const script of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      const type = /\btype\s*=\s*["']([^"']*)["']/i.exec(script[1]);
      if (/\bsrc\s*=/i.test(script[1]) || (type && !/^(?:text\/javascript|application\/javascript)$/.test(type[1]))) continue;
      try { new vm.Script(script[2]); } catch (e) { errors.push('Document inline JavaScript: ' + e.message); }
    }
  }
  return { ok: !errors.length, pages: pages.length, cards: cards.length, sections: sections.length, errors,
    scope: 'Static JSON, IDs, relations, dimensions, selected HTML containers and classic inline JavaScript syntax. Visuals and interactions were not executed.' };
}
function checked(data, text) { const report = validate(data, text); if (!report.ok) fail(report.errors.join('\n')); return report; }
function save(file, text, original) {
  if (original !== undefined && load(file) !== original) fail('File changed during editing; no write performed');
  const temp = file + '.' + crypto.randomBytes(6).toString('hex') + '.tmp';
  try { fs.writeFileSync(temp, text, { encoding: 'utf8', flag: 'wx' }); fs.renameSync(temp, file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
function local(root, base, ref) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/|\\)/i.test(ref)) fail('Export requires local relative resources: ' + ref);
  const candidate = fs.realpathSync(path.resolve(base, decodeURIComponent(ref.split(/[?#]/)[0])));
  const relative = path.relative(fs.realpathSync(root), candidate);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) fail('Resource escapes demo directory: ' + ref);
  if (!fs.statSync(candidate).isFile()) fail('Resource is not a file: ' + ref);
  return candidate;
}
const mime = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon','.avif':'image/avif','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf'};
function assets(root, base, text) {
  function inline(ref) {
    if (/^(?:data:|blob:|#|mailto:|tel:)/i.test(ref)) return ref;
    const ext = path.extname(ref.split(/[?#]/)[0]).toLowerCase();
    if (!mime[ext]) fail('Cannot embed resource type: ' + ref);
    return 'data:' + mime[ext] + ';base64,' + fs.readFileSync(local(root, base, ref)).toString('base64');
  }
  return text.replace(/(\b(?:src|href|poster)\s*=\s*)(["'])([^"']+)\2/gi, (all, prefix, quote, ref) => prefix + quote + inline(ref) + quote)
    .replace(/(?<![\w-])url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (all, quote, ref) => 'url("' + inline(ref.trim()) + '")');
}
function bundle(index, output) {
  const root = path.dirname(path.resolve(index));
  let text = load(index), data = locate(text).data;
  checked(data, text);
  for (const item of [...data.pages.flatMap(p => p.cards || []), ...data.prd.sections]) item.html = assets(root, root, item.html);
  text = substitute(text, data);
  function css(file, seen = new Set()) {
    if (seen.has(file)) fail('Circular CSS import: ' + file);
    const next = new Set([...seen, file]);
    return assets(root, path.dirname(file), load(file).replace(/@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*;/gi,
      (_, ref) => css(local(root, path.dirname(file), ref), next)));
  }
  text = text.replace(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi, (_, ref) => '<style>\n' + css(local(root, root, ref)).replace(/<\/style/gi, '<\\/style') + '\n</style>');
  text = text.replace(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script>/gi, (_, ref) => {
    const file = local(root, root, ref);
    let source = load(file);
    if (source.startsWith('// DeziBee 分模块入口')) {
      const names = ['navigation.js','canvas.js','cards.js','prd.js','prd_editor.js','interactions.js','portable.js','bootstrap.js'];
      source = names.map(name => load(local(root, path.dirname(file), name))).join('\n');
    }
    new vm.Script(source);
    return '<script>\n' + source.replace(/<\/script/gi, '<\\/script') + '\n</script>';
  });
  if (fs.existsSync(output)) fail('Output already exists; choose a new export filename');
  fs.writeFileSync(output, text, {encoding:'utf8', flag:'wx'});
  return {ok:true, output:path.resolve(output), scope:'Local assets embedded; prototype scripts may still make requests if authored to do so. No prototype code was executed.'};
}
function main(args) {
  const [command, file, second, ...rest] = args;
  if (!command || command === '--help') return {ok:true, usage:['init TARGET','inspect INDEX','read INDEX [--pages ids] [--cards ids] [--sections ids]','validate INDEX','apply INDEX DATA.json','edit-cards INDEX EDITS.json','export INDEX OUTPUT.html'], runtime:'Node.js built-ins only; no npm install'};
  if (!file) fail('Missing path; use --help');
  if (command === 'init') {
    const root = path.resolve(file), demo = path.join(root, 'demo');
    if (fs.existsSync(demo)) fail('demo already exists; refusing to overwrite');
    const source = path.resolve(__dirname, '../assets/template');
    checked(locate(load(path.join(source,'index.html'))).data, load(path.join(source,'index.html')));
    fs.mkdirSync(root, {recursive:true});
    fs.cpSync(source, demo, {recursive:true, errorOnExist:true, force:false});
    for (const name of ['prd','uploads']) fs.mkdirSync(path.join(root,name), {recursive:true});
    return {ok:true, index:path.join(demo,'index.html')};
  }
  const text = load(file), {data} = locate(text), cards = data.pages.flatMap(p => p.cards || []), sections = data.prd.sections;
  if (command === 'inspect') return {ok:true, file_hash:hash(text), project:data.project, pages:data.pages.map(p => ({id:p.id,name:p.name,prdId:p.prdId,cards:(p.cards||[]).map(c=>({id:c.id,name:c.name,prdId:c.prdId,html_chars:c.html.length}))})),sections:sections.map(s=>({id:s.id,title:s.title}))};
  if (command === 'validate') return {...validate(data,text),file_hash:hash(text)};
  if (command === 'read') {
    const options = [second,...rest].filter(x=>x!==undefined), selected = {pages:[],cards:[],sections:[]};
    for (let i=0;i<options.length;i+=2) {
      const key = options[i].replace(/^--/,'');
      if (!(key in selected) || !options[i+1]) fail('Use --pages/--cards/--sections comma-separated IDs');
      selected[key].push(...options[i+1].split(','));
    }
    if (!Object.values(selected).some(x=>x.length)) fail('Select at least one page, card or section');
    const choose = (items, ids) => ids.map(id => items.find(x=>x.id===id) || fail('Unknown id: '+id));
    const pages = choose(data.pages,selected.pages), picked = choose(cards,selected.cards);
    const related = [...pages,...pages.flatMap(p=>p.cards||[]),...picked].map(x=>x.prdId).filter(Boolean);
    return {ok:true,file_hash:hash(text),pages,cards:picked,sections:choose(sections,[...new Set([...selected.sections,...related])])};
  }
  if (command === 'apply' || command === 'edit-cards') {
    if (!second) fail('Missing JSON input file');
    let updated = command === 'apply' ? json(second) : data;
    if (command === 'edit-cards') {
      const edits = json(second);
      if (!Array.isArray(edits) || !edits.length) fail('Edits must be a nonempty array');
      for (const edit of edits) {
        if (!Array.isArray(edit.card_ids) || !edit.card_ids.length || new Set(edit.card_ids).size!==edit.card_ids.length || typeof edit.old_string!=='string' || !edit.old_string || typeof edit.new_string!=='string') fail('Invalid edit');
        const count = edit.expected_count === undefined ? 1 : edit.expected_count;
        if (!Number.isInteger(count) || count<1) fail('expected_count must be a positive integer');
        for (const id of edit.card_ids) {
          const card = cards.find(c=>c.id===id); if (!card) fail('Unknown card: '+id);
          const found = card.html.split(edit.old_string).length-1;
          if (found!==count) fail(id+': found '+found+' occurrences; expected '+count+'; nothing written');
          card.html = card.html.split(edit.old_string).join(edit.new_string);
        }
      }
    }
    const report = checked(updated,text), final = substitute(text,updated);
    save(file,final,text);
    return {...report,changed:final!==text,validation_ok:true,file_hash:hash(final)};
  }
  if (command === 'export') { if (!second) fail('Missing output path'); return bundle(file,second); }
  fail('Unknown command: '+command);
}
try {
  const result = main(process.argv.slice(2));
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if (result.ok===false) process.exitCode=1;
} catch (error) { process.stdout.write(JSON.stringify({ok:false,error:error.message},null,2)+'\n'); process.exitCode=1; }
